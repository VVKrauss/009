import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Define types
interface TimeSpentData {
  session_id: string;
  path: string;
  time_spent: number;
}

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Handle requests
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const data: TimeSpentData = await req.json();
    
    // Validate required fields
    if (!data.session_id || !data.path || data.time_spent === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, path, and time_spent are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the most recent page view for this session and path
    const { data: pageViews, error: fetchError } = await supabase
      .from('page_views')
      .select('id')
      .eq('session_id', data.session_id)
      .eq('path', data.path)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (pageViews && pageViews.length > 0) {
      // Update the time spent
      const { error: updateError } = await supabase
        .from('page_views')
        .update({ time_spent: data.time_spent })
        .eq('id', pageViews[0].id);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'No matching page view found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating time spent:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});