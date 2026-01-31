let currentVersion = '14.1.1'; 
let champions = {};
let slots = {
    1: { id: null, haste: 0, ultHaste: 0, data: null }
};
let activeSlot = 1;

// ★ [수정] 기본값 true (한눈에 보기 활성화)
let isAllLevelView = true; 

// 필터 설정
let currentSearch = "";
let currentConsonant = "ALL";
const HANGUL_INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const FILTER_KEYS = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

async function init() {
    try {
        const verRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await verRes.json();
        currentVersion = versions[0]; // 예: "14.23.1"
        
        // ★ [수정] 버전 표기 로직 변경 (Major + 10)
        const parts = currentVersion.split('.');
        if (parts.length >= 2) {
            const major = parseInt(parts[0]);
            const minor = parts[1];
            
            // 14 -> 24, 16 -> 26 로직 적용
            const seasonVersion = major + 10;
            
            // "Patch 24.23" 형태로 표시
            document.getElementById('header-version').innerText = `Patch ${seasonVersion}.${minor}`; 
        } else {
            document.getElementById('header-version').innerText = `Patch ${currentVersion}`;
        }

        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/ko_KR/championFull.json`);
        const champData = await champRes.json();
        champions = champData.data;

        createFilterButtons(); 
        renderChampionList();  
        setupEventListeners(); 
        
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
        alert("데이터를 불러오는데 실패했습니다.");
    }
}

function openSidebar() { document.getElementById('sidebar').classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); }

function createFilterButtons() {
    const bar = document.getElementById('filter-bar');
    bar.innerHTML = "";
    FILTER_KEYS.forEach(key => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${key === '전체' ? 'active all-btn' : ''}`;
        btn.innerText = key;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentConsonant = key === '전체' ? 'ALL' : key;
            document.getElementById('search-input').value = ""; 
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
    const initial = HANGUL_INITIALS[initialIndex];
    if (initial === 'ㄲ') return 'ㄱ';
    if (initial === 'ㄸ') return 'ㄷ';
    if (initial === 'ㅃ') return 'ㅂ';
    if (initial === 'ㅆ') return 'ㅅ';
    if (initial === 'ㅉ') return 'ㅈ';
    return initial;
}

function renderChampionList() {
    const grid = document.getElementById('champion-grid');
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
        item.onclick = () => selectChampion(champ.id);
        
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
    closeSidebar();
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
    
    const data = slot.data;
    const imgEl = document.getElementById(`img-champ-${slotId}`);
    const holderEl = document.getElementById(`holder-${slotId}`);
    const nameEl = document.getElementById(`name-champ-${slotId}`);

    if(imgEl) {
        imgEl.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${data.image.full}`;
        imgEl.style.display = 'block';
    }
    if(holderEl) holderEl.style.display = 'none';
    if(nameEl) nameEl.innerText = data.name;

    const skillsContainer = document.getElementById(`spells-${slotId}`);
    skillsContainer.innerHTML = "";

    skillsContainer.innerHTML += createSkillHTML(data.passive, "P", false, -1, slotId);
    data.spells.forEach((spell, idx) => {
        const key = ["Q", "W", "E", "R"][idx];
        skillsContainer.innerHTML += createSkillHTML(spell, key, true, idx, slotId);
    });

    updateCooldownsInSlot(slotId);
}

function createSkillHTML(data, key, isSpell, index, slotId) {
    const imgUrl = isSpell 
        ? `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${data.image.full}`
        : `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${data.image.full}`;

    let cooldownUI = '';
    const ammoCount = data.maxammo ? parseInt(data.maxammo) : 0;
    const isAmmo = !isNaN(ammoCount) && ammoCount > 1;
    const isPassive = (key === "P");

    if (data.cooldown) {
        const isStatic = data.cooldown.every(v => v === data.cooldown[0]);
        let timeLabel = '쿨타임';
        if (isAmmo) timeLabel = '1회 충전';
        if (isPassive) timeLabel = '재사용 대기';
        
        let textClass = "";
        if (isAmmo) textClass = "ammo-text";
        if (isPassive) textClass = "passive-text";

        if (isAllLevelView) {
            let headers = data.cooldown.map((_, i) => `<th>Lv${i+1}</th>`).join('');
            let rows = data.cooldown.map(cd => 
                `<td class="cd-value ${textClass}" data-base-cd="${cd}" data-is-ammo="${isAmmo}" data-is-passive="${isPassive}">--</td>`
            ).join('');
            
            cooldownUI = `
                <div style="margin-top:5px;">
                    <table class="all-levels-table">
                        <thead><tr>${headers}</tr></thead>
                        <tbody><tr>${rows}</tr></tbody>
                    </table>
                </div>`;
        } else {
            let buttons = isStatic 
                ? '<span style="color:#666; font-size:12px;">전 구간 동일</span>'
                : data.cooldown.map((_, i) => 
                    `<button class="lvl-btn ${i===0?'active':''}" onclick="changeLevel(this, ${slotId}, ${index}, ${i})">${i+1}</button>`
                  ).join('');
            
            cooldownUI = `
                <div class="cd-row">
                    <div class="level-selector" data-current-level="0" data-spell-index="${index}">
                        ${buttons}
                    </div>
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

    const rawDesc = (data.description || "") + " " + (data.tooltip || "");
    const desc = cleanDesc(rawDesc);
    
    return `
        <div class="skill-card mobile-card" onclick="toggleDesc(this)">
            <div class="skill-main-view">
                <div class="skill-icon-area">
                    <img src="${imgUrl}" class="skill-img">
                    <div class="skill-key-badge">${key}</div>
                </div>
                <div class="skill-info-area">
                    <div class="skill-header">
                        <span class="skill-name">${data.name}</span>
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
    
    document.getElementById(`input-haste-${slotId}`).value = slot.haste;
    document.getElementById(`input-ult-${slotId}`).value = slot.ultHaste;
    
    const baseCdr = 1 - (100 / (100 + slot.haste));
    const ultCdr = 1 - (100 / (100 + slot.haste + slot.ultHaste));
    
    document.getElementById(`disp-cdr-${slotId}`).innerText = `${(baseCdr*100).toFixed(0)}%`;
    document.getElementById(`disp-ult-cdr-${slotId}`).innerText = `R ${(ultCdr*100).toFixed(0)}%`;

    if (!slot.data) return;

    const skillsDiv = document.getElementById(`spells-${slotId}`);
    if (!skillsDiv) return;

    skillsDiv.querySelectorAll('[id^="base-cd-"]').forEach(baseEl => {
        const parts = baseEl.id.split('-'); 
        const spellIdx = parseInt(parts[3]);

        const baseCooldowns = JSON.parse(baseEl.innerText);
        let totalHaste = (spellIdx === 3) ? (slot.haste + slot.ultHaste) : slot.haste;
        if (spellIdx === -1) totalHaste = 0; 

        if (isAllLevelView) {
            const card = baseEl.closest('.skill-card');
            card.querySelectorAll('.cd-value').forEach((td, i) => {
                const isPassive = td.dataset.isPassive === "true";
                const appliedHaste = isPassive ? 0 : totalHaste;
                td.innerText = calculateCDR(baseCooldowns[i], appliedHaste) + "s";
            });
        } else {
            const display = document.getElementById(`display-cd-${slotId}-${spellIdx}`);
            if (display) {
                const wrapper = display.closest('.cd-row');
                const selector = wrapper.querySelector('.level-selector');
                const lvl = parseInt(selector.dataset.currentLevel || 0);
                const safeIdx = Math.min(lvl, baseCooldowns.length - 1);
                
                const isAmmo = display.dataset.isAmmo === "true";
                const isPassive = display.dataset.isPassive === "true";
                let suffix = "초";
                if (isAmmo) suffix = "초 (충전)";
                if (isPassive) suffix = "초 (고정)";
                const appliedHaste = isPassive ? 0 : totalHaste;
                display.innerText = calculateCDR(baseCooldowns[safeIdx], appliedHaste) + suffix;
            }
        }
    });
}

window.changeLevel = function(btn, slotId, spellIdx, lvlIdx) {
    event.stopPropagation(); 
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
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        if(currentSearch) {
            currentConsonant = 'ALL';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.all-btn').classList.add('active');
        }
        renderChampionList();
    });

    document.getElementById('mobile-menu-btn').addEventListener('click', openSidebar);
    document.getElementById('sidebar-close-btn').addEventListener('click', closeSidebar);

    const viewToggle = document.getElementById('view-toggle-mobile');
    if (viewToggle) {
        viewToggle.addEventListener('change', (e) => {
            isAllLevelView = e.target.checked;
            loadChampionDetail(activeSlot);
        });
    }

    [1].forEach(id => {
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