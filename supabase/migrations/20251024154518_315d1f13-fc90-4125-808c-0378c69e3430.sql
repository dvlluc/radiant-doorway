-- Add reminder tracking to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_lookup 
ON public.appointments(start_time, reminder_sent_at) 
WHERE status = 'scheduled' AND reminder_sent_at IS NULL;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reminder function to run every hour
SELECT cron.schedule(
  'send-appointment-reminders',
  '0 * * * *', -- Run at the start of every hour
  $$
  SELECT
    net.http_post(
        url:='https://riwupyirhdyzazwinpts.supabase.co/functions/v1/send-appointment-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpd3VweWlyaGR5emF6d2lucHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzU1MjcsImV4cCI6MjA3NTAxMTUyN30.FR0403dL4H0wBPfBuNZsQQ_bLezmoekhfqvu8QDTJL4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);