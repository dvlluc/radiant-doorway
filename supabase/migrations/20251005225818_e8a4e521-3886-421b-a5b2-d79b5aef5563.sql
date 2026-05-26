-- Add RLS policy to allow users to delete conversations they are part of
CREATE POLICY "Users can delete conversations they participate in"
ON conversations
FOR DELETE
USING (is_conversation_participant(id, auth.uid()));