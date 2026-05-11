const COLORS = ["#ff9f43", "#ee5253", "#10ac84", "#5f27cd", "#f368e0", "#00d2ff"];

let buddies = {};

export function getBuddies() { return buddies; }

export function exportMyPlan(myData, timetable, eventId) {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(myData))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}&friend=${code}`;
    
    const area = document.getElementById('exportCodeArea');
    area.value = shareUrl;
    openModal('exportOverlay');
}

export async function copyExportCode() {
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
    // render() wird von außen aufgerufen

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

export function importSingleFriendFromUrl(code) {
    return importSingleFriend(code);
}

// Helper functions (assume defined elsewhere or import)
function openModal(id) { document.getElementById(id).style.display = "flex"; }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function showMessage(title, text) { 
    document.getElementById('messageTitle').innerText = title; 
    document.getElementById('messageText').innerText = text; 
    openModal('messageOverlay'); 
}