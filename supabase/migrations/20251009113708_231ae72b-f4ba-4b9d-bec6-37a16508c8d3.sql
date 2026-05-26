-- Create table to track post views and clicks
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clicked BOOLEAN DEFAULT false,
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own post views
CREATE POLICY "Users can view their own post views"
  ON public.post_views
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own post views
CREATE POLICY "Users can insert their own post views"
  ON public.post_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own post views
CREATE POLICY "Users can update their own post views"
  ON public.post_views
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at DESC);