-- Chef du Jour feature

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS members TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS chef_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  chef_date DATE NOT NULL,
  chef_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(family_id, chef_date)
);

CREATE INDEX IF NOT EXISTS idx_chef_family_date ON chef_assignments(family_id, chef_date);
ALTER TABLE chef_assignments ENABLE ROW LEVEL SECURITY;
