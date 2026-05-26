-- Create a function to create a conversation with participants atomically
CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  _user1_id uuid,
  _user2_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation_id uuid;
BEGIN
  -- Create the conversation
  INSERT INTO public.conversations (id)
  VALUES (gen_random_uuid())
  RETURNING id INTO _conversation_id;
  
  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (_conversation_id, _user1_id),
    (_conversation_id, _user2_id);
  
  RETURN _conversation_id;
END;
$$;