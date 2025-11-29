# Supabase Setup Anleitung

Die App wurde erfolgreich auf Supabase (PostgreSQL) umgestellt! Folge diesen Schritten, um die Einrichtung abzuschließen.

## 📋 Schritt 1: Supabase Projekt erstellen

1. Gehe zu [https://app.supabase.com](https://app.supabase.com)
2. Melde dich an (oder erstelle ein kostenloses Konto)
3. Klicke auf "New Project"
4. Wähle:
   - **Name**: CargoGuard Pro (oder beliebiger Name)
   - **Database Password**: Wähle ein sicheres Passwort (gut aufbewahren!)
   - **Region**: Europe (Frankfurt) für beste Performance in Deutschland
   - **Pricing Plan**: Free (für den Anfang ausreichend)
5. Klicke auf "Create new project"
6. Warte ca. 2 Minuten bis das Projekt bereit ist

## 🗄️ Schritt 2: Datenbank Schema einrichten

1. Klicke in deinem Projekt auf **SQL Editor** (in der linken Seitenleiste)
2. Klicke auf "New query"
3. Öffne die Datei `supabase-schema.sql` aus diesem Projekt
4. Kopiere den gesamten SQL-Code
5. Füge ihn in den Supabase SQL Editor ein
6. Klicke auf "Run" (oder drücke Cmd/Ctrl + Enter)
7. Du solltest die Meldung "Success. No rows returned" sehen

## 🔑 Schritt 3: API Credentials kopieren

1. Klicke auf **Settings** (Zahnrad-Symbol in der linken Seitenleiste)
2. Klicke auf **API**
3. Kopiere die folgenden Werte:
   - **Project URL** (z.B. `https://abcdefgh.supabase.co`)
   - **anon/public key** (langer String unter "Project API keys")

## ⚙️ Schritt 4: Environment Variables einrichten

1. Erstelle eine neue Datei `.env` im Projektordner:
   ```bash
   cp .env.example .env
   ```

2. Öffne die `.env` Datei und füge deine Credentials ein:
   ```env
   VITE_SUPABASE_URL=https://deine-projekt-url.supabase.co
   VITE_SUPABASE_ANON_KEY=dein-sehr-langer-anon-key
   ```

3. Speichere die Datei

## 🚀 Schritt 5: App neu starten

Da du bereits `npm run dev` laufen hast, musst du den Dev-Server neu starten:

1. Stoppe den aktuellen Server (Ctrl+C)
2. Starte ihn neu:
   ```bash
   npm run dev
   ```

Die App sollte jetzt mit Supabase verbunden sein!

## ✅ Schritt 6: Testen

1. Öffne die App im Browser
2. Erstelle einen neuen Bericht
3. Gehe zurück zum Dashboard
4. Der Bericht sollte in der Liste erscheinen

**Zur Kontrolle**: Gehe in Supabase zu **Table Editor** > `inspection_reports` - hier solltest du deine Berichte sehen!

## 📊 Vorteile der neuen Lösung

✅ **Cloud-basiert**: Daten sind überall verfügbar
✅ **Echtzeit-Sync**: Automatische Synchronisierung
✅ **Skalierbar**: Wächst mit deinen Anforderungen
✅ **Backup**: Automatische Backups durch Supabase
✅ **SQL**: Mächtige Abfragen und Berichte möglich

## 🔧 Fehlerbehebung

### "⚠️ Supabase credentials missing"
- Prüfe ob die `.env` Datei existiert
- Prüfe ob die Variablen korrekt benannt sind (`VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`)
- Starte den Dev-Server neu

### "Error beim Laden der Berichte"
- Prüfe ob das SQL Schema korrekt ausgeführt wurde
- Gehe in Supabase zu **Table Editor** und schaue ob die Tabelle `inspection_reports` existiert
- Prüfe die Browser-Konsole für detaillierte Fehlermeldungen

### "Network error" oder "Failed to fetch"
- Prüfe deine Internetverbindung
- Prüfe ob die Supabase URL korrekt ist
- Prüfe ob das Supabase Projekt online ist

## 💡 Nächste Schritte (Optional)

### Authentifizierung hinzufügen
Wenn du möchtest, dass nur bestimmte Personen Zugriff haben:
- Aktiviere Row Level Security (RLS) in der `supabase-schema.sql`
- Implementiere Supabase Auth für Login/Registrierung

### Storage für Bilder
Derzeit werden Bilder als Data URLs gespeichert. Für bessere Performance:
- Nutze Supabase Storage für Bild-Upload
- Speichere nur die URLs in der Datenbank

### Offline-Modus
Kombiniere Supabase mit lokalem Cache für Offline-Funktionalität
