# Vercel Deployment mit Supabase

Die App läuft nicht mehr auf Vercel, weil die neuen Supabase Environment Variables fehlen.

## 🔧 Schritt-für-Schritt Lösung:

### 1. Gehe zu Vercel Dashboard
1. Öffne https://vercel.com/dashboard
2. Wähle dein Projekt "cargoguard-pro"

### 2. Environment Variables hinzufügen
1. Klicke auf **Settings** (in der oberen Navigation)
2. Klicke auf **Environment Variables** (in der linken Seitenleiste)
3. Füge folgende Variables hinzu:

**Variable 1:**
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://epzigghmgelkmlmtplzs.supabase.co`
- **Environment**: Production, Preview, Development (alle auswählen)

**Variable 2:**
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_CiOHBrSZ89mfv6gkW-CYeg_5JRzczoW`
- **Environment**: Production, Preview, Development (alle auswählen)

4. Klicke auf **Save** für jede Variable

### 3. Neuen Deploy triggern
Du hast 2 Optionen:

#### Option A: Via Vercel Dashboard
1. Gehe zu **Deployments**
2. Wähle den letzten Deployment
3. Klicke auf die drei Punkte (...)
4. Klicke auf **Redeploy**
5. Klicke auf **Redeploy** im Popup

#### Option B: Via Git Push (empfohlen)
Da wir gerade alle Änderungen gepusht haben, triggert das automatisch einen neuen Deploy!
- Gehe zu **Deployments** und warte auf den neuen Build
- Der Build sollte automatisch starten

### 4. Deployment überprüfen
1. Warte bis der Build fertig ist (ca. 1-2 Minuten)
2. Klicke auf **Visit** um die App zu öffnen
3. Die App sollte jetzt funktionieren!

## 🐛 Fehlersuche

### "Supabase credentials missing" Warnung
- Prüfe ob die Environment Variables korrekt in Vercel eingetragen sind
- Stelle sicher, dass beide Variables gespeichert wurden
- Triggere einen neuen Deploy

### Build schlägt fehl
Öffne die Build Logs in Vercel und suche nach:
- TypeScript Errors
- Missing dependencies
- Environment variable errors

### App lädt, aber keine Daten
- Prüfe die Browser Console (F12)
- Suche nach Network Errors
- Stelle sicher, dass das Supabase SQL Schema ausgeführt wurde

## 📝 Wichtige Hinweise

1. **Automatische Deployments**: Jeder Git Push zu GitHub triggert automatisch einen neuen Deploy auf Vercel
2. **Environment Variables**: Diese müssen nur einmal in Vercel gesetzt werden
3. **Lokale .env**: Die lokale `.env` Datei wird NICHT zu Vercel hochgeladen (ist in .gitignore)

## ✅ Checkliste

- [ ] Environment Variables in Vercel gesetzt
- [ ] Neuen Deploy getriggert
- [ ] Build erfolgreich abgeschlossen
- [ ] App öffnet sich
- [ ] Neuen Bericht erstellen funktioniert
- [ ] Daten werden in Supabase gespeichert
