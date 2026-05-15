const COLORS = ["#ff9f43", "#ee5253", "#10ac84", "#5f27cd", "#f368e0", "#00d2ff"];

let buddies = {};

// Helper: Escape HTML für XSS-Prevention
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

export function getBuddies() { return buddies; }

export function setBuddies(newBuddies) {
    buddies = newBuddies || {};
}

export function clearBuddies() {
    buddies = {};
}

export function exportMyPlan(myData, timetable, eventId) {
    if (!myData || !timetable || !eventId) {
        console.error("Fehlendes Argument für exportMyPlan");
        return;
    }
    
    try {
        const code = btoa(unescape(encodeURIComponent(JSON.stringify(myData))));
        const shareUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}&friend=${encodeURIComponent(code)}`;
        
        const area = document.getElementById('exportCodeArea');
        if (!area) {
            console.error("exportCodeArea nicht gefunden");
            return;
        }
        
        area.value = shareUrl;
        openModal('exportOverlay');
    } catch (e) {
        console.error("Fehler beim Exportieren:", e);
        showMessage("Fehler", "Plan konnte nicht exportiert werden");
    }
}

export function saveMyPlan(myData, eventId, buddies) {
    if (!myData || !eventId) {
        console.error("Fehlendes Argument für saveMyPlan");
        return null;
    }

    const myCode = btoa(unescape(encodeURIComponent(JSON.stringify(myData))));

    const friendParams = Object.entries(buddies).map(([name, buddy]) => {
        const friendData = {
            name,
            acts: buddy.acts || [],
            lastUpdated: buddy.lastUpdated || 0
        };
        const friendCode = btoa(unescape(encodeURIComponent(JSON.stringify(friendData))));
        return `friend=${encodeURIComponent(friendCode)}`;
    });

    const params = [
        `event=${encodeURIComponent(eventId)}`,
        `code=${encodeURIComponent(myCode)}`,
        ...friendParams
    ].join('&');

    return `${window.location.origin}${window.location.pathname}?${params}`;
}

export async function copyExportCode() {
    try {
        const shareUrl = document.getElementById('exportCodeArea').value;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'FestivalBuddy Plan',
                    text: `Hier ist mein Plan für das Festival!`,
                    url: shareUrl
                });
                closeModal('exportOverlay');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Fehler beim Teilen:", err);
                }
            }
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showMessage("Kopiert", "Der Link wurde in die Zwischenablage kopiert.");
                closeModal('exportOverlay');
            }).catch(err => {
                console.error("Fehler beim Kopieren:", err);
                showMessage("Fehler", "Link konnte nicht kopiert werden");
            });
        }
    } catch (e) {
        console.error("Fehler in copyExportCode:", e);
    }
}

export async function copySaveCode() {
    try {
        const shareUrl = document.getElementById('saveCodeArea').value;
        
        if (false) {
        // if (navigator.share) {
        //     try {
        //         await navigator.share({
        //             title: 'FestivalBuddy Plan',
        //             text: `Hier ist meine Sicherung für das Festival!`,
        //             url: shareUrl
        //         });
        //         closeModal('saveOverlay');
        //     } catch (err) {
        //         if (err.name !== 'AbortError') {
        //             console.error("Fehler beim Sichern:", err);
        //         }
        //     }
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showMessage("Kopiert", "Der Link wurde in die Zwischenablage kopiert.");
                closeModal('saveOverlay');
            }).catch(err => {
                console.error("Fehler beim Kopieren:", err);
                showMessage("Fehler", "Link konnte nicht kopiert werden");
            });
        }
    } catch (e) {
        console.error("Fehler in copySaveCode:", e);
    }
}

export function confirmFriendImport() {
    const inputField = document.getElementById('friendCodeInput');
    const rawInput = inputField.value.trim();
    
    closeModal('importOverlay');

    if (!rawInput) return;

    const lines = rawInput.split(/\n|,| /);
    let successCount = 0;
    let failCount = 0;

    lines.forEach(line => {
        let clean = line.trim();
        if (!clean) return;

        if (clean.includes('friend=')) {
            clean = clean.split('friend=')[1].split('&')[0];
        }

        if (importSingleFriend(clean)) {
            successCount++;
        } else {
            failCount++;
        }
    });

    inputField.value = "";

    if (successCount > 0) {
        showMessage("Erfolg", `${successCount} Freund(e) importiert/aktualisiert.`);
    } else if (failCount > 0) {
        showMessage("Fehler", "Ungültiger Code oder Link erkannt.");
    }
}

function importSingleFriend(code) {
    try {
        if (!code || code.length < 5) return false;
        
        const decoded = atob(code);
        const fData = JSON.parse(decodeURIComponent(escape(decoded)));
        
        if (!fData.name || typeof fData.name !== 'string' || !Array.isArray(fData.acts)) {
            return false;
        }
        
        // Name validieren und escapen (max 50 Zeichen)
        const cleanName = escapeHtml(fData.name.trim().substring(0, 50));
        if (!cleanName) return false;

        // Acts validieren (nur Strings, max 100)
        if (fData.acts.length > 100) return false;
        const cleanActs = fData.acts
            .filter(a => typeof a === 'string' && a.length > 0)
            .map(a => escapeHtml(a.substring(0, 100)));

        if (buddies[cleanName] && fData.lastUpdated && fData.lastUpdated <= buddies[cleanName].lastUpdated) {
            return true; 
        }

        buddies[cleanName] = {
            acts: cleanActs,
            lastUpdated: fData.lastUpdated || 0,
            color: buddies[cleanName]?.color || COLORS[Object.keys(buddies).length % COLORS.length],
            visible: true
        };
        return true;
    } catch (e) {
        console.error("Fehler beim Importieren eines Freundes:", e);
        return false;
    }
}

export function importSingleFriendFromUrl(code) {
    return importSingleFriend(code);
}

export function importPersonalData(code) {
    try {
        if (!code || code.length < 5) return null;

        let clean = code.trim();
        if (clean.includes('friend=')) {
            clean = clean.split('friend=')[1].split('&')[0];
        }
        if (clean.includes('http://') || clean.includes('https://')) {
            const url = new URL(clean, window.location.origin);
            const friendParam = url.searchParams.get('friend');
            if (!friendParam) return null;
            clean = friendParam;
        }
        
        const decoded = atob(clean);
        const data = JSON.parse(decodeURIComponent(escape(decoded)));
        
        if (!data.name || typeof data.name !== 'string' || !Array.isArray(data.acts)) {
            return null;
        }
        
        // Name validieren
        const cleanName = escapeHtml(data.name.trim().substring(0, 50));
        if (!cleanName) return null;

        // Acts validieren
        if (data.acts.length > 100) return null;
        const cleanActs = data.acts
            .filter(a => typeof a === 'string' && a.length > 0)
            .map(a => escapeHtml(a.substring(0, 100)));

        return {
            name: cleanName,
            acts: cleanActs,
            lastUpdated: data.lastUpdated || 0
        };
    } catch (e) {
        console.error("Fehler beim Importieren von persönlichen Daten:", e);
        return null;
    }
}

// Helper functions (sollten eigentlich von ui.js kommen, aber hier für Kompatibilität)
function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex"; 
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none"; 
}

function showMessage(title, text) { 
    document.getElementById('messageTitle').innerText = escapeHtml(title); 
    document.getElementById('messageText').innerText = escapeHtml(text); 
    openModal('messageOverlay'); 
}