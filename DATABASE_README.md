# SQLite Datenbank-Integration für CargoGuard Pro

## Überblick

CargoGuard Pro verwendet jetzt **SQL.js** - eine WebAssembly-basierte SQLite-Implementierung, die direkt im Browser läuft. Alle Berichte werden persistent in einer lokalen SQLite-Datenbank gespeichert.

## Technologie

- **SQL.js**: SQLite compiled to WebAssembly for the browser
- **LocalStorage**: Datenbank wird als Binary Array im Browser LocalStorage persistiert
- **React Hook**: `useDatabase()` für einfache Integration in React-Komponenten

## Datenbankschema

### Tabellen

#### `inspection_reports`
Haupttabelle für Inspektionsberichte
```sql
CREATE TABLE inspection_reports (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft', 'submitted')),
  updated_at INTEGER NOT NULL
);
```

#### `documents`
Lieferschein-Daten (1:1 mit Berichten)
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL UNIQUE,
  delivery_number TEXT NOT NULL,
  date TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  raw_text TEXT,
  image_url TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
);
```

#### `damages`
Schadensdatensätze (1:n mit Berichten)
```sql
CREATE TABLE damages (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('Gering', 'Mittel', 'Schwer')),
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
);
```

#### `damage_categories`
Schadenskategorien (n:m mit Schäden)
```sql
CREATE TABLE damage_categories (
  damage_id TEXT NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (damage_id, category),
  FOREIGN KEY (damage_id) REFERENCES damages(id) ON DELETE CASCADE
);
```

#### `drivers`
Fahrerdaten und Unterschriften (1:1 mit Berichten)
```sql
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  signature_data_url TEXT NOT NULL,
  company TEXT NOT NULL,
  under_reserve INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
);
```

## Verwendung

### In React-Komponenten

```typescript
import { useDatabase } from './hooks/useDatabase';

function MyComponent() {
  const { reports, loading, error, saveReport, deleteReport } = useDatabase();

  if (loading) return <div>Lade Datenbank...</div>;
  if (error) return <div>Fehler: {error}</div>;

  return (
    <div>
      <h1>Berichte: {reports.length}</h1>
      {/* ... */}
    </div>
  );
}
```

### Verfügbare Hooks-Methoden

- `reports: InspectionReport[]` - Alle gespeicherten Berichte
- `loading: boolean` - Ladestatusv
- `error: string | null` - Fehlermeldung falls vorhanden
- `saveReport(report)` - Bericht speichern oder aktualisieren
- `deleteReport(id)` - Bericht löschen
- `getReport(id)` - Einzelnen Bericht laden
- `getReportsByStatus(status)` - Berichte nach Status filtern
- `refreshReports()` - Alle Berichte neu laden

## Features

### Auto-Save
Berichte werden automatisch alle 2 Sekunden während der Bearbeitung gespeichert (siehe `App.tsx`).

### Persistenz
Die gesamte Datenbank wird im Browser LocalStorage unter dem Key `cargoguard_db` gespeichert. Dadurch bleiben alle Daten auch nach Browser-Neustart erhalten.

### Transaktionssicherheit
Alle Schreiboperationen (Insert, Update, Delete) speichern die Datenbank automatisch im LocalStorage.

### Foreign Keys
Foreign Key Constraints sind aktiviert, um Datenintegrität sicherzustellen. Beim Löschen eines Berichts werden automatisch alle zugehörigen Dokumente, Schäden und Fahrerdaten gelöscht (CASCADE).

## Datenbank-Export

Die Datenbank kann als Binary exportiert werden:

```typescript
import { getDatabase } from './services/database';

const db = await getDatabase();
const data = db.exportDatabase(); // Uint8Array
```

## Entwicklung

### Datenbank zurücksetzen
LocalStorage leeren:
```javascript
localStorage.removeItem('cargoguard_db');
```

### Schema-Änderungen
Schema-Änderungen in `services/database.ts` → `initializeTables()` vornehmen.

## Einschränkungen

- **Speichergröße**: LocalStorage ist auf ca. 5-10 MB begrenzt
- **Bilder**: Base64-kodierte Bilder vergrößern die Datenbankgröße erheblich
- **Keine Synchronisation**: Daten bleiben lokal im Browser (kein Server-Sync)

## Performance

- **Indizes** auf häufig abgefragte Spalten (created_at, status, report_id)
- **WAL-Modus** für bessere Concurrent-Performance (nicht bei SQL.js verfügbar, aber API-kompatibel)

## Sicherheit

- Keine Eingabesanitization nötig (Prepared Statements verhindern SQL Injection)
- Daten bleiben vollständig client-seitig
- Keine Übertragung sensibler Daten an Server

## Browser-Kompatibilität

SQL.js benötigt WebAssembly-Unterstützung:
- Chrome/Edge 57+
- Firefox 52+
- Safari 11+
- Opera 44+

Alle modernen Browser werden unterstützt.
