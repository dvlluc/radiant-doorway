-- Create table to track event subscriptions
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own event subscriptions"
  ON public.event_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create their own event subscriptions"
  ON public.event_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own event subscriptions"
  ON public.event_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_event_subscriptions_user_id ON public.event_subscriptions(user_id);
CREATE INDEX idx_event_subscriptions_status ON public.event_subscriptions(status);
CREATE INDEX idx_event_subscriptions_event_id ON public.event_subscriptions(event_id);

-- Add trigger for updated_at
CREATE TRIGGER update_event_subscriptions_updated_at
  BEFORE UPDATE ON public.event_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();