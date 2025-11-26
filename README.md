# Transportschaden / Dokumentation

Eine professionelle mobile Web-Applikation zur Dokumentation von Warenübergaben und Schadenserfassung im Transportwesen.

## Features

- 📸 **Lieferschein-Erfassung**: Fotografieren und digitalisieren von Lieferscheinen
- 🔍 **Schadenserfassung**: Dokumentation von Transportschäden mit Fotos und Kategorisierung
- ✍️ **Digitale Unterschrift**: Elektronische Unterschrift des Fahrers
- 💾 **Offline-fähig**: Lokale Datenspeicherung mit IndexedDB
- 📱 **Mobile-First**: Optimiert für Smartphone-Nutzung
- 🌓 **Dark Mode**: Automatischer Dark/Light Mode
- 🗂️ **Berichtsverwaltung**: Speichern, anzeigen und bearbeiten von Berichten

## Technologie-Stack

- **React 19.2.0** mit TypeScript
- **Tailwind CSS** für Styling
- **IndexedDB** (via localforage) für persistente Datenspeicherung
- **Lucide React** für Icons
- **Vite** als Build-Tool

## Installation

```bash
# Repository klonen
git clone https://github.com/Samilami/cargoguard-pro.git

# In Projektverzeichnis wechseln
cd cargoguard-pro

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

## Verwendung

1. **Neuen Bericht starten**: Klicken Sie auf "Neuen Bericht starten"
2. **Lieferschein scannen**: Fotografieren Sie den Lieferschein
3. **Schäden dokumentieren**: Fügen Sie Fotos und Beschreibungen von Schäden hinzu
4. **Fahrer-Unterschrift**: Lassen Sie den Fahrer digital unterschreiben
5. **Bericht abschließen**: Überprüfen und speichern Sie den Bericht

## Projektstruktur

```
cargoguard-pro/
├── components/          # React Komponenten
│   ├── CameraInput.tsx
│   ├── DamageForm.tsx
│   ├── SignaturePad.tsx
│   └── ThemeToggle.tsx
├── services/            # Services
│   └── database.ts      # IndexedDB Service
├── hooks/               # Custom React Hooks
│   └── useDatabase.ts
├── public/              # Statische Assets
│   └── avocarbon_logo.png
├── App.tsx              # Hauptkomponente
├── types.ts             # TypeScript Definitionen
└── index.tsx            # Entry Point
```

## Lizenz

© 2025 AvoCarbon. Alle Rechte vorbehalten.

## Entwickler

Entwickelt für professionelle Transportdienstleister und Logistikunternehmen.
