const STORAGE_PREFIX = "fb_data_";

export function saveData(eventId, data) {
    try {
        if (!eventId || !data) {
            throw new Error("eventId und data sind erforderlich");
        }
        localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, JSON.stringify(data));
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.error("localStorage ist voll");
            throw new Error("Speicher voll - bitte einige Daten löschen");
        } else if (e.name === 'SecurityError') {
            console.error("localStorage ist deaktiviert");
            throw new Error("Lokaler Speicher ist nicht verfügbar");
        }
        console.error("Fehler beim Speichern:", e);
        throw e;
    }
}

export function loadData(eventId) {
    try {
        if (!eventId) {
            throw new Error("eventId ist erforderlich");
        }
        const saved = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
        if (!saved) return null;
        
        const parsed = JSON.parse(saved);
        // Validiere, dass es die richtigen Felder hat (auch leere Namen sind OK)
        if (typeof parsed.name !== 'string' || !Array.isArray(parsed.acts)) {
            console.warn("Ungültige Datenstruktur in localStorage, zurücksetzen");
            return null;
        }
        return parsed;
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.error("Korrupte Daten in localStorage");
            localStorage.removeItem(`${STORAGE_PREFIX}${eventId}`);
        } else if (e.name === 'SecurityError') {
            console.error("localStorage ist deaktiviert");
        }
        console.error("Fehler beim Laden:", e);
        return null;
    }
}