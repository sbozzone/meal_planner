-- Family DinnerTime - dinner-impact activities

CREATE TABLE IF NOT EXISTS dinner_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  title TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dinner_activities_family_week
  ON dinner_activities(family_id, activity_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'dinner_activities_updated_at'
  ) THEN
    CREATE TRIGGER dinner_activities_updated_at
      BEFORE UPDATE ON dinner_activities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

ALTER TABLE dinner_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE dinner_activities;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
