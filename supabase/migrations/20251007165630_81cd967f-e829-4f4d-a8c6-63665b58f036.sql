-- Create business_photo_comments table
CREATE TABLE IF NOT EXISTS public.business_photo_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.business_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.business_photo_comments(id) ON DELETE CASCADE,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_photo_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.business_photo_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.business_photo_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.business_photo_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.business_photo_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create business_photo_comment_likes table
CREATE TABLE IF NOT EXISTS public.business_photo_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.business_photo_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.business_photo_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Users can view comment likes"
  ON public.business_photo_comment_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.business_photo_comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON public.business_photo_comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update comment like count
CREATE OR REPLACE FUNCTION public.update_business_photo_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_photo_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_photo_comments 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER update_business_photo_comment_like_count_trigger
AFTER INSERT OR DELETE ON public.business_photo_comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_business_photo_comment_like_count();

-- Create trigger for updated_at
CREATE TRIGGER update_business_photo_comments_updated_at
BEFORE UPDATE ON public.business_photo_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();