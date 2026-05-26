-- Function to create notification when a new message is sent
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
BEGIN
  -- Get sender's name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone')
  INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Find all other participants in the conversation and notify them
  FOR recipient_id IN 
    SELECT user_id 
    FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    -- Create notification for each recipient
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      read,
      action_url
    ) VALUES (
      recipient_id,
      'message',
      'New Message',
      sender_name || ' sent you a message',
      false,
      '/account?tab=messages'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to fire after message insert
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();