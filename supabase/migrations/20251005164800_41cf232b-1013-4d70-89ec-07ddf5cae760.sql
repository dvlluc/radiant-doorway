-- Create a function to update comment counts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment insertions
DROP TRIGGER IF EXISTS trigger_update_comment_count_on_insert ON post_comments;
CREATE TRIGGER trigger_update_comment_count_on_insert
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Create trigger for comment deletions
DROP TRIGGER IF EXISTS trigger_update_comment_count_on_delete ON post_comments;
CREATE TRIGGER trigger_update_comment_count_on_delete
AFTER DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- Fix existing comment counts by recalculating them
UPDATE posts
SET comments_count = (
  SELECT COUNT(*) 
  FROM post_comments 
  WHERE post_comments.post_id = posts.id
);