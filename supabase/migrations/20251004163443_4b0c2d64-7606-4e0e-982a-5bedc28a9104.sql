-- Clear existing welcome notifications
DELETE FROM public.notifications 
WHERE title = 'Welcome to BelloNecta!';

-- Update the handle_confirmed_user function to include welcome notification
CREATE OR REPLACE FUNCTION public.handle_confirmed_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_type_value account_type;
BEGIN
  -- Only proceed if email is confirmed and we haven't processed this user yet
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Get account type from user metadata
    account_type_value := (NEW.raw_user_meta_data->>'account_type')::account_type;
    
    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, account_type)
    VALUES (NEW.id, account_type_value)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create appropriate profile based on account type
    IF account_type_value = 'brand' THEN
      INSERT INTO public.brand_profiles (
        user_id,
        brand_name,
        first_name,
        last_name,
        email,
        telephone,
        website,
        address
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'brand_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'telephone',
        NEW.raw_user_meta_data->>'website',
        COALESCE(NEW.raw_user_meta_data->>'address', '')
      )
      ON CONFLICT (user_id) DO NOTHING;
      
    ELSIF account_type_value = 'business' THEN
      INSERT INTO public.business_profiles (
        user_id,
        business_name,
        first_name,
        last_name,
        email,
        telephone,
        website,
        address
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'telephone',
        NEW.raw_user_meta_data->>'website',
        COALESCE(NEW.raw_user_meta_data->>'address', '')
      )
      ON CONFLICT (user_id) DO NOTHING;
      
    ELSIF account_type_value = 'charitable_partner' THEN
      INSERT INTO public.charitable_profiles (
        user_id,
        organization_name,
        first_name,
        last_name,
        email,
        telephone,
        registration_number,
        website,
        address
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'telephone',
        COALESCE(NEW.raw_user_meta_data->>'registration_number', ''),
        NEW.raw_user_meta_data->>'website',
        COALESCE(NEW.raw_user_meta_data->>'address', '')
      )
      ON CONFLICT (user_id) DO NOTHING;
      
    ELSE
      -- Individual account - update existing profile created by handle_new_user
      UPDATE public.profiles
      SET 
        first_name = NEW.raw_user_meta_data->>'first_name',
        last_name = NEW.raw_user_meta_data->>'last_name',
        display_name = NEW.raw_user_meta_data->>'display_name',
        telephone = NEW.raw_user_meta_data->>'telephone'
      WHERE id = NEW.id;
    END IF;
    
    -- Send welcome notification to all new users
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      read,
      action_url
    ) VALUES (
      NEW.id,
      'system',
      'Welcome to BelloNecta!',
      'Thanks for joining our community. Explore professionals and book your first appointment.',
      false,
      '/discover'
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$;