const STORAGE_PREFIX = "fb_data_";
const COLORS = ["#ff9f43", "#ee5253", "#10ac84", "#5f27cd", "#f368e0", "#00d2ff"];

let timetable = null, eventId = "", currentDay = "";
let myData = { name: "", acts: [], lastUpdated: 0 };
let buddies = {}; 
let isLocked = false;

async function init() {
    if (document.getElementById('festivalLinks')) {
        initHome();
    } else if (document.getElementById('mainGrid')) {
        initApp();
        setupEventDelegation();
    }
}

// --- INITIALISIERUNG ---
async function initApp() {
    const params = new URLSearchParams(window.location.search);
    eventId = params.get('event') || 'rip26';
    const friendFromUrl = params.get('friend');

    try {
        const res = await fetch(`data/${eventId}.json`);
        timetable = await res.json();
        
        const saved = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
        if(saved) { 
            myData = JSON.parse(saved); 
        } else { 
            openModal('startOverlay'); 
        }

        // Falls ein Freund im Link ist, diesen sofort importieren
        if (friendFromUrl) {
            importSingleFriend(friendFromUrl);
            // URL bereinigen
            const newUrl = window.location.origin + window.location.pathname + "?event=" + eventId;
            window.history.replaceState({}, document.title, newUrl);
        }
        
        startApp();
    } catch(e) { 
        console.error(e);
        window.location.href = 'index.html'; 
    }
}

function startApp() {
    closeModal('startOverlay');
    currentDay = timetable.date_start;
    buildNav();
    render();
}

// --- EXPORT: LINK GENERIEREN & TEILEN ---
function exportMyPlan() {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(myData))));
    // Erstellt den vollständigen Link
    const shareUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}&friend=${code}`;
    
    const area = document.getElementById('exportCodeArea');
    area.value = shareUrl;
    openModal('exportOverlay');
}

async function copyExportCode() {
    const shareUrl = document.getElementById('exportCodeArea').value;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'FestivalBuddy Plan',
                text: `Hier ist mein Plan für ${timetable.festival}!`,
                url: shareUrl
            });
            closeModal('exportOverlay');
        } catch (err) { /* Nutzer hat Teilen abgebrochen */ }
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showMessage("Kopiert", "Der Link wurde in die Zwischenablage kopiert.");
            closeModal('exportOverlay');
        });
    }
}

// --- IMPORT: MULTI-CODE & LINK PARSER ---
function confirmFriendImport() {
    const inputField = document.getElementById('friendCodeInput');
    const rawInput = inputField.value.trim();
    
    // WICHTIG: Erst das Import-Modal schließen, damit die Fehlermeldung davor erscheinen kann!
    closeModal('importOverlay');

    if (!rawInput) return;

    // Trennung nach Zeilenumbruch oder Leerzeichen für mehrere Freunde
    const lines = rawInput.split(/\n|,| /);
    let successCount = 0;
    let failCount = 0;

    lines.forEach(line => {
        let clean = line.trim();
        if (!clean) return;

        // Falls es ein Link ist, extrahiere den "friend=" Teil
        if (clean.includes('friend=')) {
            clean = clean.split('friend=')[1].split('&')[0];
        }

        if (importSingleFriend(clean)) {
            successCount++;
        } else {
            failCount++;
        }
    });

    inputField.value = ""; // Feld leeren
    render();

    if (successCount > 0) {
        showMessage("Erfolg", `${successCount} Freund(e) importiert/aktualisiert.`);
    } else if (failCount > 0) {
        showMessage("Fehler", "Ungültiger Code oder Link erkannt.");
    }
}

function importSingleFriend(code) {
    try {
        const decoded = atob(code);
        const fData = JSON.parse(decodeURIComponent(escape(decoded)));
        
        if (!fData.name || !Array.isArray(fData.acts)) return false;

        // Falls Freund schon existiert, nur updaten wenn die Daten neuer sind
        if (buddies[fData.name] && fData.lastUpdated <= buddies[fData.name].lastUpdated) {
            return true; 
        }

        buddies[fData.name] = {
            acts: fData.acts,
            lastUpdated: fData.lastUpdated || 0,
            color: buddies[fData.name]?.color || COLORS[Object.keys(buddies).length % COLORS.length],
            visible: true
        };
        return true;
    } catch (e) {
        return false;
    }
}

// --- UI & RENDERING ---
function render() {
    const grid = document.getElementById('mainGrid');
    if (!grid) return;
    const stages = [...new Set(timetable.timetable.map(a => a.stage))];
    
    // Buddy Bar
    const bar = document.getElementById('buddyContainer');
    bar.innerHTML = Object.keys(buddies).map(n => `
        <div class="buddy-badge ${buddies[n].visible ? 'active' : ''}" 
             style="--b-color:${buddies[n].color}" onclick="toggleBuddyVisibility('${n}')">
            ${n}
        </div>
    `).join('');

    // Grid-Header
    grid.style.gridTemplateColumns = `45px repeat(${stages.length}, 1fr)`;
    grid.innerHTML = `<div class="stage-header" style="left:0; z-index:25">Zeit</div>` + 
                     stages.map(s => `<div class="stage-header">${s}</div>`).join('');

    // Zeit-Skala
    for(let h=12; h<=26; h++) {
        const slot = document.createElement('div');
        slot.className = "time-label";
        slot.style.gridRow = (h-12)*12 + 2;
        slot.innerText = (h>=24?h-24:h)+":00";
        grid.appendChild(slot);
    }

    // Acts
    timetable.timetable.filter(a => a.day === currentDay).forEach(act => {
        const activeBuddies = Object.keys(buddies).filter(n => buddies[n].visible && buddies[n].acts.includes(act.act));
        const isMe = myData.acts.includes(act.act);
        
        const card = document.createElement('div');
        card.className = `act ${isMe ? 'is-me' : ''} ${isMe && activeBuddies.length ? 'is-match-full' : (activeBuddies.length ? 'is-match-others' : '')}`;
        card.dataset.actName = act.act;
        
        const start = parseT(act.start), end = parseT(act.end);
        card.style.gridRow = `${Math.floor((start-720)/5)+2} / span ${Math.floor((end-start)/5)}`;
        card.style.gridColumn = stages.indexOf(act.stage) + 2;
        
        const tags = activeBuddies.map(n => `<span class="tag" style="color:${buddies[n].color}">${n}</span>`).join(' ');
        card.innerHTML = `<span class="act-name">${act.act}</span><div class="buddy-tags">${tags}</div>`;
        grid.appendChild(card);
    });
}

// --- HELPER ---
function setupEventDelegation() {
    document.getElementById('mainGrid').addEventListener('click', (e) => {
        const card = e.target.closest('.act');
        if(card && !isLocked) {
            const name = card.dataset.actName;
            if (myData.acts.includes(name)) {
                myData.acts = myData.acts.filter(a => a !== name);
            } else {
                myData.acts.push(name);
            }
            myData.lastUpdated = Date.now();
            save(); render();
        }
    });
}
function parseT(t) { const [h,m] = t.split(':').map(Number); return h < 6 ? (h+24)*60+m : h*60+m; }
function toggleBuddyVisibility(n) { buddies[n].visible = !buddies[n].visible; render(); }
function toggleLock() { isLocked = !isLocked; document.getElementById('lockBtn').innerText = isLocked ? "🔒 Locked" : "🔓 Lock"; }
function save() { localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, JSON.stringify(myData)); }
function buildNav() {
    const days = [...new Set(timetable.timetable.map(a => a.day))].sort();
    document.getElementById('dayNav').innerHTML = days.map(d => `<button class="${d===currentDay?'active':''}" onclick="currentDay='${d}'; buildNav(); render();">${new Date(d).toLocaleDateString('de-DE',{weekday:'short'})}</button>`).join('');
}
function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function showMessage(title, text) { 
    document.getElementById('messageTitle').innerText = title; 
    document.getElementById('messageText').innerText = text; 
    openModal('messageOverlay'); 
}
function handleInitialStart() {
    const v = document.getElementById('initialInput').value.trim();
    if(!v) return;
    myData = { name: v, acts: [], lastUpdated: Date.now() };
    save(); startApp();
}

init();