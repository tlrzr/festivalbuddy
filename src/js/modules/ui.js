let isLocked = false;

export function setLocked(locked) { isLocked = locked; }
export function getLocked() { return isLocked; }

// Helper: HTML-Escaping für XSS-Prevention
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

export function openModal(id) { 
    try {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = "flex"; 
    } catch (e) {
        console.error("Fehler beim Öffnen von Modal:", id, e);
    }
}

export function closeModal(id) { 
    try {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = "none"; 
    } catch (e) {
        console.error("Fehler beim Schließen von Modal:", id, e);
    }
}

export function showMessage(title, text) { 
    try {
        const titleEl = document.getElementById('messageTitle');
        const textEl = document.getElementById('messageText');
        if (!titleEl || !textEl) {
            console.warn("Message Modal nicht gefunden");
            return;
        }
        titleEl.innerText = escapeHtml(String(title)); 
        textEl.innerText = escapeHtml(String(text)); 
        openModal('messageOverlay'); 
    } catch (e) {
        console.error("Fehler beim Anzeigen von Nachricht:", e);
    }
}

export function showToast(message) {
    try {
        // Erstelle Toast-Container falls nicht vorhanden
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        // Erstelle Toast-Element
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: toastSlideIn 0.3s ease-out;
            pointer-events: auto;
            cursor: pointer;
        `;
        toast.innerText = escapeHtml(String(message));
        toast.onclick = () => toast.remove();

        // Füge Toast hinzu
        toastContainer.appendChild(toast);

        // Entferne Toast nach 3 Sekunden automatisch
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);

        // CSS-Animationen hinzufügen falls nicht vorhanden
        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    } catch (e) {
        console.error("Fehler beim Anzeigen von Toast:", e);
    }
}

export function render(timetable, currentDay, myData, buddies) {
    try {
        if (!timetable || !timetable.timetable) {
            console.error("Ungültige Timetable");
            return;
        }

        const grid = document.getElementById('mainGrid');
        if (!grid) return;
        
        const stages = [...new Set(timetable.timetable.map(a => a.stage))];
        
        // Buddy Bar
        const bar = document.getElementById('buddyContainer');
        if (bar) {
            bar.innerHTML = Object.keys(buddies).map(n => `
                <div class="buddy-badge ${buddies[n].visible ? 'active' : ''}" 
                     style="--b-color:${buddies[n].color}" onclick="toggleBuddyVisibility('${escapeHtml(n)}')">
                    ${escapeHtml(n)}
                </div>
            `).join('');
        }

        // Grid-Header
        grid.style.gridTemplateColumns = `45px repeat(${stages.length}, 1fr)`;
        grid.innerHTML = `<div class="stage-header" style="left:0; z-index:25">Zeit</div>` + 
                         stages.map(s => `<div class="stage-header">${escapeHtml(s)}</div>`).join('');

        // Zeit-Skala
        for(let h=12; h<=26; h++) {
            const slot = document.createElement('div');
            slot.className = "time-label";
            slot.style.gridRow = (h-12)*12 + 2;
            slot.innerText = (h>=24?h-24:h)+":00";
            grid.appendChild(slot);
        }

        // Acts
        const dayActs = timetable.timetable.filter(a => a.day === currentDay);
        dayActs.forEach(act => {
            const activeBuddies = Object.keys(buddies).filter(n => buddies[n].visible && buddies[n].acts.includes(act.act));
            const isMe = myData.acts.includes(act.act);
            
            const card = document.createElement('div');
            card.className = `act ${isMe ? 'is-me' : ''} ${isMe && activeBuddies.length ? 'is-match-full' : (activeBuddies.length ? 'is-match-others' : '')}`;
            card.dataset.actName = act.act;
            
            const start = parseT(act.start), end = parseT(act.end);
            card.style.gridRow = `${Math.floor((start-720)/5)+2} / span ${Math.floor((end-start)/5)}`;
            card.style.gridColumn = stages.indexOf(act.stage) + 2;
            
            const timeStr = `${formatTime(start)} - ${formatTime(end)}`;
            const tags = activeBuddies.map(n => `<span class="tag" style="color:${buddies[n].color}">${escapeHtml(n)}</span>`).join(' ');
            card.innerHTML = `<span class="act-name">${escapeHtml(act.act)}</span><div class="act-time">${timeStr}</div><div class="buddy-tags">${tags}</div>`;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Fehler beim Rendern:", e);
        showMessage("Fehler", "Grid konnte nicht aktualisiert werden");
    }
}

export function setupEventDelegation(myData, save, renderCallback, trackClickCallback) {
    try {
        const grid = document.getElementById('mainGrid');
        if (!grid) {
            console.warn("mainGrid nicht gefunden");
            return;
        }

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.act');
            if(card && !isLocked) {
                const name = card.dataset.actName;
                if (!name) return;
                
                if (myData.acts.includes(name)) {
                    myData.acts = myData.acts.filter(a => a !== name);
                } else {
                    myData.acts.push(name);
                }
                myData.lastUpdated = Date.now();
                try {
                    save(); 
                    renderCallback();
                    // Klick zählen für Erinnerung
                    if (typeof trackClickCallback === 'function') {
                        trackClickCallback();
                    }
                } catch (e) {
                    console.error("Fehler beim Speichern:", e);
                    showMessage("Fehler", e.message || "Daten konnten nicht gespeichert werden");
                }
            }
        });

        grid.addEventListener('contextmenu', (e) => {
            const card = e.target.closest('.act');
            if (!card) return;
            e.preventDefault();
            openActContextMenu(card.dataset.actName, e.clientX, e.clientY);
        });

        let touchTimer = null;

        grid.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.act');
            if (!card) return;
            touchTimer = window.setTimeout(() => {
                const touch = e.touches[0];
                openActContextMenu(card.dataset.actName, touch.clientX, touch.clientY);
            }, 500);
        });

        grid.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
        });
        grid.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
        });
        grid.addEventListener('touchcancel', () => {
            clearTimeout(touchTimer);
        });    

    } catch (e) {
        console.error("Fehler beim Setup Event Delegation:", e);
    }
}

export function toggleBuddyVisibility(n, buddies) { 
    try {
        if (buddies[n]) {
            buddies[n].visible = !buddies[n].visible; 
        }
    } catch (e) {
        console.error("Fehler beim Umschalten von Buddy:", e);
    }
}

export function toggleLock() { 
    try {
        isLocked = !isLocked; 
        const btn = document.getElementById('lockBtn');
        if (btn) {
            btn.innerText = isLocked ? "🔒 Locked" : "🔓 Lock"; 
        }
    } catch (e) {
        console.error("Fehler beim Umschalten von Lock:", e);
    }
}

export function buildNav(timetable, currentDay, setCurrentDay, renderCallback) {
    try {
        if (!timetable || !timetable.timetable) {
            console.warn("Ungültiges Timetable für buildNav");
            return;
        }

        const days = [...new Set(timetable.timetable.map(a => a.day))].sort();
        const navEl = document.getElementById('dayNav');
        if (!navEl) {
            console.warn("dayNav nicht gefunden");
            return;
        }

        navEl.innerHTML = days.map(d => `<button class="${d===currentDay?'active':''}" onclick="setCurrentDayAndRender('${escapeHtml(d)}')">${new Date(d).toLocaleDateString('de-DE',{weekday:'short'})}</button>`).join('');
    } catch (e) {
        console.error("Fehler beim Aufbau der Navigation:", e);
    }
}

export function handleInitialStart(myData, save, startApp) {
    try {
        const input = document.getElementById('initialInput');
        if (!input) {
            console.warn("initialInput nicht gefunden");
            return;
        }

        const v = input.value.trim();
        if(!v) {
            showMessage("Eingabe erforderlich", "Bitte gebe deinen Namen ein");
            return;
        }

        if (v.length > 50) {
            showMessage("Zu lang", "Der Name darf max. 50 Zeichen sein");
            return;
        }

        myData.name = escapeHtml(v);
        myData.acts = [];
        myData.lastUpdated = Date.now();
        
        save();
        closeModal('startOverlay');
        startApp();
    } catch (e) {
        console.error("Fehler bei Initialisierung:", e);
        showMessage("Fehler", e.message || "Es ist ein Fehler aufgetreten");
    }
}

export function handleCodeImportAtStart(myData, importFn, save, startApp) {
    try {
        const input = document.getElementById('startCodeInput');
        if (!input) {
            console.warn("startCodeInput nicht gefunden");
            return;
        }

        const code = input.value.trim();
        if (!code) {
            showMessage("Eingabe erforderlich", "Bitte füge einen Code ein");
            return;
        }

        // Versuche Code zu importieren
        const imported = importFn(code);
        if (!imported) {
            showMessage("Fehler", "Code konnte nicht importiert werden. Überprüfe ihn und versuche es erneut.");
            return;
        }

        // Erfolgreicher Import
        save();
        closeModal('startOverlay');
        startApp();
        showMessage("Erfolg", "Plan wurde importiert!");
    } catch (e) {
        console.error("Fehler beim Import beim Start:", e);
        showMessage("Fehler", e.message || "Import ist fehlgeschlagen");
    }
}

export function switchTab(tabName) {
    try {
        const nameTab = document.getElementById('startNameTab');
        const codeTab = document.getElementById('startCodeTab');
        
        if (!nameTab || !codeTab) {
            console.warn("Tab-Elemente nicht gefunden");
            return;
        }

        if (tabName === 'name') {
            nameTab.style.display = 'block';
            codeTab.style.display = 'none';
        } else if (tabName === 'code') {
            nameTab.style.display = 'none';
            codeTab.style.display = 'block';
        }
    } catch (e) {
        console.error("Fehler beim Tab-Wechsel:", e);
    }
}

export function switchInfoTab(tabName) {
    try {
        // Tab-Buttons aktualisieren
        const tabs = document.querySelectorAll('.info-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`[onclick="switchInfoTab('${tabName}')"]`);
        if (activeTab) activeTab.classList.add('active');

        // Tab-Inhalte aktualisieren
        const contents = document.querySelectorAll('.info-tab-content');
        contents.forEach(content => content.classList.remove('active'));
        const activeContent = document.getElementById(`${tabName}Tab`);
        if (activeContent) activeContent.classList.add('active');
    } catch (e) {
        console.error("Fehler beim Info-Tab-Wechsel:", e);
    }
}

function parseT(t) { 
    try {
        const [h,m] = t.split(':').map(Number); 
        if (isNaN(h) || isNaN(m)) return 0;
        return h < 6 ? (h+24)*60+m : h*60+m; 
    } catch (e) {
        console.error("Fehler beim Parsen der Zeit:", t);
        return 0;
    }
}

function formatTime(minutes) {
    try {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const displayH = h >= 24 ? h - 24 : h;
        return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } catch (e) {
        console.error("Fehler beim Formatieren der Zeit:", minutes);
        return "00:00";
    }
}

function formatWikiLink(name, lang) {
    const safeName = encodeURIComponent(name.replace(/ /g, '_'));
    return `https://${lang}.wikipedia.org/wiki/${safeName}`;
}

export function openActContextMenu(actName, x, y) {
    if (!actName) return;
    const menu = document.getElementById('actContextMenu');
    const wikiDELink = document.getElementById('wikiDeLink');
    const wikiENLink = document.getElementById('wikiEnLink');
    const spotifyLink = document.getElementById('spotifyLink');
    const spotifyAppLink = document.getElementById('spotifyAppLink');
    const youtubeLink = document.getElementById('youtubeLink');
    const deezerLink = document.getElementById('deezerLink');
    const soundcloudLink = document.getElementById('soundcloudLink');
    const appleMusicLink = document.getElementById('appleMusicLink');
    const amazonMusicLink = document.getElementById('amazonMusicLink');
    if (!menu || !wikiDELink || !wikiENLink || !spotifyLink) return;

    wikiDELink.href = formatWikiLink(actName, 'de');
    wikiENLink.href = formatWikiLink(actName, 'en');
    spotifyLink.href = `https://open.spotify.com/search/${encodeURIComponent(actName)}`;
    spotifyAppLink.href = `spotify:search:${encodeURIComponent(actName)}`;
    youtubeLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(actName)}`;
    deezerLink.href = `https://www.deezer.com/search/${encodeURIComponent(actName)}`;
    appleMusicLink.href = `https://music.apple.com/search?term=${encodeURIComponent(actName)}`;
    amazonMusicLink.href = `https://music.amazon.com/search?q=${encodeURIComponent(actName)}`;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'flex';
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#actContextMenu')) {
        const menu = document.getElementById('actContextMenu');
        if (menu) menu.style.display = 'none';
    }
});