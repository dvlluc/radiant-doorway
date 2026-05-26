
ALTER TABLE public.blocked_time
ADD COLUMN repeat_type text NOT NULL DEFAULT 'none',
ADD COLUMN repeat_days text[] DEFAULT '{}',
ADD COLUMN repeat_end_date date;
