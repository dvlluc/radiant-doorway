-- Drop existing triggers if any
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON post_comments;
DROP TRIGGER IF EXISTS update_comment_like_count_trigger ON comment_likes;
DROP TRIGGER IF EXISTS update_post_like_count_trigger ON post_likes;

-- Create trigger for updating post comment count
CREATE TRIGGER update_post_comment_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Create trigger for updating comment like count
CREATE TRIGGER update_comment_like_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- Create function to update post likes count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for updating post like count
CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Recalculate all counts to fix existing inaccuracies
UPDATE posts
SET 
  likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = posts.id);

UPDATE post_comments
SET likes_count = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = post_comments.id);