CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  ayat TEXT NOT NULL DEFAULT '',
  ayat_reference TEXT NOT NULL DEFAULT '',
  translation TEXT NOT NULL DEFAULT '',
  reflection TEXT NOT NULL DEFAULT '',
  hadith TEXT NOT NULL DEFAULT '',
  hadith_translation TEXT NOT NULL DEFAULT '',
  hadith_narrator TEXT NOT NULL DEFAULT '',
  hadith_source TEXT NOT NULL DEFAULT '',
  asmaul_husna_arabic TEXT NOT NULL DEFAULT '',
  asmaul_husna_meaning TEXT NOT NULL DEFAULT '',
  asmaul_husna_explanation TEXT NOT NULL DEFAULT '',
  is_shared_with_family BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reflections_user_created ON public.reflections (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reflections" ON public.reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reflections" ON public.reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reflections" ON public.reflections FOR DELETE TO authenticated USING (auth.uid() = user_id);
COMMENT ON COLUMN public.reflections.is_shared_with_family IS 'Privacy default: private. Only TRUE entries are visible to family members (family feature pending).';