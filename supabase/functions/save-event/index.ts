import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create Supabase client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Send notification to Telegram
async function sendTelegramNotification(message: string) {
  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('Telegram configuration missing, skipping notification');
      return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    console.log('Telegram notification sent successfully');
  } catch (error) {
    console.error('Error sending Telegram notification (continuing with event save):', error);
    // Don't throw the error - we want the event save to continue even if notification fails
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const { eventData, isNew } = await req.json();
    
    // Validate required fields
    if (!eventData) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: eventData' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing ${isNew ? 'new' : 'existing'} event:`, eventData.id);

    let result;
    
    if (isNew) {
      // Insert new event
      const { data, error } = await supabaseAdmin
        .from('events')
        .insert([eventData])
        .select();

      if (error) throw error;
      result = data;
      
      // Try to send notification for new event (non-blocking)
      const message = `
🎉 <b>Новое мероприятие создано</b>

📅 Название: ${eventData.title}
📆 Дата: ${eventData.date}
⏰ Время: ${eventData.start_time ? new Date(eventData.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'} - ${eventData.end_time ? new Date(eventData.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'}
📍 Место: ${eventData.location || 'Не указано'}
💰 Стоимость: ${eventData.payment_type === 'free' ? 'Бесплатно' : `${eventData.price} ${eventData.currency}`}
🏷️ Статус: ${eventData.status === 'active' ? 'Активно' : 'Черновик'}
`;

      // Send notification without awaiting to prevent blocking the main operation
      sendTelegramNotification(message).catch(error => {
        console.error('Telegram notification failed (non-blocking):', error);
      });
    } else {
      // Update existing event
      const { data, error } = await supabaseAdmin
        .from('events')
        .update(eventData)
        .eq('id', eventData.id)
        .select();

      if (error) throw error;
      result = data;
      
      // Try to send notification for updated event (non-blocking)
      const message = `
🔄 <b>Мероприятие обновлено</b>

📅 Название: ${eventData.title}
📆 Дата: ${eventData.date}
⏰ Время: ${eventData.start_time ? new Date(eventData.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'} - ${eventData.end_time ? new Date(eventData.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'}
📍 Место: ${eventData.location || 'Не указано'}
💰 Стоимость: ${eventData.payment_type === 'free' ? 'Бесплатно' : `${eventData.price} ${eventData.currency}`}
🏷️ Статус: ${eventData.status === 'active' ? 'Активно' : 'Черновик'}
`;

      // Send notification without awaiting to prevent blocking the main operation
      sendTelegramNotification(message).catch(error => {
        console.error('Telegram notification failed (non-blocking):', error);
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: result,
        message: `Event ${isNew ? 'created' : 'updated'} successfully`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing event:', error);
    
    // Check if this is the pg_net schema error and provide a helpful message
    if (error.message && error.message.includes('schema "net" does not exist')) {
      console.error('pg_net extension not enabled - notifications will be disabled');
      return new Response(
        JSON.stringify({ 
          error: 'Database extension missing for notifications, but event operation failed for another reason',
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});