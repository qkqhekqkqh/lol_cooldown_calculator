let currentVersion = '14.1.1'; 
let champions = {};
let slots = {
    1: {
        id: null,
        haste: 0,
        ultHaste: 0,
        data: null,
        summonerD: 'Ignite',
        summonerF: 'Flash',
        summonerBootsOn: false,
        summonerBootsTier3: false,
        summonerCosmicOn: false,
        spellTimers: {
            D: { intervalId: null, endAt: 0, durationSec: 0 },
            F: { intervalId: null, endAt: 0, durationSec: 0 }
        }
    },
    2: {
        id: null,
        haste: 0,
        ultHaste: 0,
        data: null,
        summonerD: 'Ignite',
        summonerF: 'Flash',
        summonerBootsOn: false,
        summonerBootsTier3: false,
        summonerCosmicOn: false,
        spellTimers: {
            D: { intervalId: null, endAt: 0, durationSec: 0 },
            F: { intervalId: null, endAt: 0, durationSec: 0 }
        }
    }
};
let activeSlot = 1;
let championGridResizeRaf = 0;

// 필터 설정
let currentSearch = "";
let currentConsonant = "ALL";
const HANGUL_INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const FILTER_KEYS = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const HASTE_MIN = 0;
const HASTE_MAX = 500;
const HASTE_DRAG_STEP_PX = 7;
const HASTE_DRAG_THRESHOLD_PX = 3;
const SUMMONER_SPELLS = {
    "Flash": { name: "점멸", cooldown: 300, icon: "assets/spells/120px-Flash_HD.png" },
    "Heal": { name: "회복", cooldown: 240, icon: "assets/spells/120px-Heal_HD.png" },
    "Ghost": { name: "유체화", cooldown: 240, icon: "assets/spells/120px-Ghost_HD.png" },
    "Ignite": { name: "점화", cooldown: 180, icon: "assets/spells/120px-Ignite_HD.png" },
    "Exhaust": { name: "탈진", cooldown: 240, icon: "assets/spells/120px-Exhaust_HD.png" },
    "Barrier": { name: "방어막", cooldown: 180, icon: "assets/spells/120px-Barrier_HD.png" },
    "Teleport": { name: "순간이동", cooldown: 360, icon: "assets/spells/120px-Teleport_HD.png" },
    "UnleashedTeleport": { name: "강화 순간이동", cooldown: 240, icon: "assets/spells/120px-Unleashed_Teleport_HD.png" },
    "Smite": { name: "강타", cooldown: 90, icon: "assets/spells/120px-Smite_HD.png" },
    "Cleanse": { name: "정화", cooldown: 240, icon: "assets/spells/120px-Cleanse_HD.png" },
    "Clarity": { name: "총명", cooldown: 240, icon: "assets/spells/120px-Clarity_HD.png" }
};
const SUMMONER_HASTE_VALUES = {
    bootsT2: 10,
    bootsT3: 20,
    cosmicInsight: 18
};

// 예외 처리 데이터
const AMMO_EXCLUSIONS = ["Leblanc", "Xerath", "Akali", "Kled"];

const COOLDOWN_OVERRIDES = {
    "Gangplank": { 2: [18, 17, 16, 15, 14] }, 
    "Teemo": { 3: [30, 25, 20] },             
    "Corki": { 3: [12, 11, 10] },             
    "Akali": { 3: [100, 80, 60] },            
    "Heimerdinger": { 0: [20, 20, 20, 20, 20] }, 
    "Caitlyn": { 1: [30, 25.5, 21, 16.5, 12] },  
    "Vi": { 2: [14, 12.5, 11, 9.5, 8] },         
    "Ashe": { 2: [90, 80, 70, 60, 50] },         
    "Kalista": { 1: [30, 30, 30, 30, 30] },      
    "Ivern": { 1: [40, 36, 32, 28, 24] },        
    "Nilah": { 2: [26, 22.5, 19, 15.5, 12] },    
    "Taric": { 0: [15, 15, 15, 15, 15] },        
    "Amumu": { 0: [16, 15.5, 15, 14.5, 14] },    
    "Velkoz": { 1: [19, 18, 17, 16, 15] },       
    "Jhin": { 2: [28, 25, 22, 19, 16] },         
    "Rumble": { 2: [6, 6, 6, 6, 6] },            
    "Zyra": { 1: [18, 16, 14, 12, 10] },         
    "Xerath": { 3: [130, 115, 100] },
    // 폼 변환 챔피언
    "Nidalee": { 0: { "인간": [6], "쿠거": [5] }, 1: { "인간": [13,12,11,10,9], "쿠거": [5] }, 2: { "인간": [12], "쿠거": [5] } },
    "Elise": { 0: { "인간": [6], "거미": [6] }, 1: { "인간": [12], "거미": [10] }, 2: { "인간": [12,11,10,9,8], "거미": [22,21,20,19,18] } },
    "Jayce": { 0: { "해머": [16,14,12,10,8,6], "캐논": [8] }, 1: { "해머": [10], "캐논": [13,11.4,9.8,8.2,6.6,5] }, 2: { "해머": [20,18,16,14,12,10], "캐논": [16] } },
    "Kled": { 0: { "스칼 탑승": [11, 10, 9, 8, 7], "스칼 미탑승 (충전)": [20, 20, 20, 20, 20] } },
    "Azir": { 1: [10, 9, 8, 7, 6] }
};

// DOM 로드 시 실행 (안전장치)
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); 
    init(); 
});

async function init() {
    try {
        const verRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await verRes.json();
        currentVersion = versions[0];
        
        const verEl = document.getElementById('header-version');
        if (verEl) {
            const parts = currentVersion.split('.');
            if (parts.length >= 2) {
                const major = parseInt(parts[0]) + 10;
                const minor = parts[1];
                verEl.innerText = `Patch ${major}.${minor}`;
            } else {
                verEl.innerText = `Patch ${currentVersion}`;
            }
        }

        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/ko_KR/championFull.json`);
        const champData = await champRes.json();
        champions = champData.data;

        createFilterButtons(); 
        renderChampionList();  
        
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
    }
}

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.add('active');
    sidebar.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sidebar-open');
    scheduleChampionGridSync();
    setTimeout(scheduleChampionGridSync, 300);
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('active');
    sidebar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sidebar-open');
}

function createFilterButtons() {
    const bar = document.getElementById('filter-bar');
    if(!bar) return;
    bar.innerHTML = "";
    FILTER_KEYS.forEach(key => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${key === '전체' ? 'active all-btn' : ''}`;
        btn.innerText = key;
        btn.dataset.key = key;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentConsonant = key === '전체' ? 'ALL' : key;
            const sInput = document.getElementById('search-input');
            if(sInput) sInput.value = ""; 
            currentSearch = ""; 
            renderChampionList();
        };
        bar.appendChild(btn);
    });
}

function getChoseong(str) {
    const code = str.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return "";
    const initialIndex = Math.floor(code / 588);
    return HANGUL_INITIALS[initialIndex] || "";
}

function syncChampionGridSquares() {
    const grid = document.getElementById('champion-grid');
    if (!grid) return;
    grid.querySelectorAll('.champ-item').forEach((item) => {
        item.style.height = `${item.clientWidth}px`;
    });
}

function scheduleChampionGridSync() {
    if (championGridResizeRaf) cancelAnimationFrame(championGridResizeRaf);
    championGridResizeRaf = requestAnimationFrame(() => {
        syncChampionGridSquares();
        championGridResizeRaf = 0;
    });
}

function renderChampionList() {
    const grid = document.getElementById('champion-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    let champList = Object.values(champions);
    champList.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

    champList.forEach(champ => {
        if (currentSearch && !champ.name.includes(currentSearch) && !champ.id.toLowerCase().includes(currentSearch.toLowerCase())) return;
        if (currentConsonant !== 'ALL') {
            const initial = getChoseong(champ.name);
            if (initial !== currentConsonant) return;
        }

        const selectAndClose = () => {
            selectChampion(champ.id);
            closeSidebar();
        };

        const item = document.createElement('div');
        item.className = 'champ-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.onclick = selectAndClose;
        item.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectAndClose();
            }
        };

        const img = document.createElement('img');
        img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champ.image.full}`;
        img.loading = "lazy";
        img.className = 'champ-thumb';
        img.alt = `${champ.name} 초상화`;

        const name = document.createElement('span');
        name.innerText = champ.name;
        
        item.appendChild(img);
        item.appendChild(name);
        grid.appendChild(item);
    });

    scheduleChampionGridSync();
}

function createSummonerIconOptions(slotId, keyBind) {
    return Object.entries(SUMMONER_SPELLS).map(([key, val]) => `
        <button type="button" class="spell-option-btn" data-slot-id="${slotId}" data-key-bind="${keyBind}" data-spell="${key}" aria-label="${val.name}">
            <img src="${val.icon}" alt="${val.name}" loading="lazy">
            <span>${val.name}</span>
        </button>
    `).join('');
}

function ensureSpellSettingsUI(slotId) {
    const controls = document.querySelector(`#slot-${slotId} .slot-controls`);
    if (!controls || controls.querySelector('.spell-settings')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'spell-settings';
    wrapper.innerHTML = `
        <div class="spell-settings-layout">
            <div class="spell-stack">
                <p class="spell-settings-title">스펠 설정</p>
                <div class="spell-cell">
                    <div class="spell-picker" role="group" aria-label="D 스펠">
                        <button type="button" id="spell-trigger-d-${slotId}" class="spell-current-trigger" aria-label="D 스펠 타이머 시작">
                            <div class="spell-current">
                                <img id="spell-icon-d-${slotId}" class="spell-current-icon" src="" alt="">
                                <span id="spell-dim-d-${slotId}" class="spell-dim-overlay" aria-hidden="true"></span>
                                <span id="spell-ring-d-${slotId}" class="spell-progress-ring" aria-hidden="true"></span>
                                <span id="spell-timer-d-${slotId}" class="spell-timer-overlay">0</span>
                            </div>
                        </button>
                    </div>
                    <span class="spell-cd" id="spell-cd-d-${slotId}">-</span>
                    <div id="spell-dropdown-d-${slotId}" class="spell-dropdown" aria-label="D 스펠 목록">
                        ${createSummonerIconOptions(slotId, 'D')}
                    </div>
                </div>
                <div class="spell-cell">
                    <div class="spell-picker" role="group" aria-label="F 스펠">
                        <button type="button" id="spell-trigger-f-${slotId}" class="spell-current-trigger" aria-label="F 스펠 타이머 시작">
                            <div class="spell-current">
                                <img id="spell-icon-f-${slotId}" class="spell-current-icon" src="" alt="">
                                <span id="spell-dim-f-${slotId}" class="spell-dim-overlay" aria-hidden="true"></span>
                                <span id="spell-ring-f-${slotId}" class="spell-progress-ring" aria-hidden="true"></span>
                                <span id="spell-timer-f-${slotId}" class="spell-timer-overlay">0</span>
                            </div>
                        </button>
                    </div>
                    <span class="spell-cd" id="spell-cd-f-${slotId}">-</span>
                    <div id="spell-dropdown-f-${slotId}" class="spell-dropdown" aria-label="F 스펠 목록">
                        ${createSummonerIconOptions(slotId, 'F')}
                    </div>
                </div>
            </div>
            <div class="spell-haste-panel">
                <div class="spell-haste-row">
                    <div class="spell-haste-label">
                        <img src="assets/ionia.webp" alt="명석함의 아이오니아 장화" class="spell-haste-icon">
                        <span>명석함의 아이오니아 장화</span>
                    </div>
                    <label class="switch-toggle">
                        <input type="checkbox" id="summ-haste-boots-${slotId}">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="spell-haste-row">
                    <div class="spell-haste-label">
                        <img src="assets/ionia-3tier.webp" alt="핏빛 명석함 (3티어)" class="spell-haste-icon">
                        <span>핏빛 명석함 (3티어)</span>
                    </div>
                    <label class="switch-toggle">
                        <input type="checkbox" id="summ-haste-boots3-${slotId}">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="spell-haste-row">
                    <div class="spell-haste-label">
                        <img src="assets/wutong.png" alt="우주적 통찰력 룬" class="spell-haste-icon">
                        <span>우주적 통찰력</span>
                    </div>
                    <label class="switch-toggle">
                        <input type="checkbox" id="summ-haste-cosmic-${slotId}">
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <p class="spell-haste-total">총 스펠 가속: <span id="summ-haste-total-${slotId}">0</span></p>
            </div>
        </div>
    `;
    controls.appendChild(wrapper);
}

function getSummonerHaste(slotId) {
    const slot = slots[slotId];
    const boots = slot.summonerBootsOn
        ? (slot.summonerBootsTier3 ? SUMMONER_HASTE_VALUES.bootsT3 : SUMMONER_HASTE_VALUES.bootsT2)
        : 0;
    const cosmic = slot.summonerCosmicOn ? SUMMONER_HASTE_VALUES.cosmicInsight : 0;
    return boots + cosmic;
}

function getSummonerSpellCooldown(slotId, spellKey) {
    const spell = SUMMONER_SPELLS[spellKey];
    if (!spell) return 0;
    return calculateCDR(spell.cooldown, getSummonerHaste(slotId));
}

function setSpellTimerVisual(slotId, keyBind, remaining, durationSec = 0) {
    const el = document.getElementById(`spell-timer-${keyBind.toLowerCase()}-${slotId}`);
    const ring = document.getElementById(`spell-ring-${keyBind.toLowerCase()}-${slotId}`);
    const dim = document.getElementById(`spell-dim-${keyBind.toLowerCase()}-${slotId}`);
    if (!el) return;

    if (remaining <= 0) {
        el.classList.remove('active');
        el.innerText = '0';
        if (dim) dim.classList.remove('active');
        if (ring) {
            ring.classList.remove('active');
            ring.style.setProperty('--progress-angle', '0turn');
        }
    } else {
        const wholeSeconds = Math.ceil(remaining);
        const elapsedRatio = durationSec > 0
            ? Math.min(Math.max((durationSec - remaining) / durationSec, 0), 1)
            : 0;
        el.classList.add('active');
        el.innerText = `${wholeSeconds}s`;
        if (dim) dim.classList.add('active');
        if (ring) {
            ring.classList.add('active');
            ring.style.setProperty('--progress-angle', `${elapsedRatio}turn`);
        }
    }
}

function stopSpellTimer(slotId, keyBind) {
    const timer = slots[slotId].spellTimers[keyBind];
    if (!timer) return;
    if (timer.intervalId) clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.endAt = 0;
    timer.durationSec = 0;
    setSpellTimerVisual(slotId, keyBind, 0, 0);
}

function startSpellTimer(slotId, keyBind) {
    const slot = slots[slotId];
    const spellKey = keyBind === 'D' ? slot.summonerD : slot.summonerF;
    const durationSec = getSummonerSpellCooldown(slotId, spellKey);
    if (!durationSec || durationSec <= 0) return;

    stopSpellTimer(slotId, keyBind);
    const timer = slot.spellTimers[keyBind];
    timer.durationSec = durationSec;
    timer.endAt = Date.now() + (durationSec * 1000);

    const tick = () => {
        const remaining = Math.max((timer.endAt - Date.now()) / 1000, 0);
        setSpellTimerVisual(slotId, keyBind, remaining, timer.durationSec);
        if (remaining <= 0) stopSpellTimer(slotId, keyBind);
    };

    tick();
    timer.intervalId = setInterval(tick, 120);
}

function updateSummonerHasteControls(slotId) {
    const slot = slots[slotId];
    const bootsEl = document.getElementById(`summ-haste-boots-${slotId}`);
    const boots3El = document.getElementById(`summ-haste-boots3-${slotId}`);
    const cosmicEl = document.getElementById(`summ-haste-cosmic-${slotId}`);
    const totalEl = document.getElementById(`summ-haste-total-${slotId}`);
    if (bootsEl) bootsEl.checked = slot.summonerBootsOn;
    if (boots3El) {
        boots3El.checked = slot.summonerBootsTier3;
        boots3El.disabled = !slot.summonerBootsOn;
    }
    if (cosmicEl) cosmicEl.checked = slot.summonerCosmicOn;
    if (totalEl) totalEl.innerText = `${getSummonerHaste(slotId)}`;
}

function refreshActiveSpellTimers(slotId) {
    ['D', 'F'].forEach((keyBind) => {
        const timer = slots[slotId].spellTimers[keyBind];
        if (!timer || !timer.intervalId) return;
        const remaining = Math.max((timer.endAt - Date.now()) / 1000, 0);
        if (remaining <= 0) {
            stopSpellTimer(slotId, keyBind);
            return;
        }
        setSpellTimerVisual(slotId, keyBind, remaining, timer.durationSec);
    });
}

function updateSummonerCooldownsInSlot(slotId) {
    const slot = slots[slotId];
    const d = SUMMONER_SPELLS[slot.summonerD];
    const f = SUMMONER_SPELLS[slot.summonerF];
    const dCd = document.getElementById(`spell-cd-d-${slotId}`);
    const fCd = document.getElementById(`spell-cd-f-${slotId}`);
    const dIcon = document.getElementById(`spell-icon-d-${slotId}`);
    const fIcon = document.getElementById(`spell-icon-f-${slotId}`);

    if (dCd) dCd.innerText = d ? `${getSummonerSpellCooldown(slotId, slot.summonerD)}초` : '-';
    if (fCd) fCd.innerText = f ? `${getSummonerSpellCooldown(slotId, slot.summonerF)}초` : '-';

    if (dIcon && d) {
        dIcon.src = d.icon;
        dIcon.alt = `${d.name} 아이콘`;
    }
    if (fIcon && f) {
        fIcon.src = f.icon;
        fIcon.alt = `${f.name} 아이콘`;
    }

    updateSummonerHasteControls(slotId);
    refreshActiveSpellTimers(slotId);
}

function setupSummonerSpellControls(slotId) {
    ensureSpellSettingsUI(slotId);

    const dTrigger = document.getElementById(`spell-trigger-d-${slotId}`);
    const fTrigger = document.getElementById(`spell-trigger-f-${slotId}`);
    const bootsEl = document.getElementById(`summ-haste-boots-${slotId}`);
    const boots3El = document.getElementById(`summ-haste-boots3-${slotId}`);
    const cosmicEl = document.getElementById(`summ-haste-cosmic-${slotId}`);

    if (dTrigger && !dTrigger.dataset.bound) {
        dTrigger.addEventListener('click', () => startSpellTimer(slotId, 'D'));
        dTrigger.dataset.bound = 'true';
    }

    if (fTrigger && !fTrigger.dataset.bound) {
        fTrigger.addEventListener('click', () => startSpellTimer(slotId, 'F'));
        fTrigger.dataset.bound = 'true';
    }

    if (bootsEl && !bootsEl.dataset.bound) {
        bootsEl.addEventListener('change', (e) => {
            slots[slotId].summonerBootsOn = e.target.checked;
            if (!e.target.checked) slots[slotId].summonerBootsTier3 = false;
            updateSummonerCooldownsInSlot(slotId);
        });
        bootsEl.dataset.bound = 'true';
    }

    if (boots3El && !boots3El.dataset.bound) {
        boots3El.addEventListener('change', (e) => {
            if (!slots[slotId].summonerBootsOn) {
                e.target.checked = false;
                return;
            }
            slots[slotId].summonerBootsTier3 = e.target.checked;
            updateSummonerCooldownsInSlot(slotId);
        });
        boots3El.dataset.bound = 'true';
    }

    if (cosmicEl && !cosmicEl.dataset.bound) {
        cosmicEl.addEventListener('change', (e) => {
            slots[slotId].summonerCosmicOn = e.target.checked;
            updateSummonerCooldownsInSlot(slotId);
        });
        cosmicEl.dataset.bound = 'true';
    }

    document.querySelectorAll(`#slot-${slotId} .spell-option-btn`).forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.addEventListener('click', () => {
            const spellKey = btn.dataset.spell;
            const keyBind = btn.dataset.keyBind;
            if (!SUMMONER_SPELLS[spellKey]) return;
            if (keyBind === 'D') {
                slots[slotId].summonerD = spellKey;
                stopSpellTimer(slotId, 'D');
            } else {
                slots[slotId].summonerF = spellKey;
                stopSpellTimer(slotId, 'F');
            }
            updateSummonerCooldownsInSlot(slotId);
            const activeEl = document.activeElement;
            if (activeEl && typeof activeEl.blur === 'function') activeEl.blur();
        });
        btn.dataset.bound = 'true';
    });

    updateSummonerCooldownsInSlot(slotId);
}

function selectChampion(champId) {
    slots[activeSlot].id = champId;
    slots[activeSlot].data = champions[champId];
    loadChampionDetail(activeSlot);
}

function cleanDesc(text) {
    if (!text) return "";
    return text
        .replace(/<br\s*\/?>/gi, '\n')       
        .replace(/<[^>]+>/g, '')             
        .replace(/{{[^}]+}}/g, '[?]')        
        .replace(/@[^@]+@/g, '[?]')          
        .replace(/"/g, '&quot;') 
        .replace(/\s+/g, ' ').trim();        
}

function loadChampionDetail(slotId) {
    const slot = slots[slotId];
    if (!slot.data) return;
    
    const data = JSON.parse(JSON.stringify(slot.data));
    if (COOLDOWN_OVERRIDES[data.id]) {
        const overrides = COOLDOWN_OVERRIDES[data.id];
        Object.keys(overrides).forEach(idx => {
            if (data.spells[idx]) {
                if (Array.isArray(overrides[idx])) {
                    data.spells[idx].cooldown = overrides[idx];
                } else {
                    data.spells[idx].forms = overrides[idx];
                }
            }
        });
    }

    const holder = document.getElementById(`holder-${slotId}`);
    const img = document.getElementById(`img-champ-${slotId}`);
    const nameEl = document.getElementById(`name-champ-${slotId}`);
    const titleEl = document.getElementById(`title-champ-${slotId}`);

    if (holder) holder.style.display = 'none';
    if (img) {
        img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${data.image.full}`;
        img.style.display = 'block';
    }
    if (nameEl) nameEl.innerText = data.name;
    if (titleEl) titleEl.innerText = data.title;

    const skillsContainer = document.getElementById(`skills-${slotId}`);
    if (skillsContainer) {
        skillsContainer.innerHTML = "";
        skillsContainer.innerHTML += createSkillHTML(data.passive, "P", false, -1, slotId);
        data.spells.forEach((spell, idx) => {
            const key = ["Q", "W", "E", "R"][idx];
            skillsContainer.innerHTML += createSkillHTML(spell, key, true, idx, slotId);
        });
    }
    updateCooldownsInSlot(slotId);
}

function createSkillHTML(data, key, isSpell, index, slotId) {
    const imgUrl = isSpell 
        ? `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${data.image.full}`
        : `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${data.image.full}`;

    let cooldownUI = '';
    
    const champId = slots[slotId].id;
    const ammoCount = data.maxammo ? parseInt(data.maxammo) : 0;
    
    const isAmmo = ((!isNaN(ammoCount) && ammoCount > 1) || 
                    (index >= 0 && COOLDOWN_OVERRIDES[champId] && COOLDOWN_OVERRIDES[champId][index] && Array.isArray(COOLDOWN_OVERRIDES[champId][index]))) && 
                    !AMMO_EXCLUSIONS.includes(champId);
    
    const isPassive = (key === "P");
    const hasForms = data.forms ? true : false;
    const cooldownArray = Array.isArray(data.cooldown)
        ? data.cooldown.map(v => Number(v) || 0)
        : [];
    const hasCooldownValues = cooldownArray.length > 0;
    const hasRealCooldown = cooldownArray.some(v => v > 0);

    let isStatic = false;
    if (hasCooldownValues) {
        isStatic = cooldownArray.every(v => v === cooldownArray[0]);
    }

    if (hasForms || hasRealCooldown) {
        let timeLabel = '쿨타임';
        if (isAmmo) timeLabel = '1회 충전 시간';
        if (isPassive) timeLabel = '재사용 대기시간';

        let textClass = "";
        if (isAmmo) textClass = "ammo-text";
        if (isPassive) textClass = "passive-text";

        if (hasForms) {
            let formRows = "";
            Object.keys(data.forms).forEach(formName => {
                const cdArr = data.forms[formName];
                formRows += `
                    <div class="form-row">
                        <span class="form-name">${formName}</span>
                        <span class="cd-value form-cd ${textClass}" 
                                data-base-arr='${JSON.stringify(cdArr)}'
                                data-is-ammo="${isAmmo}" 
                                data-is-passive="${isPassive}">--</span>
                    </div>
                `;
            });
            cooldownUI = `
                <div class="cooldown-block">
                    <div class="cooldown-label">${timeLabel}</div>
                    ${formRows}
                </div>
            `;
        } else if (isStatic) {
            const tableTitle = `<div class="cooldown-label">${timeLabel}</div>`;
            cooldownUI = `
                ${tableTitle}
                <div class="cd-value ${textClass}" 
                        data-base-cd="${cooldownArray[0]}" 
                        data-is-ammo="${isAmmo}" 
                        data-is-passive="${isPassive}">--</div>
            `;
        } else {
            const tableTitle = `<div class="cooldown-label">${timeLabel}</div>`;
            cooldownUI = `
                ${tableTitle}
                <div class="cd-value ${textClass}" 
                        data-base-arr='${JSON.stringify(cooldownArray)}'
                        data-is-ammo="${isAmmo}" 
                        data-is-passive="${isPassive}">--</div>
            `;
        }

    } else {
        cooldownUI = '<div class="cooldown-label">쿨타임 없음</div>';
    }

    let tags = [];
    const textDesc = (data.description || "") + (data.tooltip || "");
    if (textDesc.includes('토글')) tags.push('<span class="tag toggle">토글</span>');
    if (isPassive) tags.push('<span class="tag passive">패시브</span>');
    if (isAmmo) tags.push(`<span class="tag ammo">충전형</span>`);
    if (isStatic && !hasForms && hasRealCooldown) tags.push('<span class="tag static">전 구간 동일</span>');
    if (hasForms) tags.push('<span class="tag form">폼 변환</span>');
    
    const desc = cleanDesc(textDesc);
    const safeName = data.name.replace(/"/g, '&quot;');

    return `
        <div class="skill-card mobile-card" onclick="toggleDesc(event, this)">
            <div class="skill-main-view">
                <div class="skill-icon-area">
                    <img src="${imgUrl}" class="skill-img" alt="${safeName} 아이콘">
                    <div class="skill-key-badge">${key}</div>
                </div>
                <div class="skill-info-area">
                    <div class="skill-header">
                        <span class="skill-name">${data.name}</span>
                        <div class="tags">${tags.join('')}</div>
                    </div>
                    ${cooldownUI}
                </div>
            </div>
            <div class="skill-desc-drawer" hidden>
                <hr class="skill-desc-divider">
                <p class="skill-desc-text">${desc}</p>
            </div>
            ${hasRealCooldown ? `<div style="display:none;" id="base-cd-${slotId}-${index}">${JSON.stringify(cooldownArray)}</div>` : ''}
        </div>`;
}

window.toggleDesc = function(evt, element) {
    if (evt && (evt.target.tagName === 'BUTTON' || evt.target.classList.contains('lvl-btn'))) return;
    const drawer = element.querySelector('.skill-desc-drawer');
    if (drawer) {
        const isHidden = drawer.hasAttribute('hidden');
        if (isHidden) {
            drawer.removeAttribute('hidden');
            element.classList.add('is-open');
        } else {
            drawer.setAttribute('hidden', '');
            element.classList.remove('is-open');
        }
    }
}

function clampHasteValue(raw) {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return HASTE_MIN;
    return Math.max(HASTE_MIN, Math.min(HASTE_MAX, parsed));
}

function syncHasteControlUI(slotId, type, value) {
    const input = document.getElementById(`input-${type}-${slotId}`);
    if (input) input.value = value;
}

function bindInputDragAdjust(input, getCurrentValue, applyValue) {
    let dragState = null;

    const clearDragState = () => {
        dragState = null;
        input.classList.remove('drag-adjusting');
        document.body.classList.remove('haste-dragging');
    };

    input.addEventListener('pointerdown', (e) => {
        if (typeof e.button === 'number' && e.button !== 0) return;
        dragState = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startValue: getCurrentValue(),
            moved: false
        };
        try {
            input.setPointerCapture(e.pointerId);
        } catch (_) {
            // no-op
        }
    });

    input.addEventListener('pointermove', (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        const dx = e.clientX - dragState.startX;
        const dy = dragState.startY - e.clientY;
        const movedDist = Math.abs(dx) + Math.abs(dy);
        if (movedDist >= HASTE_DRAG_THRESHOLD_PX) {
            dragState.moved = true;
        }
        if (!dragState.moved) return;

        const weightedDelta = dx + (dy * 0.4);
        const deltaValue = Math.round(weightedDelta / HASTE_DRAG_STEP_PX);
        const nextValue = clampHasteValue(dragState.startValue + deltaValue);
        applyValue(nextValue);
        input.classList.add('drag-adjusting');
        document.body.classList.add('haste-dragging');
        e.preventDefault();
    });

    const endDrag = (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        const moved = dragState.moved;
        clearDragState();
        if (moved) {
            e.preventDefault();
            input.blur();
        }
    };

    input.addEventListener('pointerup', endDrag);
    input.addEventListener('pointercancel', endDrag);
    input.addEventListener('lostpointercapture', clearDragState);
}

function updateCooldownsInSlot(slotId) {
    const slot = slots[slotId];
    syncHasteControlUI(slotId, 'haste', slot.haste);
    syncHasteControlUI(slotId, 'ult', slot.ultHaste);
    
    const baseCdr = 1 - (100 / (100 + slot.haste));
    const ultCdr = 1 - (100 / (100 + slot.haste + slot.ultHaste));
    
    const dispCdr = document.getElementById(`disp-cdr-${slotId}`);
    const dispUlt = document.getElementById(`disp-ult-cdr-${slotId}`);
    if(dispCdr) dispCdr.innerText = `${(baseCdr*100).toFixed(0)}%`;
    if(dispUlt) dispUlt.innerText = `R ${(ultCdr*100).toFixed(0)}%`;
    updateSummonerCooldownsInSlot(slotId);

    if (!slot.data) return;

    const skillsDiv = document.getElementById(`skills-${slotId}`);
    if(skillsDiv) {
        skillsDiv.querySelectorAll('.cd-value').forEach((el) => {
            const baseCd = parseFloat(el.dataset.baseCd);

            // 키 찾기
            const card = el.closest('.skill-card');
            const badge = card ? card.querySelector('.skill-key-badge') : null;
            const key = badge ? badge.innerText : "";

            let totalHaste = (key === "R") ? (slot.haste + slot.ultHaste) : slot.haste;
            if (el.dataset.isPassive === "true") totalHaste = 0;

            // 1. 배열 데이터 (나열형 or 폼)
            if (el.dataset.baseArr) {
                const arr = JSON.parse(el.dataset.baseArr);
                const results = arr.map(val => calculateCDR(val, totalHaste));
                
                const allSame = results.every(v => v === results[0]);
                el.innerText = allSame ? `${results[0]}초` : results.join(' / ') + "초";
            } 
            // 2. 단일 데이터 (고정 쿨타임)
            else if (!isNaN(baseCd)) {
                el.innerText = calculateCDR(baseCd, totalHaste) + "초";
            }
        });
    }
}

function calculateCDR(baseCd, haste) {
    if (!baseCd || baseCd === 0) return 0;
    const cooldown = baseCd * (100 / (100 + haste));
    return parseFloat(cooldown.toFixed(1));
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/"/g, "&quot;").replace(/<[^>]*>?/gm, '');
}

function addTooltipEvents() {}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            if(currentSearch) {
                currentConsonant = 'ALL';
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.filter-btn[data-key="전체"]');
                if (allBtn) allBtn.classList.add('active');
            }
            renderChampionList();
        });
    }

    window.addEventListener('resize', scheduleChampionGridSync);

    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', openSidebar);
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            if (e.target === sidebar) closeSidebar();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });

    // view-toggle-mobile listener 삭제

    [1, 2].forEach(id => {
        setupSummonerSpellControls(id);
        setupControl(id, 'haste');
        setupControl(id, 'ult');
        const resetBtn = document.getElementById(`btn-reset-${id}`);
        if(resetBtn) {
            resetBtn.addEventListener('click', () => {
                slots[id].haste = 0; 
                slots[id].ultHaste = 0;
                updateCooldownsInSlot(id);
            });
        }
    });
}

function setupControl(slotId, type) {
    const input = document.getElementById(`input-${type}-${slotId}`);
    if (!input) return;
    const key = type === 'haste' ? 'haste' : 'ultHaste';
    input.min = `${HASTE_MIN}`;
    input.max = `${HASTE_MAX}`;

    const applyInputValue = (raw) => {
        const val = clampHasteValue(raw);
        slots[slotId][key] = val;
        syncHasteControlUI(slotId, type, val);
        updateCooldownsInSlot(slotId);
    };

    input.addEventListener('input', (e) => applyInputValue(e.target.value));
    input.addEventListener('change', (e) => applyInputValue(e.target.value));
    bindInputDragAdjust(input, () => slots[slotId][key], applyInputValue);

    const parent = input.closest('.control-unit');
    if (parent) {
        parent.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.val);
                if (!isNaN(delta)) {
                    slots[slotId][key] = clampHasteValue(slots[slotId][key] + delta);
                    updateCooldownsInSlot(slotId);
                }
            });
        });
    }
}
