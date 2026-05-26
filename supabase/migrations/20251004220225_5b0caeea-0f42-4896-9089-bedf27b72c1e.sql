-- Create table for followed events
CREATE TABLE IF NOT EXISTS public.followed_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.followed_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own followed events"
  ON public.followed_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow events"
  ON public.followed_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow events"
  ON public.followed_events
  FOR DELETE
  USING (auth.uid() = user_id);