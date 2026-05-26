-- Change parking_details, nearby_hotels, and transportation columns to text arrays
ALTER TABLE public.events 
  ALTER COLUMN parking_details TYPE text[] USING CASE 
    WHEN parking_details IS NULL THEN NULL
    WHEN parking_details = '' THEN NULL
    ELSE ARRAY[parking_details]
  END;

ALTER TABLE public.events 
  ALTER COLUMN nearby_hotels TYPE text[] USING CASE 
    WHEN nearby_hotels IS NULL THEN NULL
    WHEN nearby_hotels = '' THEN NULL
    ELSE ARRAY[nearby_hotels]
  END;

ALTER TABLE public.events 
  ALTER COLUMN transportation TYPE text[] USING CASE 
    WHEN transportation IS NULL THEN NULL
    WHEN transportation = '' THEN NULL
    ELSE ARRAY[transportation]
  END;