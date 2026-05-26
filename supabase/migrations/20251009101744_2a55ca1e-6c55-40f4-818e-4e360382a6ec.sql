-- Add 'launch' to the allowed post_type values
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE public.posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('tip', 'question', 'video', 'review', 'post', 'launch'));