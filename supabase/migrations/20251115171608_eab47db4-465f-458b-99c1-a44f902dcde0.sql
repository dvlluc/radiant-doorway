-- Fix the CASCADE DELETE issue on posts table
-- This prevents posts from being deleted when profiles are modified

-- Drop the existing foreign key constraint with CASCADE
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Recreate the foreign key constraint with NO ACTION (prevent deletion)
ALTER TABLE public.posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE RESTRICT;

-- Also fix business_id foreign key if it exists
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_business_id_fkey;

-- Don't add foreign key for business_id since it references auth.users
-- which we shouldn't have foreign keys to