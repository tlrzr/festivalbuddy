# FestivalBuddy

FestivalBuddy ist eine webbasierte Anwendung zur Planung von Festival-Besuchen. Erstelle personalisierte "Running Orders" für Festivals wie Rock im Park und Rock am Ring, teile deine Pläne mit Freunden und koordiniere gemeinsame Besuche.

## Features

- **Festival-Auswahl**: Wähle aus verfügbaren Festivals.
- **Planung**: Markiere Acts in einem interaktiven Timetable.
- **Teilen**: Exportiere deinen Plan als Link und teile ihn mit Freunden.
- **Freunde hinzufügen**: Importiere Pläne von Freunden für gemeinsame Koordination.
- **Lokale Speicherung**: Daten werden im Browser gespeichert (localStorage).

## Projektstruktur

```
festivalbuddy/
├── src/
│   ├── html/          # HTML-Templates (index.html, app.html)
│   ├── js/
│   │   ├── modules/   # Modulare JavaScript-Logik
│   │   │   ├── storage.js      # localStorage-Handling
│   │   │   ├── timetable.js    # Datenladen und -verwaltung
│   │   │   ├── exportImport.js # Export/Import von Plänen
│   │   │   └── ui.js           # Rendering und UI-Interaktionen
│   │   └── main.js             # Haupteinstiegspunkt
│   ├── css/          # Stylesheets
│   └── assets/       # Bilder, Icons, etc.
├── data/             # Statische JSON-Daten (Festivals, Timetables)
├── dist/             # Gebautes Projekt (für Deployment)
├── tests/            # Unit-Tests
├── package.json      # NPM-Abhängigkeiten und Scripts
├── .gitignore        # Ignorierte Dateien
└── README.md         # Diese Datei
```

## Installation und Entwicklung

1. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten**:
   ```bash
   npm run dev
   ```
   Öffne `http://localhost:5173` im Browser.

3. **Build für Produktion**:
   ```bash
   npm run build
   ```
   Die gebauten Dateien landen in `dist/`.

## Verwendung

- Starte mit `index.html` für die Festival-Auswahl.
- Wähle ein Festival und plane deinen Besuch in `app.html`.
- Teile deinen Plan über den Export-Button.

## Beitragen

Forks und Pull Requests sind willkommen! Stelle sicher, dass du Tests hinzufügst und die Code-Qualität beibehältst.

## Lizenz

MIT License - siehe LICENSE-Datei für Details.