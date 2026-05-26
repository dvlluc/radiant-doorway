-- Drop the existing insert policy that's too restrictive
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;

-- Create a new policy that allows customers to create appointments
CREATE POLICY "Customers can create appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (auth.uid() = customer_id);