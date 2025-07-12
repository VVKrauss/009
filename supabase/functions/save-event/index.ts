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

    // Clean the eventData to ensure we're only sending valid fields for the events table
    const cleanEventData = {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      event_type: eventData.event_type,
      bg_image: eventData.bg_image,
      start_at: eventData.start_at,
      end_at: eventData.end_at,
      location: eventData.location,
      age_category: eventData.age_category,
      price: eventData.price,
      currency: eventData.currency,
      status: eventData.status, // This should be text type for events table
      created_at: eventData.created_at,
      updated_at: eventData.updated_at,
      speakers: eventData.speakers,
      max_registrations: eventData.max_registrations,
      current_registration_count: eventData.current_registration_count,
      location_coordinates: eventData.location_coordinates,
      video_url: eventData.video_url,
      photo_gallery: eventData.photo_gallery,
      festival_structure: eventData.festival_structure,
      price_comment: eventData.price_comment,
      payment_type: eventData.payment_type,
      languages: eventData.languages,
      payment_link: eventData.payment_link,
      original_bg_image: eventData.original_bg_image,
      couple_discount: eventData.couple_discount,
      child_half_price: eventData.child_half_price,
      hide_speakers_gallery: eventData.hide_speakers_gallery,
      registrations_list: eventData.registrations_list,
      registration_enabled: eventData.registration_enabled,
      registration_deadline: eventData.registration_deadline,
      registration_limit_per_user: eventData.registration_limit_per_user,
      payment_link_clicks: eventData.payment_link_clicks,
      temp_end_time: eventData.temp_end_time,
      festival_program: eventData.festival_program,
      short_description: eventData.short_description,
      payment_widget_id: eventData.payment_widget_id,
      widget_chooser: eventData.widget_chooser,
      registrations: eventData.registrations,
      oblakkarte_data_event_id: eventData.oblakkarte_data_event_id,
      simple_payment_type: eventData.simple_payment_type,
      online_payment_url: eventData.online_payment_url,
      online_payment_type: eventData.online_payment_type,
      current_registrations: eventData.current_registrations,
      active_registrations_count: eventData.active_registrations_count,
      active_tickets_count: eventData.active_tickets_count,
      total_registrations_count: eventData.total_registrations_count,
      available_spots: eventData.available_spots,
      registration_available: eventData.registration_available
    };

    // Remove undefined values
    Object.keys(cleanEventData).forEach(key => {
      if (cleanEventData[key] === undefined) {
        delete cleanEventData[key];
      }
    });

    let result;
    let eventSaveError = null;
    
    try {
      if (isNew) {
        // Insert new event
        const { data, error } = await supabaseAdmin
          .from('events')
          .insert([cleanEventData])
          .select();

        if (error) throw error;
        result = data;
      } else {
        // Update existing event
        const { data, error } = await supabaseAdmin
          .from('events')
          .update(cleanEventData)
          .eq('id', cleanEventData.id)
          .select();

        if (error) throw error;
        result = data;
      }
    } catch (error) {
      eventSaveError = error;
      console.error('Error saving event to database:', error);
      
      // Check if this is a pg_net related error from database triggers
      if (error.message && (
        error.message.includes('schema "net" does not exist') ||
        error.message.includes('pg_net') ||
        error.message.includes('net.http_post')
      )) {
        console.log('Detected pg_net extension missing - this is likely from a database trigger trying to send notifications');
        
        // Return a specific error message for pg_net issues
        return new Response(
          JSON.stringify({ 
            error: 'Database notification extension (pg_net) is not enabled. Please enable the pg_net extension in your Supabase dashboard under Database > Extensions to allow notification features to work properly.',
            code: 'PG_NET_EXTENSION_MISSING',
            details: error.message 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // For other database errors, throw them normally
      throw error;
    }

    // If event save was successful, try to send notification (non-blocking)
    if (!eventSaveError) {
      const message = `
${isNew ? '🎉 <b>Новое мероприятие создано</b>' : '🔄 <b>Мероприятие обновлено</b>'}

📅 Название: ${cleanEventData.title}
📆 Дата: ${cleanEventData.start_at ? new Date(cleanEventData.start_at).toLocaleDateString('ru-RU') : 'Не указано'}
⏰ Время: ${cleanEventData.start_at ? new Date(cleanEventData.start_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'} - ${cleanEventData.end_at ? new Date(cleanEventData.end_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : 'Не указано'}
📍 Место: ${cleanEventData.location || 'Не указано'}
💰 Стоимость: ${cleanEventData.payment_type === 'free' ? 'Бесплатно' : `${cleanEventData.price} ${cleanEventData.currency}`}
🏷️ Статус: ${cleanEventData.status === 'active' ? 'Активно' : 'Черновик'}
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
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});