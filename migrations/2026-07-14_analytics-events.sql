-- Analytics events table (lightweight Supabase-based tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_analytics_event ON analytics_events(event);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- RLS: users can insert their own events, no reads (admin only)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
