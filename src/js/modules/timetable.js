let timetable = null;
let eventId = "";
let currentDay = "";

export async function initTimetable(params) {
    eventId = params.get('event') || 'rip26';
    try {
        const res = await fetch(`data/${eventId}.json`);
        timetable = await res.json();
        currentDay = timetable.date_start;
        return { timetable, eventId };
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export function getTimetable() { return timetable; }
export function getEventId() { return eventId; }
export function getCurrentDay() { return currentDay; }
export function setCurrentDay(day) { currentDay = day; }