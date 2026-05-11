let isLocked = false;

export function setLocked(locked) { isLocked = locked; }
export function getLocked() { return isLocked; }

export function render(timetable, currentDay, myData, buddies) {
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

export function setupEventDelegation(myData, save, renderCallback) {
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
            save(); renderCallback();
        }
    });
}

export function toggleBuddyVisibility(n, buddies) { buddies[n].visible = !buddies[n].visible; }
export function toggleLock() { 
    isLocked = !isLocked; 
    document.getElementById('lockBtn').innerText = isLocked ? "🔒 Locked" : "🔓 Lock"; 
}

export function buildNav(timetable, currentDay, setCurrentDay, renderCallback) {
    const days = [...new Set(timetable.timetable.map(a => a.day))].sort();
    document.getElementById('dayNav').innerHTML = days.map(d => `<button class="${d===currentDay?'active':''}" onclick="setCurrentDay('${d}'); buildNav(); renderCallback();">${new Date(d).toLocaleDateString('de-DE',{weekday:'short'})}</button>`).join('');
}

export function openModal(id) { document.getElementById(id).style.display = "flex"; }
export function closeModal(id) { document.getElementById(id).style.display = "none"; }
export function showMessage(title, text) { 
    document.getElementById('messageTitle').innerText = title; 
    document.getElementById('messageText').innerText = text; 
    openModal('messageOverlay'); 
}

export function handleInitialStart(myData, save, startApp) {
    const v = document.getElementById('initialInput').value.trim();
    if(!v) return;
    myData.name = v;
    myData.acts = [];
    myData.lastUpdated = Date.now();
    save(); startApp();
}

function parseT(t) { const [h,m] = t.split(':').map(Number); return h < 6 ? (h+24)*60+m : h*60+m; }