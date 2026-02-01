// mobile.js

let currentVersion = '14.1.1';
let champions = {};
let slots = {
    1: { id: null, haste: 0, ultHaste: 0, data: null },
    2: { id: null, haste: 0, ultHaste: 0, data: null } // 슬롯 2는 확장성 위해 남겨둠
};
let activeSlot = 1;
let isAllLevelView = true;

let currentSearch = "";
let currentConsonant = "ALL";
const HANGUL_INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const FILTER_KEYS = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// 쿨타임 오버라이드 데이터 (충전형 등)
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

async function init() {
    try {
        // 1. 버전 정보 가져오기
        const verRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await verRes.json();
        currentVersion = versions[0];
        
        const verDisplay = document.getElementById('version-display');
        if (verDisplay) {
            const parts = currentVersion.split('.');
            verDisplay.innerText = parts.length >= 2 ? `Patch ${parts[0]}.${parts[1]}` : `Patch ${currentVersion}`;
        }

        // 2. 챔피언 데이터 가져오기
        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/ko_KR/championFull.json`);
        const champData = await champRes.json();
        champions = champData.data;

        createFilterButtons();
        renderChampionList();
        setupEventListeners();
        
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
        const verDisplay = document.getElementById('version-display');
        if(verDisplay) verDisplay.innerText = "데이터 로딩 실패";
    }
}

function createFilterButtons() {
    const bar = document.getElementById('filter-bar');
    if(!bar) return;
    bar.innerHTML = "";
    FILTER_KEYS.forEach(key => {
        const btn = document.createElement('div');
        btn.className = `filter-btn ${key === '전체' ? 'active' : ''}`;
        btn.innerText = key;
        btn.dataset.key = key;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentConsonant = key === '전체' ? 'ALL' : key;
            const searchInput = document.getElementById('search-input');
            if(searchInput) searchInput.value = "";
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
        // 클릭 시 챔피언 선택
        item.onclick = () => {
            selectChampion(champ.id);
            // 사이드바 닫기
            document.getElementById('sidebar').classList.remove('open');
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

function loadChampionDetail(slotId) {
    const slot = slots[slotId];
    if (!slot.data) return;
    
    // 오버라이드 적용
    const data = JSON.parse(JSON.stringify(slot.data));
    if (COOLDOWN_OVERRIDES[data.id]) {
        const overrides = COOLDOWN_OVERRIDES[data.id];
        Object.keys(overrides).forEach(idx => {
            if (data.spells[idx]) data.spells[idx].cooldown = overrides[idx];
        });
    }

    // --- 수정된 부분: 에러 없이 헤더 정보 업데이트 ---
    const holder = document.getElementById(`holder-${slotId}`);
    const img = document.getElementById(`img-champ-${slotId}`);
    const nameEl = document.getElementById(`name-champ-${slotId}`);
    const titleEl = document.getElementById(`title-champ-${slotId}`);

    if (holder) holder.style.display = 'none'; // 물음표 숨김
    if (img) {
        img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${data.image.full}`;
        img.style.display = 'block'; // 이미지 보이기
    }
    if (nameEl) nameEl.innerText = data.name;
    if (titleEl) titleEl.innerText = data.title;
    // ------------------------------------------------

    // 스킬 목록 생성
    const skillsContainer = document.getElementById(`skills-${slotId}`);
    if (skillsContainer) {
        skillsContainer.innerHTML = "";
        skillsContainer.innerHTML += createSkillHTML(data.passive, "P", false, -1, slotId);
        data.spells.forEach((spell, idx) => {
            const key = ["Q", "W", "E", "R"][idx];
            skillsContainer.innerHTML += createSkillHTML(spell, key, true, idx, slotId);
        });
    }

    addTooltipEvents();
    updateCooldownsInSlot(slotId);
}

function createSkillHTML(data, key, isSpell, index, slotId) {
    const imgUrl = isSpell 
        ? `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${data.image.full}`
        : `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${data.image.full}`;

    let cooldownUI = '';
    
    // 쿨타임 데이터 처리
    const ammoCount = data.maxammo ? parseInt(data.maxammo) : 0;
    const isAmmo = (!isNaN(ammoCount) && ammoCount > 1) || (index >= 0 && COOLDOWN_OVERRIDES[slots[slotId].id] && COOLDOWN_OVERRIDES[slots[slotId].id][index]);
    const isPassive = (key === "P");

    let isStatic = false;
    if (data.cooldown && Array.isArray(data.cooldown) && data.cooldown.length > 0) {
        isStatic = data.cooldown.every(v => v === data.cooldown[0]);
    }

    if (data.cooldown) {
        let timeLabel = isAmmo ? '1회 충전' : '쿨타임';
        if (isPassive) timeLabel = '재사용 대기';
        let textClass = isAmmo ? "ammo-text" : (isPassive ? "passive-text" : "");

        if (isAllLevelView) {
            if (isStatic) {
                cooldownUI = `
                    <div style="font-size:12px; margin-bottom:4px; color:#666;">${timeLabel}</div>
                    <div class="cd-value ${textClass}" 
                         style="font-size:18px; font-weight:bold; color:#0ac8f6;" 
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
             // 개별 레벨 보기 모드 (간소화)
             cooldownUI = `<div style="color:#888;">한눈에 보기를 켜주세요.</div>`;
        }
    } else {
        cooldownUI = '<div style="color:#555; font-size:12px;">쿨타임 없음</div>';
    }

    let tags = [];
    if ((data.description + data.tooltip).includes('토글')) tags.push('<span class="tag toggle">토글</span>');
    if (isPassive) tags.push('<span class="tag passive">패시브</span>');
    if (isAmmo) tags.push(`<span class="tag ammo">충전형</span>`);
    if (isStatic && data.cooldown) tags.push('<span class="tag static">전 구간 동일</span>');

    return `
        <div class="skill-card" data-desc="${escapeHtml(data.description)}" data-name="${data.name}">
            <div class="skill-img-wrapper">
                <img src="${imgUrl}" class="skill-img">
                <div class="skill-key-badge">${key}</div>
            </div>
            <div class="skill-info">
                <div class="skill-header">
                    <span class="skill-name">${data.name}</span>
                    <div class="tags">${tags.join('')}</div>
                </div>
                ${cooldownUI}
                ${data.cooldown ? `<div style="display:none;" id="base-cd-${slotId}-${index}">${JSON.stringify(data.cooldown)}</div>` : ''}
            </div>
        </div>`;
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

    // 스킬 쿨타임 계산 업데이트
    const skillsDiv = document.getElementById(`skills-${slotId}`);
    if (skillsDiv) {
        skillsDiv.querySelectorAll('[id^="base-cd-"]').forEach(baseEl => {
            const parts = baseEl.id.split('-'); 
            const spellIdx = parseInt(parts[3]);
            const baseCooldowns = JSON.parse(baseEl.innerText);
            
            let totalHaste = (spellIdx === 3) ? (slot.haste + slot.ultHaste) : slot.haste;
            if (spellIdx === -1) totalHaste = 0; // 패시브 제외

            const card = baseEl.closest('.skill-card');
            if (card) {
                card.querySelectorAll('.cd-value').forEach((el, i) => {
                    const isPassive = el.dataset.isPassive === "true";
                    const appliedHaste = isPassive ? 0 : totalHaste;
                    const cdVal = baseCooldowns[i] !== undefined ? baseCooldowns[i] : baseCooldowns[0];
                    el.innerText = calculateCDR(cdVal, appliedHaste) + "초";
                });
            }
        });
    }
}

function calculateCDR(baseCd, haste) {
    if (baseCd === 0) return 0;
    const cooldown = baseCd * (100 / (100 + haste));
    return parseFloat(cooldown.toFixed(2));
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/"/g, "&quot;").replace(/<[^>]*>?/gm, '');
}

function addTooltipEvents() {
    // 모바일에서는 툴팁 생략하거나 터치 시 표시 로직 추가 가능
    // 현재는 단순 구현만 유지
}

function setupControl(slotId, type) {
    const inputId = `input-${type}-${slotId}`;
    const input = document.getElementById(inputId);
    if (!input) return;

    const key = type === 'haste' ? 'haste' : 'ultHaste';
    
    input.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        slots[slotId][key] = val;
        updateCooldownsInSlot(slotId);
    });

    // +/- 버튼
    const parent = input.closest('.control-unit');
    if (parent) {
        parent.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.val);
                slots[slotId][key] = Math.max(0, slots[slotId][key] + delta);
                updateCooldownsInSlot(slotId);
            });
        });
    }
}

function setupEventListeners() {
    // 1. 사이드바 검색창
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderChampionList();
        });
    }

    // 2. 사이드바 열기/닫기
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('sidebar');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // 3. 한눈에 보기 토글
    const viewToggle = document.getElementById('view-toggle-mobile');
    if (viewToggle) {
        viewToggle.addEventListener('change', (e) => {
            isAllLevelView = e.target.checked;
            loadChampionDetail(1);
        });
    }

    // 4. 초기화 버튼
    const resetBtn = document.getElementById('btn-reset-1');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            slots[1].haste = 0;
            slots[1].ultHaste = 0;
            updateCooldownsInSlot(1);
        });
    }

    // 5. 컨트롤 설정
    setupControl(1, 'haste');
    setupControl(1, 'ult');
}

// 시작
init();