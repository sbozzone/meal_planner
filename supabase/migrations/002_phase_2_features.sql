-- Family DinnerTime - Phase 2 features

ALTER TABLE meal_plans
  ADD COLUMN IF NOT EXISTS votes JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS is_memory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS memory_story TEXT,
  ADD COLUMN IF NOT EXISTS memory_image_url TEXT,
  ADD COLUMN IF NOT EXISTS appliances TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_dishes_appliances ON dishes USING GIN(appliances);

CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'count',
  category TEXT DEFAULT 'Other',
  expiry_date DATE,
  low_stock_threshold NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pantry_family ON pantry_items(family_id);
CREATE INDEX IF NOT EXISTS idx_pantry_expiry ON pantry_items(expiry_date);

ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS pantry_item_id UUID REFERENCES pantry_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pantry_note TEXT;

CREATE INDEX IF NOT EXISTS idx_shopping_pantry ON shopping_items(pantry_item_id);

CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_family ON meal_templates(family_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'pantry_items_updated_at'
  ) THEN
    CREATE TRIGGER pantry_items_updated_at
      BEFORE UPDATE ON pantry_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'meal_templates_updated_at'
  ) THEN
    CREATE TRIGGER meal_templates_updated_at
      BEFORE UPDATE ON meal_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pantry_items;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE meal_templates;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'family-memories',
  'family-memories',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public family memories read'
  ) THEN
    CREATE POLICY "Public family memories read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'family-memories');
  END IF;
END $$;
