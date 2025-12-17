-- Migration: Automatically set can_add_photos to true when user signs up
-- Date: 2025-12-17
-- Description: Updates the handle_new_user trigger function to automatically grant
--              photo submission permission to new users upon account creation

-- Update the handle_new_user function to set can_add_photos to true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, can_add_photos, created_at, updated_at)
  VALUES (NEW.id, NEW.email, true, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function to create user profile on signup with can_add_photos enabled by default';
