CREATE TABLE IF NOT EXISTS complaint_updates (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author_role VARCHAR(20) NOT NULL -- 'admin' or 'student'
);

CREATE INDEX idx_complaint_updates_complaint_id ON complaint_updates(complaint_id);
