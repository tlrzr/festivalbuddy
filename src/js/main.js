import { saveData, loadData, removeData } from './modules/storage.js';
import { initTimetable, getTimetable, getEventId, getCurrentDay, setCurrentDay } from './modules/timetable.js';
import { exportMyPlan, copyExportCode, confirmFriendImport, importSingleFriendFromUrl, importPersonalData, getBuddies } from './modules/exportImport.js';
import { render, setupEventDelegation, toggleBuddyVisibility, toggleLock, buildNav, openModal, closeModal, showMessage, handleInitialStart, setLocked, switchTab, switchInfoTab, showToast } from './modules/ui.js';

let myData = { name: "", acts: [], lastUpdated: 0 };
let currentEventId = "";
let currentTimetable = null;

// Globaler Klick-Zähler
window.clickCounter = 0;

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

// Klick-Zähler: Erinnere den Nutzer alle 10 Klicks, den Code zu speichern (dezente Toast-Nachricht)
function trackClickAndRemind() {
    window.clickCounter++;
    console.log("Klick-Zaehler:", window.clickCounter);
    if (window.clickCounter % 10 === 0) {
        try {
            showToast("💾 Denke daran, deinen Code zu speichern!");
            window.clickCounter = 0; // Zähler zurücksetzen
        } catch (e) {
            console.warn("Fehler bei der Erinnerung:", e);
        }
    }
}

// Mache die Funktion global verfügbar
window.trackClickAndRemind = trackClickAndRemind;

// Info-Modal-Inhalte füllen
function populateInfoModal() {
    try {
        // Festival-Info
        const festDetails = document.getElementById('festFullDetails');
        if (festDetails && currentTimetable) {
            festDetails.innerHTML = `
                <p><strong>Name:</strong> ${currentTimetable.festival || 'Unbekannt'}</p>
                <p><strong>Ort:</strong> ${currentTimetable.location || 'Unbekannt'}</p>
                <p><strong>Datum:</strong> ${currentTimetable.date_start || 'Unbekannt'} - ${currentTimetable.date_end || 'Unbekannt'}</p>
                <p><strong>Letztes Update:</strong> ${currentTimetable.last_update || 'Unbekannt'}</p>
            `;
        } else if (festDetails) {
            festDetails.innerHTML = '<p>Festival-Informationen konnten nicht geladen werden.</p>';
        }

        // User-Profil
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            const lastUpdated = myData.lastUpdated ? new Date(myData.lastUpdated).toLocaleString('de-DE') : 'Nie';
            userProfile.innerHTML = `
                <p><strong>Name:</strong> ${myData.name || 'Unbekannt'}</p>
                <p><strong>Letzte Änderung:</strong> ${lastUpdated}</p>
                <p><strong>Event-ID:</strong> ${currentEventId || 'Unbekannt'}</p>
            `;
        }

        // Statistiken
        const userStats = document.getElementById('userStats');
        if (userStats) {
            const totalActs = currentTimetable ? currentTimetable.timetable.length : 0;
            const myActs = myData.acts.length;
            const buddies = getBuddies();
            const totalBuddies = Object.keys(buddies).length;
            
            // Matches mit Freunden berechnen
            let totalMatches = 0;
            Object.values(buddies).forEach(buddy => {
                buddy.acts.forEach(act => {
                    if (myData.acts.includes(act)) {
                        totalMatches++;
                    }
                });
            });

            userStats.innerHTML = `
                <div class="info-stats">
                    <div class="stat-item">
                        <span class="stat-number">${myActs}</span>
                        <span class="stat-label">Favoriten-Acts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalMatches}</span>
                        <span class="stat-label">Matches mit Freunden</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalBuddies}</span>
                        <span class="stat-label">Freunde hinzugefügt</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalActs}</span>
                        <span class="stat-label">Gesamt Acts</span>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Fehler beim Füllen des Info-Modals:", e);
    }
}

// Mache die Funktion global verfügbar
window.populateInfoModal = populateInfoModal;
window.switchInfoTab = switchInfoTab;
window.showToast = showToast;

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
        const selfCodeFromUrl = params.get('code');

        const saved = loadData(eventId);
        const startedFromSavedData = Boolean(saved);
        if (saved) { 
            myData = saved;
            console.log("✅ Daten aus localStorage geladen:", myData);
        } else { 
            console.log("ℹ️ Keine Daten in localStorage, neues Formular zeigen");
            openModal('startOverlay'); 
        }

        let importedSelf = false;
        if (selfCodeFromUrl) {
            const imported = importPersonalData(decodeURIComponent(selfCodeFromUrl));
            if (imported) {
                myData = imported;
                doSave();
                importedSelf = true;
            } else {
                console.warn("Eigenen Link konnte nicht importiert werden");
            }
        }

        if (friendFromUrl) {
            const importedFriend = importSingleFriendFromUrl(decodeURIComponent(friendFromUrl));
            if (!importedFriend) {
                console.warn("Freund-Link konnte nicht importiert werden");
            }
        }

        if (importedSelf || startedFromSavedData) {
            startApp();
        }

        if (selfCodeFromUrl || friendFromUrl) {
            const newUrl = window.location.origin + window.location.pathname + "?event=" + eventId;
            window.history.replaceState({}, document.title, newUrl);
        }

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
    populateInfoModal();
    doRender();
}

async function init() {
    try {
        if (document.getElementById('festivalLinks')) {
            initHome();
        } else if (document.getElementById('mainGrid')) {
            await initApp();
            setupEventDelegation(myData, doSave, doRender, trackClickAndRemind);
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
window.resetData = () => {
    try {
        openModal('resetConfirmOverlay');
    } catch (e) {
        console.error('Fehler beim Öffnen des Reset-Modals:', e);
        showMessage('Fehler', 'Reset-Dialog konnte nicht angezeigt werden');
    }
};

window.confirmReset = () => {
    try {
        removeData(getEventId());
        
        myData = { name: '', acts: [], lastUpdated: 0 };
        
        const initialInput = document.getElementById('initialInput');
        if (initialInput) {
            initialInput.value = '';
        }
        
        const startCodeInput = document.getElementById('startCodeInput');
        if (startCodeInput) {
            startCodeInput.value = '';
        }
        
        closeModal('resetConfirmOverlay');
        
        const nameTab = document.getElementById('startNameTab');
        const codeTab = document.getElementById('startCodeTab');
        if (nameTab && codeTab) {
            nameTab.style.display = 'block';
            codeTab.style.display = 'none';
        }
        openModal('startOverlay');
        
        console.log("✅ Reset durchgeführt - Start-Modal angezeigt");
        showMessage("Reset erfolgreich", "Alle Daten wurden gelöscht. Gib deinen Namen neu ein oder importiere einen Code.");
    } catch (e) {
        console.error('Fehler beim Reset:', e);
        showMessage('Fehler', 'Reset konnte nicht durchgeführt werden: ' + e.message);
    }
};

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

window.handleCodeImportAtStart = () => {
    try {
        const input = document.getElementById('startCodeInput');
        if (!input) {
            showMessage("Fehler", "Input-Feld nicht gefunden");
            return;
        }

        const code = input.value.trim();
        if (!code) {
            showMessage("Eingabe erforderlich", "Bitte füge einen Code ein");
            return;
        }

        // Versuche Code zu importieren
        const imported = importPersonalData(code);
        if (!imported) {
            showMessage("Fehler", "Code konnte nicht importiert werden. Überprüfe ihn und versuche es erneut.");
            return;
        }

        // Update myData
        myData.name = imported.name;
        myData.acts = imported.acts;
        myData.lastUpdated = imported.lastUpdated;

        // Speichern und App starten
        doSave();
        closeModal('startOverlay');
        startApp();
        showMessage("Erfolg", "Dein Plan wurde importiert!");
    } catch (e) {
        console.error("Fehler beim Import beim Start:", e);
        showMessage("Fehler", e.message || "Import ist fehlgeschlagen");
    }
};

window.switchTab = switchTab;

// Modal Helper global verfügbar machen
window.openModal = (id) => {
    if (id === 'infoOverlay') {
        populateInfoModal();
    }
    openModal(id);
};
window.closeModal = closeModal;
window.showMessage = showMessage;

// Starte die App
init();