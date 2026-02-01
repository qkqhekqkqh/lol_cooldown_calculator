let currentVersion = '14.1.1'; 
let champions = {};
let slots = {
    1: { id: null, haste: 0, ultHaste: 0, data: null },
    2: { id: null, haste: 0, ultHaste: 0, data: null }
};
let activeSlot = 1;
let isAllLevelView = true; 

let currentSearch = "";
let currentConsonant = "ALL";
const HANGUL_INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const FILTER_KEYS = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

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
        const verRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await verRes.json();
        currentVersion = versions[0];
        
        const parts = currentVersion.split('.');
        if (parts.length >= 2) {
            const major = parseInt(parts[0]) + 10;
            const minor = parts[1];
            document.getElementById('version-display').innerText = `Patch ${major}.${minor}`;
        } else {
            document.getElementById('version-display').innerText = `Patch ${currentVersion}`;
        }

        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/ko_KR/championFull.json`);
        const champData = await champRes.json();
        champions = champData.data;

        createFilterButtons(); 
        renderChampionList();  
        setupEventListeners(); 
        
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
        alert("챔피언 데이터를 불러오는데 실패했습니다.");
    }
}

function createFilterButtons() {
    const bar = document.getElementById('filter-bar');
    bar.innerHTML = "";
    FILTER_KEYS.forEach(key => {
        const btn = document.createElement('div');
        btn.className = `filter-btn ${key === '전체' ? 'active all-btn' : ''}`;
        btn.innerText = key;
        btn.dataset.key = key;
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
}

function loadChampionDetail(slotId) {
    const slot = slots[slotId];
    if (!slot.data) return;
    const container = document.getElementById(`slot-${slotId}`);
    
    const data = JSON.parse(JSON.stringify(slot.data));

    if (COOLDOWN_OVERRIDES[data.id]) {
        const overrides = COOLDOWN_OVERRIDES[data.id];
        Object.keys(overrides).forEach(idx => {
            if (data.spells[idx]) {
                data.spells[idx].cooldown = overrides[idx];
            }
        });
    }

    container.querySelector('.empty-state').style.display = 'none';
    const header = container.querySelector('.slot-header');
    header.style.display = 'flex';
    header.innerHTML = `
        <img src="https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${data.image.full}">
        <div><h1>${data.name}</h1><p>${data.title}</p></div>
    `;

    const skillsContainer = document.getElementById(`skills-${slotId}`);
    skillsContainer.innerHTML = "";
    skillsContainer.className = ""; 

    skillsContainer.innerHTML += createSkillHTML(data.passive, "P", false, -1, slotId);
    data.spells.forEach((spell, idx) => {
        const key = ["Q", "W", "E", "R"][idx];
        skillsContainer.innerHTML += createSkillHTML(spell, key, true, idx, slotId);
    });

    addTooltipEvents();
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

    // ★ 안전한 변수 선언: 모바일 오류 방지용
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
            // ★ 수정됨: 텍스트 제거, 숫자 색상만 적용
            if (isStatic) {
                const tableTitle = `<div style="font-size:12px; margin-bottom:4px; color:#666;">${timeLabel}</div>`;
                cooldownUI = `
                    ${tableTitle}
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
                
                const tableTitle = (isAmmo || isPassive) ? `<div style="font-size:12px; margin-bottom:4px;" class="${textClass}">* ${timeLabel}</div>` : '';

                cooldownUI = `
                    ${tableTitle}
                    <table class="all-levels-table">
                        <thead><tr>${headers}</tr></thead>
                        <tbody><tr>${rows}</tr></tbody>
                    </table>`;
            }
        } else {
            let buttons = isStatic 
                ? '<span style="color:#555; font-size:13px;">전 구간 동일</span>'
                : data.cooldown.map((_, i) => 
                    `<button class="lvl-btn ${i===0?'active':''}" onclick="changeLevel(this, ${slotId}, ${index}, ${i})">${i+1}</button>`
                  ).join('');
            
            cooldownUI = `
                <div class="level-selector" data-current-level="0" data-spell-index="${index}">${buttons}</div>
                <div style="font-size:13px; color:#666; margin-top:4px;">${timeLabel}</div>
                <div class="main-cooldown ${textClass}" id="display-cd-${slotId}-${index}" 
                     data-is-ammo="${isAmmo}" data-is-passive="${isPassive}">--</div>
            `;
        }
    } else {
        cooldownUI = '<div style="color:#555; font-size:13px; margin-top:8px;">쿨타임 없음</div>';
    }

    let tags = [];
    const text = (data.description || "") + (data.tooltip || "");
    if (text.includes('토글') || text.includes('toggle')) tags.push('<span class="tag toggle">토글</span>');
    if (isPassive) tags.push('<span class="tag passive">패시브</span>');
    if (isAmmo) tags.push(`<span class="tag ammo">충전형</span>`);
    
    // ★ 뱃지 추가 (CSS 필요)
    if (isStatic) {
        tags.push('<span class="tag static">전 구간 동일</span>');
    }

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
    
    document.getElementById(`input-haste-${slotId}`).value = slot.haste;
    document.getElementById(`input-ult-${slotId}`).value = slot.ultHaste;
    
    const baseCdr = 1 - (100 / (100 + slot.haste));
    const ultCdr = 1 - (100 / (100 + slot.haste + slot.ultHaste));
    
    document.getElementById(`disp-cdr-${slotId}`).innerText = `${(baseCdr*100).toFixed(0)}%`;
    document.getElementById(`disp-ult-cdr-${slotId}`).innerText = `R ${(ultCdr*100).toFixed(0)}%`;

    if (!slot.data) return;

    const skillsDiv = document.getElementById(`skills-${slotId}`);
    skillsDiv.querySelectorAll('[id^="base-cd-"]').forEach(baseEl => {
        const parts = baseEl.id.split('-'); 
        const spellIdx = parseInt(parts[3]);

        const baseCooldowns = JSON.parse(baseEl.innerText);
        let totalHaste = (spellIdx === 3) ? (slot.haste + slot.ultHaste) : slot.haste;
        if (spellIdx === -1) totalHaste = 0;

        if (isAllLevelView) {
            const card = baseEl.closest('.skill-card');
            card.querySelectorAll('.cd-value').forEach((el, i) => {
                const isPassive = el.dataset.isPassive === "true";
                const appliedHaste = isPassive ? 0 : totalHaste;
                // 안전하게 접근
                const cdVal = baseCooldowns[i] !== undefined ? baseCooldowns[i] : baseCooldowns[0];
                el.innerText = calculateCDR(cdVal, appliedHaste) + "초";
            });
        } else {
            const display = document.getElementById(`display-cd-${slotId}-${spellIdx}`);
            if (display) {
                const wrapper = display.parentElement;
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

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/"/g, "&quot;").replace(/<[^>]*>?/gm, '');
}

function addTooltipEvents() {
    const tooltip = document.getElementById('tooltip');
    if(!tooltip) return; 
    
    document.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('mouseenter', e => {
            const name = card.dataset.name;
            const desc = card.dataset.desc;
            tooltip.innerHTML = `<strong>${name}</strong><br><br>${desc}`;
            tooltip.classList.remove('hidden');
        });
        card.addEventListener('mousemove', e => {
            tooltip.style.left = e.pageX + 20 + 'px';
            tooltip.style.top = e.pageY + 20 + 'px';
        });
        card.addEventListener('mouseleave', () => {
            tooltip.classList.add('hidden');
        });
    });
}

function setupEventListeners() {
    // 1. 검색창 (있을 때만 동작)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            if(currentSearch) {
                currentConsonant = 'ALL';
                // 필터 버튼 초기화
                const btns = document.querySelectorAll('.filter-btn');
                if (btns.length > 0) {
                    btns.forEach(b => b.classList.remove('active'));
                    const allBtn = document.querySelector('.filter-btn[data-key="전체"]');
                    if (allBtn) allBtn.classList.add('active');
                }
            }
            renderChampionList();
        });
    }

    // 2. 챔피언 슬롯 클릭 (있을 때만 동작)
    const slots = document.querySelectorAll('.champion-slot');
    if (slots.length > 0) {
        slots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                if(e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
                activeSlot = parseInt(slot.id.split('-')[1]);
                document.querySelectorAll('.champion-slot').forEach(el => el.classList.remove('active'));
                slot.classList.add('active');
            });
        });
    }

    // 3. 모드 토글 (단일/비교 모드) - 모바일에 없으면 무시
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('change', (e) => {
            const container = document.querySelector('.detail-container');
            const labels = document.querySelectorAll('.mode-switch-wrapper .mode-label');
            const slot2 = document.getElementById('slot-2');
            
            if (e.target.checked) {
                if(container) container.classList.remove('single-mode');
                if(labels.length > 1) { labels[0].classList.remove('active-text'); labels[1].classList.add('active-text'); }
                if(slot2) slot2.style.display = 'flex'; 
            } else {
                if(container) container.classList.add('single-mode');
                if(labels.length > 1) { labels[0].classList.add('active-text'); labels[1].classList.remove('active-text'); }
                if(slot2) slot2.style.display = 'none';
                
                activeSlot = 1;
                const slot1 = document.getElementById('slot-1');
                if(slot1) slot1.classList.add('active');
            }
        });
    }

    // 4. 레벨 보기 토글 (전체 레벨/현재 레벨) - 없으면 무시
    const viewToggle = document.getElementById('view-toggle');
    if (viewToggle) {
        viewToggle.addEventListener('change', (e) => {
            isAllLevelView = e.target.checked;
            const labels = document.querySelectorAll('.view-toggle-wrapper .mode-label');
            if (labels.length > 1) {
                if(isAllLevelView) {
                    labels[0].classList.remove('active-text'); labels[1].classList.add('active-text');
                } else {
                    labels[0].classList.add('active-text'); labels[1].classList.remove('active-text');
                }
            }
            loadChampionDetail(1);
            loadChampionDetail(2);
        });
    }

    // 5. 초기화(Reset) 버튼들
    [1, 2].forEach(id => {
        setupControl(id, 'haste');
        setupControl(id, 'ult');
        
        const resetBtn = document.getElementById(`btn-reset-${id}`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (slots[id]) { // 전역 변수 slots 체크
                    slots[id].haste = 0; 
                    slots[id].ultHaste = 0;
                    updateCooldownsInSlot(id);
                }
            });
        }
    });

    // 6. 모바일 사이드바 (검색창) 열기/닫기
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');

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

    // 챔피언 클릭 시 사이드바 닫기 (champion-grid 내부 클릭 감지)
    const grid = document.getElementById('champion-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            // champ-item이나 그 내부 이미지를 클릭했을 때만 닫기
            if (e.target.closest('.champ-item')) {
                sidebar.classList.remove('open');
            }
        });
    }
}

function setupControl(slotId, type) {
    const inputId = `input-${type}-${slotId}`;
    const input = document.getElementById(inputId);
    
    // 입력창(input)이 HTML에 없으면 함수 종료 (에러 방지)
    if (!input) return;

    const key = type === 'haste' ? 'haste' : 'ultHaste';
    
    input.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        if (slots[slotId]) {
            slots[slotId][key] = val;
            updateCooldownsInSlot(slotId);
        }
    });

    // +/- 버튼 연결
    const parent = input.closest('.control-unit');
    if (parent) {
        parent.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.val);
                if (slots[slotId]) {
                    slots[slotId][key] = Math.max(0, slots[slotId][key] + delta);
                    updateCooldownsInSlot(slotId);
                }
            });
        });
    }
}

init();