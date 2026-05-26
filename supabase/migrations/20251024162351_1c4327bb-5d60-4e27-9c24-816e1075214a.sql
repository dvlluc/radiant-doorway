-- Drop the existing is_admin function and its dependencies
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Recreate the security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND (role = 'admin' OR role = 'moderator')
  )
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Recreate the RLS policies for admin_users
CREATE POLICY "Admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Recreate the RLS policies for refund_requests
CREATE POLICY "Admins can view all refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update refund requests" 
ON public.refund_requests 
FOR UPDATE 
USING (public.is_admin(auth.uid()));