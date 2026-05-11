const STORAGE_PREFIX = "fb_data_";

export function saveData(eventId, data) {
    localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, JSON.stringify(data));
}

export function loadData(eventId) {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
    return saved ? JSON.parse(saved) : null;
}