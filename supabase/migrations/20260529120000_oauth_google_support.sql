-- Google OAuth users are confirmed on INSERT; extend provisioning for that path.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NULLIF(
        trim(substring(
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
          from position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ' ') || ' ') + 1
        )),
        ''
      )
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_confirmed_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_type_value account_type;
  combined_address text;
  should_process boolean;
BEGIN
  should_process := (
    TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL
  ) OR (
    TG_OP = 'UPDATE'
    AND NEW.email_confirmed_at IS NOT NULL
    AND OLD.email_confirmed_at IS NULL
  );

  IF should_process THEN
    account_type_value := COALESCE(
      (NEW.raw_user_meta_data->>'account_type')::account_type,
      'individual'::account_type
    );

    combined_address := TRIM(CONCAT_WS(', ',
      NULLIF(NEW.raw_user_meta_data->>'streetAddress', ''),
      NULLIF(NEW.raw_user_meta_data->>'city', ''),
      NULLIF(NEW.raw_user_meta_data->>'state', ''),
      NULLIF(NEW.raw_user_meta_data->>'zipCode', ''),
      NULLIF(NEW.raw_user_meta_data->>'country', '')
    ));

    INSERT INTO public.user_roles (user_id, account_type)
    VALUES (NEW.id, account_type_value)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE public.profiles
    SET
      email = NEW.email,
      first_name = COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
        first_name
      ),
      last_name = COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        NULLIF(
          trim(substring(
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
            from position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ' ') || ' ') + 1
          )),
          ''
        ),
        last_name
      ),
      display_name = COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        display_name
      ),
      avatar_url = COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        avatar_url
      ),
      telephone = COALESCE(NEW.raw_user_meta_data->>'telephone', telephone)
    WHERE id = NEW.id;

    IF account_type_value = 'brand' THEN
      INSERT INTO public.brand_profiles (
        user_id, brand_name, first_name, last_name, email, telephone, website, address
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'brand_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'telephone',
        NEW.raw_user_meta_data->>'website',
        COALESCE(combined_address, '')
      )
      ON CONFLICT (user_id) DO NOTHING;

    ELSIF account_type_value = 'business' THEN
      INSERT INTO public.business_profiles (
        user_id, business_name, category, first_name, last_name, email, telephone, website, address
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
        NEW.raw_user_meta_data->>'business_category',
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'telephone',
        NEW.raw_user_meta_data->>'website',
        COALESCE(combined_address, '')
      )
      ON CONFLICT (user_id) DO NOTHING;

    ELSIF account_type_value = 'charitable_partner' THEN
      INSERT INTO public.charitable_profiles (
        user_id, organization_name, first_name, last_name, email, telephone, registration_number, website, address
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'telephone',
        COALESCE(NEW.raw_user_meta_data->>'registration_number', ''),
        NEW.raw_user_meta_data->>'website',
        COALESCE(combined_address, '')
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    INSERT INTO public.notifications (
      user_id, type, title, message, read, action_url
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_created_confirmed
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_confirmed_user();
