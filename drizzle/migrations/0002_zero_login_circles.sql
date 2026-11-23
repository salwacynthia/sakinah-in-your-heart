CREATE TABLE public.circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Our Family',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.circles TO service_role;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  name text NOT NULL,
  member_key text NOT NULL,
  is_owner boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.circle_members TO service_role;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.circle_members(circle_id);

CREATE TABLE public.circle_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.circle_members(id) ON DELETE CASCADE,
  local_id text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, local_id)
);
GRANT ALL ON public.circle_reflections TO service_role;
ALTER TABLE public.circle_reflections ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.circle_reflections(circle_id, created_at DESC);