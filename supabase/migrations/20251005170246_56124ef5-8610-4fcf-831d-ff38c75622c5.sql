-- Add parent_comment_id to enable nested replies
ALTER TABLE public.post_comments
ADD COLUMN parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Add index for faster nested comment queries
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id);

-- Add index for faster post comment queries
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);