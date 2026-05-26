-- Enable realtime for messages table so subscribers can receive updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;