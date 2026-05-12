import { saveData, loadData } from './modules/storage.js';
import { initTimetable, getTimetable, getEventId, getCurrentDay, setCurrentDay } from './modules/timetable.js';
import { exportMyPlan, copyExportCode, confirmFriendImport, importSingleFriendFromUrl, getBuddies } from './modules/exportImport.js';
import { render, setupEventDelegation, toggleBuddyVisibility, toggleLock, buildNav, openModal, closeModal, showMessage, handleInitialStart, setLocked } from './modules/ui.js';

let myData = { name: "", acts: [], lastUpdated: 0 };
let currentEventId = "";
let currentTimetable = null;

// Helfer: Render mit aktuellen Daten
function doRender() {
    try {
        render(getTimetable(), getCurrentDay(), myData, getBuddies());
    } catch (e) {
        console.error("Fehler beim Rendern:", e);
        showMessage("Fehler", "Interface konnte nicht aktualisiert werden");
    }
}

// Helper: Speichern mit Error Handling
function doSave() {
    try {
        saveData(getEventId(), myData);
        console.log("✅ Daten gespeichert:", myData);
    } catch (e) {
        console.error("Fehler beim Speichern:", e);
        showMessage("Fehler beim Speichern", e.message || "Deine Auswahl konnte nicht gespeichert werden");
    }
}

async function initHome() {
    try {
        const res = await fetch('data/festivals.json');
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Festivals konnten nicht geladen werden`);
        }

        const festivals = await res.json();
        
        // Validiere, dass es ein Array ist
        if (!Array.isArray(festivals)) {
            throw new Error("Ungültiges Festival-Format");
        }

        const container = document.getElementById('festivalLinks');
        if (!container) {
            console.error("festivalLinks nicht gefunden");
            return;
        }

        if (festivals.length === 0) {
            container.innerHTML = '<p>Keine Festivals verfügbar</p>';
            return;
        }

        container.innerHTML = festivals.map(f => {
            if (!f.id || !f.name || !f.location || !f.date) {
                console.warn("Unvollständiges Festival-Objekt:", f);
                return '';
            }
            return `
                <a href="app.html?event=${encodeURIComponent(f.id)}" class="festival-link">
                    <div class="festival-card" style="border-color: ${f.color || '#ccc'}">
                        <h3>${f.name}</h3>
                        <p>${f.location}</p>
                        <p>${f.date}</p>
                    </div>
                </a>
            `;
        }).join('');

        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.style.display = 'none';
        }
    } catch (e) {
        console.error("Fehler beim Laden der Festivals:", e);
        const container = document.getElementById('festivalLinks');
        if (container) {
            container.innerHTML = `<p style="color: red; text-align: center;">Fehler beim Laden der Festivals: ${e.message}</p>`;
        }
    }
}

async function initApp() {
    try {
        const params = new URLSearchParams(window.location.search);
        const { timetable, eventId } = await initTimetable(params);
        currentEventId = eventId;
        currentTimetable = timetable;

        const friendFromUrl = params.get('friend');

        const saved = loadData(eventId);
        if(saved) { 
            myData = saved;
            console.log("✅ Daten aus localStorage geladen:", myData);
        } else { 
            console.log("ℹ️ Keine Daten in localStorage, neues Formular zeigen");
            openModal('startOverlay'); 
        }

        // Falls ein Freund im Link ist, diesen sofort importieren
        if (friendFromUrl) {
            const imported = importSingleFriendFromUrl(decodeURIComponent(friendFromUrl));
            if (!imported) {
                console.warn("Freund-Link konnte nicht importiert werden");
            }
            // URL bereinigen
            const newUrl = window.location.origin + window.location.pathname + "?event=" + eventId;
            window.history.replaceState({}, document.title, newUrl);
        }
        
        startApp();
    } catch (e) {
        console.error("Fehler beim Initialisieren der App:", e);
        showMessage("Fehler", e.message || "App konnte nicht geladen werden");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}

function startApp() {
    closeModal('startOverlay');
    buildNav(getTimetable(), getCurrentDay(), setCurrentDay, doRender);
    doRender();
}

async function init() {
    try {
        if (document.getElementById('festivalLinks')) {
            initHome();
        } else if (document.getElementById('mainGrid')) {
            await initApp();
            setupEventDelegation(myData, doSave, doRender);
        }
    } catch (e) {
        console.error("Fehler bei Initialisierung:", e);
        showMessage("Fehler", "App konnte nicht initialisiert werden");
    }
}

// Globale Funktionen für HTML onclick-Attribute
window.exportMyPlan = () => {
    try {
        exportMyPlan(myData, getTimetable(), getEventId());
    } catch (e) {
        console.error("Export-Fehler:", e);
        showMessage("Fehler", "Plan konnte nicht exportiert werden");
    }
};

window.copyExportCode = copyExportCode;

window.confirmFriendImport = () => {
    try {
        confirmFriendImport();
        doRender();
    } catch (e) {
        console.error("Import-Fehler:", e);
        showMessage("Fehler", "Freunde konnten nicht importiert werden");
    }
};

window.toggleBuddyVisibility = (n) => {
    try {
        toggleBuddyVisibility(n, getBuddies()); 
        doRender();
    } catch (e) {
        console.error("Fehler beim Umschalten von Buddy:", e);
    }
};

window.toggleLock = toggleLock;

window.setCurrentDayAndRender = (day) => {
    try {
        setCurrentDay(day);
        buildNav(getTimetable(), getCurrentDay(), setCurrentDay, doRender);
        doRender();
    } catch (e) {
        console.error("Fehler beim Wechsel des Tages:", e);
        showMessage("Fehler", "Tag konnte nicht gewechselt werden");
    }
};

window.handleInitialStart = () => {
    try {
        handleInitialStart(myData, doSave, startApp);
    } catch (e) {
        console.error("Start-Fehler:", e);
    }
};

// Modal Helper global verfügbar machen
window.openModal = openModal;
window.closeModal = closeModal;
window.showMessage = showMessage;

// Starte die App
init();