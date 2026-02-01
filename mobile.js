let currentVersion = '14.1.1'; 
let champions = {};
let slots = {
    1: { id: null, haste: 0, ultHaste: 0, data: null },
    2: { id: null, haste: 0, ultHaste: 0, data: null }
};
let activeSlot = 1;
let isAllLevelView = true; 

// 필터 설정
let currentSearch = "";
let currentConsonant = "ALL";
const HANGUL_INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const FILTER_KEYS = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// 예외 처리 데이터
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
    "Xerath": { 3: [130, 115, 100] }             
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
    if (sidebar) sidebar.classList.add('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');
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
        
        const item = document.createElement('div');
        item.className = 'champ-item';
        item.onclick = () => {
            selectChampion(champ.id);
            closeSidebar();
        };
        
        const img = document.createElement('img');
        img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champ.image.full}`;
        img.loading = "lazy";
        
        const name = document.createElement('span');
        name.innerText = champ.name;
        
        item.appendChild(img);
        item.appendChild(name);
        grid.appendChild(item);
    });
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
        .replace(/\s+/g, ' ').trim();        
}

function loadChampionDetail(slotId) {
    const slot = slots[slotId];
    if (!slot.data) return;
    
    const data = JSON.parse(JSON.stringify(slot.data));
    if (COOLDOWN_OVERRIDES[data.id]) {
        const overrides = COOLDOWN_OVERRIDES[data.id];
        Object.keys(overrides).forEach(idx => {
            if (data.spells[idx]) data.spells[idx].cooldown = overrides[idx];
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

    // [수정] 스킬 컨테이너 ID를 spells-{slotId}로 변경
    const skillsContainer = document.getElementById(`spells-${slotId}`);
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
    
    const ammoCount = data.maxammo ? parseInt(data.maxammo) : 0;
    const isAmmo = (!isNaN(ammoCount) && ammoCount > 1) || (index >= 0 && COOLDOWN_OVERRIDES[slots[slotId].id] && COOLDOWN_OVERRIDES[slots[slotId].id][index]);
    const isPassive = (key === "P");

    let isStatic = false;
    if (data.cooldown && Array.isArray(data.cooldown) && data.cooldown.length > 0) {
        isStatic = data.cooldown.every(v => v === data.cooldown[0]);
    }

    if (data.cooldown) {
        let timeLabel = '쿨타임';
        if (isAmmo) timeLabel = '1회 충전 시간';
        if (isPassive) timeLabel = '재사용 대기시간';

        let textClass = "";
        if (isAmmo) textClass = "ammo-text";
        if (isPassive) textClass = "passive-text";

        if (isAllLevelView) {
            if (isStatic) {
                const tableTitle = `<div style="font-size:12px; margin-bottom:4px; color:#666;">${timeLabel}</div>`;
                cooldownUI = `
                    ${tableTitle}
                    <div class="cd-value ${textClass}" 
                         style="font-size:20px; font-weight:bold; color:#0ac8f6;" 
                         data-base-cd="${data.cooldown[0]}" 
                         data-is-ammo="${isAmmo}" 
                         data-is-passive="${isPassive}">--</div>
                `;
            } else {
                let headers = data.cooldown.map((_, i) => `<th>Lv${i+1}</th>`).join('');
                let rows = data.cooldown.map(cd => 
                    `<td class="cd-value ${textClass}" data-base-cd="${cd}" data-is-ammo="${isAmmo}" data-is-passive="${isPassive}">--</td>`
                ).join('');
                cooldownUI = `
                    <div style="font-size:12px; margin-bottom:4px; color:#666;">${timeLabel}</div>
                    <table class="all-levels-table">
                        <thead><tr>${headers}</tr></thead>
                        <tbody><tr>${rows}</tr></tbody>
                    </table>`;
            }
        } else {
            let buttons = isStatic 
                ? '<span style="color:#666; font-size:13px;">전 구간 동일</span>'
                : data.cooldown.map((_, i) => 
                    `<button class="lvl-btn ${i===0?'active':''}" onclick="changeLevel(this, ${slotId}, ${index}, ${i})">${i+1}</button>`
                  ).join('');
            
            cooldownUI = `
                <div class="cd-row">
                    <div class="level-selector" data-current-level="0" data-spell-index="${index}">${buttons}</div>
                    <div class="result-box">
                        <span style="font-size:11px; color:#888; margin-right:5px;">${timeLabel}</span>
                        <span class="main-cooldown ${textClass}" id="display-cd-${slotId}-${index}" 
                              data-is-ammo="${isAmmo}" data-is-passive="${isPassive}">--</span>
                </div>
            </div>`;
        }
    } else {
        cooldownUI = '<div style="color:#555; font-size:12px; margin-top:5px;">쿨타임 없음</div>';
    }

    let tags = [];
    const textDesc = (data.description || "") + (data.tooltip || "");
    if (textDesc.includes('토글')) tags.push('<span class="tag toggle">토글</span>');
    if (isPassive) tags.push('<span class="tag passive">패시브</span>');
    if (isAmmo) tags.push(`<span class="tag ammo">충전형</span>`);
    if (isStatic && data.cooldown) tags.push('<span class="tag static">전 구간 동일</span>');
    
    const desc = cleanDesc(textDesc);

    return `
        <div class="skill-card mobile-card" onclick="toggleDesc(this)">
            <div class="skill-main-view">
                <div class="skill-icon-area" style="position:relative; width:40px; height:40px; flex-shrink:0;">
                    <img src="${imgUrl}" class="skill-img" style="width:100%; height:100%; border-radius:6px; border:1px solid #444;">
                    <div class="skill-key-badge" style="position:absolute; bottom:-6px; right:-6px; background:#000; color:#c89b3c; border:1px solid #c89b3c; width:16px; height:16px; font-size:9px; font-weight:bold; display:flex; align-items:center; justify-content:center; border-radius:50%; z-index:10;">${key}</div>
                </div>
                <div class="skill-info-area">
                    <div class="skill-header">
                        <span class="skill-name">${data.name}</span>
                        <div class="tags">${tags.join('')}</div>
                    </div>
                    ${cooldownUI}
                </div>
            </div>
            <div class="skill-desc-drawer" style="display:none;">
                <hr style="border:0; border-top:1px solid #333; margin:8px 0;">
                <p style="font-size:13px; color:#aaa; line-height:1.4;">${desc}</p>
            </div>
            ${data.cooldown ? `<div style="display:none;" id="base-cd-${slotId}-${index}">${JSON.stringify(data.cooldown)}</div>` : ''}
        </div>`;
}

window.toggleDesc = function(element) {
    if (event.target.tagName === 'BUTTON' || event.target.classList.contains('lvl-btn')) return;
    const drawer = element.querySelector('.skill-desc-drawer');
    if (drawer) {
        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        element.style.backgroundColor = isHidden ? '#2a2e3f' : '#222635';
    }
}

function updateCooldownsInSlot(slotId) {
    const slot = slots[slotId];
    
    const hInput = document.getElementById(`input-haste-${slotId}`);
    const uInput = document.getElementById(`input-ult-${slotId}`);
    if(hInput) hInput.value = slot.haste;
    if(uInput) uInput.value = slot.ultHaste;
    
    const baseCdr = 1 - (100 / (100 + slot.haste));
    const ultCdr = 1 - (100 / (100 + slot.haste + slot.ultHaste));
    
    const dispCdr = document.getElementById(`disp-cdr-${slotId}`);
    const dispUlt = document.getElementById(`disp-ult-cdr-${slotId}`);
    if(dispCdr) dispCdr.innerText = `${(baseCdr*100).toFixed(0)}%`;
    if(dispUlt) dispUlt.innerText = `R ${(ultCdr*100).toFixed(0)}%`;

    if (!slot.data) return;

    // [수정] 스킬 컨테이너 ID를 spells-{slotId}로 변경
    const skillsDiv = document.getElementById(`spells-${slotId}`);
    if(skillsDiv) {
        skillsDiv.querySelectorAll('.cd-value').forEach((el) => {
            const baseCd = parseFloat(el.dataset.baseCd);
            if (isNaN(baseCd)) return;

            const card = el.closest('.skill-card');
            const badge = card.querySelector('.skill-key-badge');
            const key = badge ? badge.innerText : "";

            let totalHaste = (key === "R") ? (slot.haste + slot.ultHaste) : slot.haste;
            if (el.dataset.isPassive === "true") totalHaste = 0;

            el.innerText = calculateCDR(baseCd, totalHaste) + "초";
        });
        
        if (!isAllLevelView) {
            skillsDiv.querySelectorAll('.main-cooldown').forEach((display) => {
                const parts = display.id.split('-');
                const index = parts[3];
                const baseDataEl = document.getElementById(`base-cd-${slotId}-${index}`);
                
                if (baseDataEl) {
                    const baseCooldowns = JSON.parse(baseDataEl.innerText);
                    const wrapper = display.closest('.cd-row');
                    const selector = wrapper ? wrapper.querySelector('.level-selector') : null;
                    const lvl = selector ? parseInt(selector.dataset.currentLevel || 0) : 0;
                    const safeIdx = Math.min(lvl, baseCooldowns.length - 1);
                    
                    const card = display.closest('.skill-card');
                    const badge = card.querySelector('.skill-key-badge');
                    const key = badge ? badge.innerText : "";

                    let totalHaste = (key === "R") ? (slot.haste + slot.ultHaste) : slot.haste;
                    if (display.dataset.isPassive === "true") totalHaste = 0;
                    
                    display.innerText = calculateCDR(baseCooldowns[safeIdx], totalHaste) + "초";
                }
            });
        }
    }
}

window.changeLevel = function(btn, slotId, spellIdx, lvlIdx) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    parent.dataset.currentLevel = lvlIdx;
    updateCooldownsInSlot(slotId);
}

function calculateCDR(baseCd, haste) {
    if (baseCd === 0) return 0;
    const cooldown = baseCd * (100 / (100 + haste));
    return parseFloat(cooldown.toFixed(2));
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            if(currentSearch) {
                currentConsonant = 'ALL';
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.filter-btn[data-key="전체"]').classList.add('active');
            }
            renderChampionList();
        });
    }

    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', openSidebar);
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    const viewToggle = document.getElementById('view-toggle-mobile');
    if (viewToggle) {
        viewToggle.addEventListener('change', (e) => {
            isAllLevelView = e.target.checked;
            loadChampionDetail(activeSlot);
        });
    }

    [1, 2].forEach(id => {
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
    input.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        slots[slotId][key] = val;
        updateCooldownsInSlot(slotId);
    });
    const parent = input.closest('.control-unit');
    if (parent) {
        parent.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.val);
                if (!isNaN(delta)) {
                    slots[slotId][key] = Math.max(0, slots[slotId][key] + delta);
                    updateCooldownsInSlot(slotId);
                }
            });
        });
    }
}

init();