let players = JSON.parse(localStorage.getItem('rr_players')) || [];
let currentRound = parseInt(localStorage.getItem('rr_curRnd')) || 1;
let totalRounds = parseInt(localStorage.getItem('rr_totalRnd')) || 5;
let currentScreen = localStorage.getItem('rr_screen') || 'roundSetup';
let assignedRoles = JSON.parse(localStorage.getItem('rr_roles')) || [];
let currentTurn = parseInt(localStorage.getItem('rr_turn')) || 0;
let soundEnabled = localStorage.getItem('rr_sound') !== 'false';
let timerInterval, selectedSuspect = null;
let policeTimeLimit = parseInt(localStorage.getItem('rr_timer')) || 30;

const save = () => {
    localStorage.setItem('rr_players', JSON.stringify(players));
    localStorage.setItem('rr_curRnd', currentRound);
    localStorage.setItem('rr_totalRnd', totalRounds);
    localStorage.setItem('rr_timer', policeTimeLimit); // <--- ADD THIS LINE
    localStorage.setItem('rr_screen', currentScreen);
    localStorage.setItem('rr_roles', JSON.stringify(assignedRoles));
    localStorage.setItem('rr_turn', currentTurn);
    localStorage.setItem('rr_sound', soundEnabled);
};

const playSnd = (id) => { if(!soundEnabled) return; const s = document.getElementById(id); if(s) { s.currentTime = 0; s.play().catch(()=>{}); } };
const stopSnd = (id) => { const s = document.getElementById(id); if(s) { s.pause(); s.currentTime = 0; } };

window.onload = () => {
    if (players.length > 0) {
        showScreen(currentScreen);
        renderPlayerList();
        if (currentScreen === 'passwordScreen') prepareTurn();
    }
};

function showScreen(id) {
    currentScreen = id;
    ['roundSetup', 'setup', 'passwordScreen', 'policeScreen', 'celebrationScreen'].forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById(id)?.classList.remove('hidden');
    
    // Scoreboard 🏆 Visibility
    const btn = document.getElementById('matchScoreBtn');
    if (['passwordScreen', 'policeScreen', 'celebrationScreen'].includes(id) || (id === 'setup' && players.length > 0)) {
        btn.classList.remove('hidden'); btn.classList.add('flex');
    } else {
        btn.classList.add('hidden');
    }

    // Round Indicator
    const ind = document.getElementById('roundIndicator');
    if (['passwordScreen', 'policeScreen'].includes(id)) {
        ind.classList.remove('hidden'); ind.classList.add('flex');
        document.getElementById('curRnd').innerText = currentRound;
        document.getElementById('totalRnd').innerText = totalRounds;
    } else { ind.classList.add('hidden'); }
    save();
}
function syncRounds(val) {
    let num = parseInt(val);
    if (isNaN(num) || num < 1) num = 1; 
    
    // Update variables
    totalRounds = num;
    
    // Update UI elements
    const inputField = document.getElementById('roundInput');
    if (inputField) inputField.value = num;

    const setDisp = document.getElementById('setRndDisp');
    if (setDisp) setDisp.innerText = num;

    // Save specifically to your key
    localStorage.setItem('rr_totalRnd', num);
    save(); 
}
function continueGame() {
    // 1. Move to the Round Selection screen
    showScreen('roundSetup');
    
    // 2. Clear the input so the user can type how many NEW rounds to add
    const inputField = document.getElementById('roundInput');
    if (inputField) {
        inputField.value = ""; 
        inputField.placeholder = "00";
        inputField.focus();
    }
}

function confirmRounds() {
    const inputVal = parseInt(document.getElementById('roundInput').value) || 5;

    // IF PLAYERS ALREADY EXIST = WE ARE CONTINUING
    if (players.length > 0) {
        totalRounds += inputVal; // Add new rounds to current total
        currentRound++;          // Increment to next round
        save();                  // Save new totalRounds to localStorage
        startRound();            // Start the round immediately
    } 
    // IF NO PLAYERS = NEW GAME
    else {
        totalRounds = inputVal;
        save();
        showScreen('setup');     // Go to name entry (Lobby)
    }
}
function startGame() { if (players.length < 4) return alert("Min 4 Players"); currentRound = 1; startRound(); }

function startRound() {
    currentTurn = 0; selectedSuspect = null;
    let pool = ["👑", "👸", "👮", "👤"];
    while(pool.length < players.length) pool.push("👥");
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    assignedRoles = pool.map(e => e === "👑" ? "RAJA 👑" : e === "👸" ? "RANI 👸" : e === "👮" ? "KAVALAN 👮" : e === "👤" ? "THIRUDAN 👤" : "MAKKAL 👥");
    showScreen('passwordScreen'); prepareTurn();
}

function prepareTurn() {
    document.getElementById('pinEntryArea').classList.remove('hidden');
    document.getElementById('roleDisplayArea').classList.add('hidden');
    document.getElementById('passPhoneArea').classList.add('hidden');
    document.getElementById('turnIndicator').innerText = players[currentTurn].name;
    document.getElementById('checkPass').value = "";
}

function checkPassword() {
    if (document.getElementById('checkPass').value === players[currentTurn].pass) {
        const role = assignedRoles[currentTurn];
        let pts = role.includes("👑") ? "1000" : role.includes("👸") ? "500" : role.includes("👥") ? "300" : "250";
        document.getElementById('roleShow').innerHTML = `<h3 class="text-3xl font-royal text-yellow-500">${role}</h3><p class="text-6xl font-black mt-2">${pts}</p>`;
        document.getElementById('pinEntryArea').classList.add('hidden');
        document.getElementById('roleDisplayArea').classList.remove('hidden');
        if(role.includes("👮")) playSnd('sndSiren'); else playSnd('sndReveal');
    } else { alert("WRONG PIN"); document.getElementById('checkPass').value = ""; }
}

function hideRole() { stopSnd('sndSiren'); document.getElementById('roleDisplayArea').classList.add('hidden'); document.getElementById('passPhoneArea').classList.remove('hidden'); }
function nextPlayer() { currentTurn++; if (currentTurn < players.length) prepareTurn(); else startPolicePhase(); }

function startPolicePhase() {
    showScreen('policeScreen'); document.getElementById('mainBody').classList.add('siren-bg'); playSnd('sndSiren');
    const kIdx = assignedRoles.findIndex(r => r.includes("👮"));
    document.getElementById('policeName').innerText = players[kIdx].name;
    const btn = document.getElementById('arrestBtn');
    btn.classList.add('opacity-30', 'pointer-events-none', 'bg-slate-800');
    document.getElementById('suspectContainer').innerHTML = players.map((p, i) => i === kIdx ? '' : `
        <button onclick="handleSelect(${i}, this)" class="sus-btn w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center mb-2">
            <span class="font-bold text-white uppercase">${p.name}</span>
            <div class="w-5 h-5 rounded-full border-2 border-slate-600 status-circle"></div>
        </button>`).join('');
    let t = policeTimeLimit; document.getElementById('timerDisplay').innerText = t;
    timerInterval = setInterval(() => { t--; document.getElementById('timerDisplay').innerText = t; if(t <= 0) { clearInterval(timerInterval); submitGuess(true); } }, 1000);
}

function handleSelect(idx, el) {
    selectedSuspect = idx;
    document.querySelectorAll('.sus-btn').forEach(b => { b.classList.remove('border-blue-500', 'bg-blue-900/30'); b.querySelector('.status-circle').classList.remove('bg-blue-500'); });
    el.classList.add('border-blue-500', 'bg-blue-900/30'); el.querySelector('.status-circle').classList.add('bg-blue-500');
    document.getElementById('arrestBtn').classList.remove('opacity-30', 'pointer-events-none', 'bg-slate-800');
    document.getElementById('arrestBtn').classList.add('bg-blue-600');
}

function submitGuess(isTimeout) {
    clearInterval(timerInterval); stopSnd('sndSiren'); document.getElementById('mainBody').classList.remove('siren-bg');
    const tIdx = assignedRoles.findIndex(r => r.includes("👤")), kIdx = assignedRoles.findIndex(r => r.includes("👮"));
    players.forEach((p, i) => { 
        if(!p.history) p.history = []; p.history.push(assignedRoles[i].split(' ')[1]);
        if(assignedRoles[i].includes("👑")) p.score += 1000; else if(assignedRoles[i].includes("👸")) p.score += 500; else if(assignedRoles[i].includes("👥")) p.score += 300;
    });
    if (!isTimeout && selectedSuspect === tIdx) { players[kIdx].score += 250; playSnd('sndWin'); showVerdict("CAUGHT! 🚓", players[tIdx].name + " was the Thief!", "👮"); }
    else { players[tIdx].score += 250; playSnd('sndFail'); showVerdict("ESCAPED! 🎭", players[tIdx].name + " got away!", "👤"); }
    save();
}

function showVerdict(t, d, i) { 
    document.getElementById('verdictTitle').innerText = t; document.getElementById('verdictDesc').innerText = d; 
    document.getElementById('verdictIcon').innerText = i; document.getElementById('verdictOverlay').classList.remove('hidden'); 
}

function closeVerdict() { 
    document.getElementById('verdictOverlay').classList.add('hidden'); 
    if (currentRound < totalRounds) { currentRound++; startRound(); } else showCelebration(); 
}

function showCelebration() {
    showScreen('celebrationScreen');
    confetti({ 
        particleCount: 150, 
        spread: 70, 
        origin: { y: 0.6 },
        colors: ['#eab308', '#ffffff', '#3b82f6']
    });

    const winners = [...players].sort((a, b) => b.score - a.score);

    document.getElementById('podium').innerHTML = winners.map((p, i) => {
        const isFirst = i === 0;
        const rankColor = isFirst ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400';
        
        return `
        <div class="podium-item ${isFirst ? 'winner-glow bg-yellow-500/10' : 'bg-slate-900/50'} p-4 rounded-[2rem] border border-white/5 mb-3 flex items-center justify-between" style="animation-delay: ${i * 0.1}s">
            <div class="flex items-center gap-4">
                <div class="rank-badge ${rankColor}">${i + 1}</div>
                
                <div>
                    <h4 class="font-black text-white uppercase text-sm tracking-tight">${p.name}</h4>
                    <div class="flex gap-1 mt-1">
                        ${p.history.slice(-6).map(h => `<span class="history-dot">${h}</span>`).join('')}
                    </div>
                </div>
            </div>

            <div class="text-right">
                <span class="text-[10px] font-black text-slate-500 uppercase block leading-none mb-1">Total Points</span>
                <span class="text-2xl font-black ${isFirst ? 'text-yellow-500' : 'text-white'}">${p.score}</span>
            </div>
        </div>
        `;
    }).join('');
}

function addPlayer() {
    const n = document.getElementById('playerName'), p = document.getElementById('playerPass');
    if (!n.value || p.value.length !== 2) return alert("Need Name & 2-Digit PIN");
    players.push({ name: n.value.trim().toUpperCase(), pass: p.value, score: 0, history: [] });
    n.value = ""; p.value = ""; renderPlayerList(); save();
}

function renderPlayerList() {
    // Update the counter
    const counter = document.getElementById('playerCount');
    if(counter) counter.innerText = players.length;

    document.getElementById('playerList').innerHTML = players.map((p, i) => `
        <div class="bg-slate-900/60 p-3 rounded-xl flex justify-between items-center border border-slate-800 mb-2">
            <span class="font-bold text-xs text-white uppercase ml-2">${p.name}</span>
            <button onclick="removePlayer(${i})" class="text-red-500 px-3 py-1">✕</button>
        </div>
    `).join('');
    
    document.getElementById('startBtn').classList.toggle('hidden', players.length < 4);
}

function removePlayer(i) { players.splice(i, 1); renderPlayerList(); save(); }
function openLedger() {
    document.getElementById('ledgerModal').classList.remove('hidden');
    const sorted = [...players].sort((a,b) => b.score - a.score);
    document.getElementById('ledgerContent').innerHTML = sorted.map(p => `<div class="bg-slate-900 p-4 rounded-3xl mb-3"><div class="flex justify-between font-black"><span>${p.name}</span><span class="text-yellow-500">${p.score}</span></div><div class="flex gap-1 mt-2">${p.history.map(h=>`<span>${h}</span>`).join('')}</div></div>`).join('');
}
function closeLedger() { document.getElementById('ledgerModal').classList.add('hidden'); }
function toggleSettings() { document.getElementById('settingsModal').classList.toggle('hidden'); document.getElementById('setRndDisp').innerText = totalRounds; }
function adjRnd(v) { totalRounds = Math.max(1, totalRounds + v); document.getElementById('setRndDisp').innerText = totalRounds; save(); }
function toggleSound() { soundEnabled = !soundEnabled; document.getElementById('soundStatusLabel').innerText = soundEnabled ? "ON 🔊" : "OFF 🔇"; save(); }
function resetScoresOnly() { if(confirm("Reset scores?")) { players.forEach(p => { p.score = 0; p.history = []; }); currentRound = 1; save(); location.reload(); } }
function fullReset() { if(confirm("Wipe all?")) { localStorage.clear(); location.reload(); } }
function quitToLobby() { if(confirm("Quit to lobby?")) { closeLedger(); showScreen('setup'); } }

// Add these functions to the bottom of script.js
function jumpTimer(val) {
    policeTimeLimit += val;
    // Keep it between 30 and 120
    if (policeTimeLimit < 30) policeTimeLimit = 30;
    if (policeTimeLimit > 120) policeTimeLimit = 120;
    
    document.getElementById('setTimerDisp').innerText = policeTimeLimit;
    save(); // This ensures the setting is remembered next time you play
}

