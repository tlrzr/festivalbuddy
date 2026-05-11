import { saveData, loadData } from './modules/storage.js';
import { initTimetable, getTimetable, getEventId, getCurrentDay, setCurrentDay } from './modules/timetable.js';
import { exportMyPlan, copyExportCode, confirmFriendImport, importSingleFriendFromUrl, getBuddies } from './modules/exportImport.js';
import { render, setupEventDelegation, toggleBuddyVisibility, toggleLock, buildNav, openModal, closeModal, showMessage, handleInitialStart, setLocked } from './modules/ui.js';

let myData = { name: "", acts: [], lastUpdated: 0 };

async function init() {
    if (document.getElementById('festivalLinks')) {
        initHome();
    } else if (document.getElementById('mainGrid')) {
        await initApp();
        setupEventDelegation(myData, () => saveData(getEventId(), myData), () => render(getTimetable(), getCurrentDay(), myData, getBuddies()));
    }
}

// --- INITIALISIERUNG ---
async function initApp() {
    const params = new URLSearchParams(window.location.search);
    const { timetable, eventId } = await initTimetable(params);
    const friendFromUrl = params.get('friend');

    const saved = loadData(eventId);
    if(saved) { 
        myData = saved; 
    } else { 
        openModal('startOverlay'); 
    }

    // Falls ein Freund im Link ist, diesen sofort importieren
    if (friendFromUrl) {
        importSingleFriendFromUrl(friendFromUrl);
        // URL bereinigen
        const newUrl = window.location.origin + window.location.pathname + "?event=" + eventId;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    startApp();
}

function startApp() {
    closeModal('startOverlay');
    buildNav(getTimetable(), getCurrentDay(), setCurrentDay, () => render(getTimetable(), getCurrentDay(), myData, getBuddies()));
    render(getTimetable(), getCurrentDay(), myData, getBuddies());
}

async function initHome() {
    try {
        const res = await fetch('data/festivals.json');
        const festivals = await res.json();
        const container = document.getElementById('festivalLinks');
        container.innerHTML = festivals.map(f => `
            <a href="app.html?event=${f.id}" class="festival-link">
                <div class="festival-card" style="border-color: ${f.color}">
                    <h3>${f.name}</h3>
                    <p>${f.location}</p>
                    <p>${f.date}</p>
                </div>
            </a>
        `).join('');
        document.getElementById('loading-text').style.display = 'none';
    } catch (e) {
        console.error(e);
    }
}
window.exportMyPlan = () => exportMyPlan(myData, getTimetable(), getEventId());
window.copyExportCode = copyExportCode;
window.confirmFriendImport = () => confirmFriendImport();
window.toggleBuddyVisibility = (n) => { toggleBuddyVisibility(n, getBuddies()); render(getTimetable(), getCurrentDay(), myData, getBuddies()); };
window.toggleLock = toggleLock;
window.handleInitialStart = () => handleInitialStart(myData, () => saveData(getEventId(), myData), startApp);

init();