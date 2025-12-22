-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table for security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create travel_vibes table
CREATE TABLE public.travel_vibes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vibe TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create travel_plans table
CREATE TABLE public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create swipes table
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (swiper_id, swiped_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (profile1_id, profile2_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create blocks table
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (blocker_id, blocked_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_vibes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user's profile id
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Function to check if mutual match exists
CREATE OR REPLACE FUNCTION public.check_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_swipe RECORD;
BEGIN
  -- Only check for matches on right swipes
  IF NEW.direction = 'right' THEN
    SELECT * INTO mutual_swipe
    FROM public.swipes
    WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND direction = 'right';
    
    -- If mutual right swipe exists, create a match
    IF FOUND THEN
      INSERT INTO public.matches (profile1_id, profile2_id)
      VALUES (LEAST(NEW.swiper_id, NEW.swiped_id), GREATEST(NEW.swiper_id, NEW.swiped_id))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for match creation
CREATE TRIGGER on_swipe_check_match
AFTER INSERT ON public.swipes
FOR EACH ROW EXECUTE FUNCTION public.check_match();

-- RLS Policies for profiles
CREATE POLICY "Users can view non-blocked profiles" ON public.profiles
FOR SELECT USING (
  user_id = auth.uid() OR
  NOT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = public.get_my_profile_id() AND blocked_id = id)
       OR (blocker_id = id AND blocked_id = public.get_my_profile_id())
  )
);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for travel_vibes
CREATE POLICY "Users can view travel vibes" ON public.travel_vibes
FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own vibes" ON public.travel_vibes
FOR ALL USING (profile_id = public.get_my_profile_id());

-- RLS Policies for photos
CREATE POLICY "Users can view photos" ON public.photos
FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own photos" ON public.photos
FOR ALL USING (profile_id = public.get_my_profile_id());

-- RLS Policies for travel_plans
CREATE POLICY "Users can view active travel plans" ON public.travel_plans
FOR SELECT USING (is_active = TRUE OR profile_id = public.get_my_profile_id());

CREATE POLICY "Users can manage own travel plans" ON public.travel_plans
FOR ALL USING (profile_id = public.get_my_profile_id());

-- RLS Policies for swipes
CREATE POLICY "Users can view own swipes" ON public.swipes
FOR SELECT USING (swiper_id = public.get_my_profile_id());

CREATE POLICY "Users can insert own swipes" ON public.swipes
FOR INSERT WITH CHECK (swiper_id = public.get_my_profile_id());

-- RLS Policies for matches
CREATE POLICY "Users can view own matches" ON public.matches
FOR SELECT USING (
  profile1_id = public.get_my_profile_id() OR
  profile2_id = public.get_my_profile_id()
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in own matches" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = match_id
      AND (profile1_id = public.get_my_profile_id() OR profile2_id = public.get_my_profile_id())
  )
);

CREATE POLICY "Users can send messages in own matches" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = public.get_my_profile_id() AND
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = match_id
      AND (profile1_id = public.get_my_profile_id() OR profile2_id = public.get_my_profile_id())
  )
);

-- RLS Policies for reports
CREATE POLICY "Users can view own reports" ON public.reports
FOR SELECT USING (reporter_id = public.get_my_profile_id());

CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT WITH CHECK (reporter_id = public.get_my_profile_id());

CREATE POLICY "Admins can view all reports" ON public.reports
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blocks
CREATE POLICY "Users can view own blocks" ON public.blocks
FOR SELECT USING (blocker_id = public.get_my_profile_id());

CREATE POLICY "Users can manage own blocks" ON public.blocks
FOR ALL USING (blocker_id = public.get_my_profile_id());

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', 'Traveler'));
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_plans_updated_at
BEFORE UPDATE ON public.travel_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;