/*
  # Add website analytics functions
  
  1. New Functions
    - `get_detailed_page_stats`: Gets detailed statistics for each page
    - `get_traffic_by_hour`: Gets traffic distribution by hour of day
    - `get_traffic_by_day`: Gets traffic distribution by day of week
    
  2. Purpose
    - Support detailed analytics for the website analytics page
    - Provide data for charts and tables
*/

-- Function to get detailed page statistics
CREATE OR REPLACE FUNCTION get_detailed_page_stats(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  exclude_admin BOOLEAN DEFAULT true
)
RETURNS TABLE (
  page TEXT,
  visits BIGINT,
  unique_visitors BIGINT,
  avg_time_spent NUMERIC,
  bounce_rate NUMERIC,
  last_visit TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    path as page,
    COUNT(*)::BIGINT as visits,
    COUNT(DISTINCT session_id)::BIGINT as unique_visitors,
    COALESCE(AVG(time_spent)::NUMERIC, 0) as avg_time_spent,
    -- Calculate bounce rate (percentage of visits with only one page view)
    ROUND(
      (COUNT(CASE WHEN (
        SELECT COUNT(*) 
        FROM page_views pv2 
        WHERE pv2.session_id = page_views.session_id
      ) = 1 THEN 1 ELSE NULL END)::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100
    ), 1) as bounce_rate,
    MAX(created_at) as last_visit
  FROM page_views
  WHERE 
    created_at >= start_date AND 
    created_at <= end_date AND
    (NOT exclude_admin OR is_admin = false)
  GROUP BY path
  ORDER BY visits DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get traffic by hour of day
CREATE OR REPLACE FUNCTION get_traffic_by_hour(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  exclude_admin BOOLEAN DEFAULT true
)
RETURNS TABLE (
  hour INTEGER,
  visits BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM created_at)::INTEGER as hour,
    COUNT(*)::BIGINT as visits
  FROM page_views
  WHERE 
    created_at >= start_date AND 
    created_at <= end_date AND
    (NOT exclude_admin OR is_admin = false)
  GROUP BY hour
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql;

-- Function to get traffic by day of week
CREATE OR REPLACE FUNCTION get_traffic_by_day(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  exclude_admin BOOLEAN DEFAULT true
)
RETURNS TABLE (
  day TEXT,
  visits BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE EXTRACT(DOW FROM created_at)::INTEGER
      WHEN 0 THEN 'Вс'
      WHEN 1 THEN 'Пн'
      WHEN 2 THEN 'Вт'
      WHEN 3 THEN 'Ср'
      WHEN 4 THEN 'Чт'
      WHEN 5 THEN 'Пт'
      WHEN 6 THEN 'Сб'
    END as day,
    COUNT(*)::BIGINT as visits
  FROM page_views
  WHERE 
    created_at >= start_date AND 
    created_at <= end_date AND
    (NOT exclude_admin OR is_admin = false)
  GROUP BY EXTRACT(DOW FROM created_at)::INTEGER
  ORDER BY EXTRACT(DOW FROM created_at)::INTEGER;
END;
$$ LANGUAGE plpgsql;