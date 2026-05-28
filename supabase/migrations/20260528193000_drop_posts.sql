-- Remove post feed schema: tables, triggers, and SQL functions

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON public.post_comments;
DROP TRIGGER IF EXISTS update_post_like_count_trigger ON public.post_likes;
DROP TRIGGER IF EXISTS update_comment_likes_count ON public.comment_likes;
DROP TRIGGER IF EXISTS trigger_update_comment_count_on_insert ON public.post_comments;
DROP TRIGGER IF EXISTS trigger_update_comment_count_on_delete ON public.post_comments;
DROP TRIGGER IF EXISTS update_comment_like_count_trigger ON public.comment_likes;
DROP TRIGGER IF EXISTS update_featured_resumes_updated_at ON public.featured_resumes;

DROP FUNCTION IF EXISTS public.get_featured_resumes();
DROP FUNCTION IF EXISTS public.update_post_comment_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_like_count() CASCADE;

DROP TABLE IF EXISTS public.comment_likes CASCADE;
DROP TABLE IF EXISTS public.post_views CASCADE;
DROP TABLE IF EXISTS public.post_shares CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.saved_posts CASCADE;
DROP TABLE IF EXISTS public.hidden_posts CASCADE;
DROP TABLE IF EXISTS public.post_reports CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.featured_resumes CASCADE;
