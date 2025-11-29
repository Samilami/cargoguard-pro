-- Datenbank-Schema für CargoGuard Pro / Transportschaden Dokumentation
-- Führe dieses SQL in deinem Supabase SQL Editor aus

-- Tabelle für Inspektionsberichte
CREATE TABLE IF NOT EXISTS inspection_reports (
  id TEXT PRIMARY KEY,
  created_at BIGINT NOT NULL,
  employee_name TEXT NOT NULL,
  document JSONB,
  damages JSONB NOT NULL DEFAULT '[]'::jsonb,
  driver JSONB,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnellere Abfragen nach Status
CREATE INDEX IF NOT EXISTS idx_reports_status ON inspection_reports(status);

-- Index für schnellere Abfragen nach Erstellungsdatum
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON inspection_reports(created_at DESC);

-- Index für schnellere Abfragen nach Mitarbeiternamen
CREATE INDEX IF NOT EXISTS idx_reports_employee ON inspection_reports(employee_name);

-- Automatisches Aktualisieren von updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspection_reports_updated_at BEFORE UPDATE
ON inspection_reports FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: Row Level Security (RLS) aktivieren für mehr Sicherheit
-- Wenn du Authentifizierung verwenden möchtest, aktiviere dies:
-- ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;

-- Optional: Policy für öffentlichen Zugriff (für den Anfang ohne Auth)
-- CREATE POLICY "Allow public access" ON inspection_reports FOR ALL USING (true);

COMMENT ON TABLE inspection_reports IS 'Speichert alle Transportschaden-Inspektionsberichte';
COMMENT ON COLUMN inspection_reports.id IS 'Eindeutige Bericht-ID';
COMMENT ON COLUMN inspection_reports.created_at IS 'Erstellungszeitpunkt (Unix Timestamp in Millisekunden)';
COMMENT ON COLUMN inspection_reports.employee_name IS 'Name des internen Prüfers';
COMMENT ON COLUMN inspection_reports.document IS 'Lieferschein-Daten als JSONB';
COMMENT ON COLUMN inspection_reports.damages IS 'Array von Schäden als JSONB';
COMMENT ON COLUMN inspection_reports.driver IS 'Fahrer-Daten inkl. Unterschrift als JSONB';
COMMENT ON COLUMN inspection_reports.status IS 'Status: draft oder submitted';
