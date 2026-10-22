CREATE TABLE public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Family',
  max_members integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id),
  UNIQUE (user_id)
);

CREATE TABLE public.family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invitations TO authenticated;
GRANT ALL ON public.family_invitations TO service_role;

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_family_member(_family_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = _user
  )
$$;

CREATE OR REPLACE FUNCTION public.same_family(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT fa.family_id IS NOT NULL AND fa.family_id = fb.family_id
  FROM (SELECT family_id FROM public.family_members WHERE user_id = _a) fa
  CROSS JOIN (SELECT family_id FROM public.family_members WHERE user_id = _b) fb
$$;

CREATE OR REPLACE FUNCTION public.is_family_owner(_family_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.families
    WHERE id = _family_id AND owner_id = _user
  )
$$;

CREATE POLICY "Family members can view their family"
ON public.families FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR public.is_family_member(id, auth.uid()));

CREATE POLICY "Users can create their own family"
ON public.families FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Family owners can update their family"
ON public.families FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Family owners can delete their family"
ON public.families FOR DELETE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Members can view their family roster"
ON public.family_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Owners add themselves as owner member"
ON public.family_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'owner' AND public.is_family_owner(family_id, auth.uid()));

CREATE POLICY "Members can leave or owners can remove"
ON public.family_members FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_family_owner(family_id, auth.uid()));

CREATE POLICY "Owners view their invitations or invited email views theirs"
ON public.family_invitations FOR SELECT TO authenticated
USING (invited_by = auth.uid() OR EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND lower(u.email) = lower(invited_email)
));

CREATE POLICY "Owners create invitations"
ON public.family_invitations FOR INSERT TO authenticated
WITH CHECK (invited_by = auth.uid() AND public.is_family_owner(family_id, auth.uid()));

CREATE POLICY "Owners update their invitations"
ON public.family_invitations FOR UPDATE TO authenticated
USING (invited_by = auth.uid());

CREATE POLICY "Owners delete their invitations"
ON public.family_invitations FOR DELETE TO authenticated
USING (invited_by = auth.uid());

CREATE POLICY "Users can update their own reflections"
ON public.reflections FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view shared reflections"
ON public.reflections FOR SELECT TO authenticated
USING (is_shared_with_family = true AND public.same_family(user_id, auth.uid()));
