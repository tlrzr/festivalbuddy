let timetable = null;
let eventId = "";
let currentDay = "";

export async function initTimetable(params) {
    eventId = params.get('event') || 'rip26';
    
    if (!eventId.match(/^[a-z0-9]+$/i)) {
        throw new Error("Ungültige Event-ID");
    }
    
    try {
        const res = await fetch(`data/${eventId}.json`);
        
        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status} - Festival nicht gefunden`);
        }
        
        timetable = await res.json();
        
        // Validiere die Timetable-Struktur
        if (!timetable || !timetable.timetable || !Array.isArray(timetable.timetable)) {
            throw new Error("Ungültige Timetable-Struktur");
        }
        
        if (!timetable.date_start) {
            throw new Error("Timetable hat kein Startdatum");
        }
        
        currentDay = timetable.date_start;
        return { timetable, eventId };
    } catch (e) {
        if (e instanceof TypeError) {
            console.error("Netzwerkfehler beim Laden der Daten:", e);
            throw new Error("Netzwerkfehler - bitte überprüfe deine Internetverbindung");
        } else if (e instanceof SyntaxError) {
            console.error("JSON Parsing Fehler:", e);
            throw new Error("Beschädigte Festival-Daten");
        }
        console.error("Fehler beim Laden des Timetable:", e);
        throw e;
    }
}

export function getTimetable() { return timetable; }
export function getEventId() { return eventId; }
export function getCurrentDay() { return currentDay; }
export function setCurrentDay(day) { 
    if (!timetable || !timetable.timetable.some(a => a.day === day)) {
        console.warn("Ungültiger Tag:", day);
        return;
    }
    currentDay = day; 
}