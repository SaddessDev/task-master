/**
 * Application principale Hero OS
 */

// Configuration
const CONFIG = {
    THEMES: ['#06b6d4', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ef4444'],
    ICON_POOL: [
        'fa-tag', 'fa-heart', 'fa-briefcase', 'fa-dumbbell', 'fa-code', 'fa-book',
        'fa-gamepad', 'fa-utensils', 'fa-brain', 'fa-bolt', 'fa-music', 'fa-gem',
        'fa-rocket', 'fa-star', 'fa-fire', 'fa-trophy', 'fa-medal', 'fa-flag',
        'fa-bullseye', 'fa-chart-line', 'fa-laptop-code', 'fa-palette', 'fa-camera',
        'fa-plane', 'fa-bicycle', 'fa-coffee', 'fa-pizza-slice', 'fa-shopping-cart',
        'fa-home', 'fa-car', 'fa-tree', 'fa-sun', 'fa-moon', 'fa-cloud',
        'fa-umbrella', 'fa-gift', 'fa-bell', 'fa-envelope', 'fa-phone', 'fa-clock'
    ],
    STAGES: [
        { min: 0, n: "Novice", r: "Rang I", i: "fa-seedling", desc: "Le début de votre voyage" },
        { min: 100, n: "Apprenti", r: "Rang II", i: "fa-book-open", desc: "Vous apprenez les bases" },
        { min: 500, n: "Adepte", r: "Rang III", i: "fa-fire", desc: "Votre discipline s'affine" },
        { min: 1500, n: "Expert", r: "Rang IV", i: "fa-star", desc: "Maîtrise reconnue" },
        { min: 3000, n: "Maître", r: "Rang V", i: "fa-crown", desc: "Excellence incarnée" },
        { min: 5000, n: "Légende", r: "Rang VI", i: "fa-trophy", desc: "Au sommet de la gloire" }
    ],
    CREDIT: {
        type: 'image', // 'image' ou 'icon'
        icon: 'fa-coins', // Utilisé si type = 'icon'
        image: 'assets/credits/coin.png' // Utilisé si type = 'image'
    }
};

// État global
let state = DB.getDefaultState();
let lastRank = "";
let selectedIcon = 'fa-tag';
let selectedColor = '#06b6d4';
let editingCategory = null;
let activeConfigTab = 'categories'; // 'categories' ou 'dailies'
let selectedCategoryForQuest = null; // Catégorie sélectionnée pour nouvelle quête
let selectedCategoryForDaily = null; // Catégorie sélectionnée pour nouveau daily

// ===== UTILITAIRES =====

// Fonction de sécurité: échapper les caractères HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Valider une couleur hex
function isValidHexColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
}

// Valider une icône FontAwesome
function isValidIcon(icon) {
    return CONFIG.ICON_POOL.includes(icon);
}

// Valider un chemin d'image
function isValidImagePath(path) {
    return /^assets\/[a-zA-Z0-9\/_.-]+\.(png|jpg|jpeg|gif|webp)$/i.test(path);
}

function getCreditIcon(size = 'xs', additionalClasses = '') {
    if (CONFIG.CREDIT.type === 'image') {
        // Valider le chemin de l'image
        const imagePath = isValidImagePath(CONFIG.CREDIT.image) ? CONFIG.CREDIT.image : 'assets/credits/coin.png';
        const sizeMap = { xs: '12px', sm: '16px', md: '20px', lg: '24px' };
        const width = sizeMap[size] || '16px';
        return `<img src="${imagePath}" alt="Crédit" class="${escapeHtml(additionalClasses)}" style="width: ${width};">`;
    } else {
        // Valider l'icône
        const icon = isValidIcon(CONFIG.CREDIT.icon) ? CONFIG.CREDIT.icon : 'fa-coins';
        return `<i class="fa-solid ${icon} text-${size} ${escapeHtml(additionalClasses)}"></i>`;
    }
}

function fx(elementId, animationClass) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove(animationClass);
        void el.offsetWidth;
        el.classList.add(animationClass);
        setTimeout(() => el.classList.remove(animationClass), 600);
    }
}

function createCoinParticles(amount, targetElement) {
    const target = document.getElementById(targetElement);
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'coin-particle';
        
        // Utiliser l'icône de crédit configurée
        if (CONFIG.CREDIT.type === 'image') {
            particle.innerHTML = `<img src="${CONFIG.CREDIT.image}" style="width: 20px; height: 20px;">`;
        } else {
            particle.innerHTML = `<i class="fa-solid ${CONFIG.CREDIT.icon} text-yellow-500 text-xl"></i>`;
        }
        
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 50 + Math.random() * 30;
        const startX = centerX + Math.cos(angle) * distance;
        const startY = centerY + Math.sin(angle) * distance;
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

function animateNumberIncrement(elementId, from, to, duration = 800) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startTime = performance.now();
    const difference = to - from;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function pour un effet plus naturel
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(from + difference * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = Math.floor(to);
        }
    }
    
    element.classList.add('animate-pop');
    setTimeout(() => element.classList.remove('animate-pop'), 300);
    
    requestAnimationFrame(update);
}

function createConfetti() {
    const colors = ['#06b6d4', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#fbbf24'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        
        // Formes variées
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
    }
}

function celebrateCompletion(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('celebrate');
        setTimeout(() => element.classList.remove('celebrate'), 600);
    }
    
    createConfetti();
}

function getMultiplier() {
    return 1 + (state.rebirths * 0.2);
}

function getCurrentStage() {
    return [...CONFIG.STAGES].reverse().find(s => state.ascensionPoints >= s.min) || CONFIG.STAGES[0];
}

// ===== GESTION DES DONNÉES =====

function saveState() {
    DB.save(state);
}

function loadState() {
    state = DB.load();
    checkDailiesReset();
}

function checkDailiesReset() {
    const today = new Date().toLocaleDateString('fr-FR');
    if (state.lastLoginDate !== today) {
        state.dailies.forEach(d => d.done = false);
        state.dailyBonusClaimed = false;
        state.dailyBonusClaimedAt = null;
        state.lastLoginDate = today;
        saveState();
    }
}

function getTimeUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, total: diff };
}

function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (weeks < 4) return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    if (months < 12) return `Il y a ${months} mois`;
    return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}

function getFullDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getDateGroup(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Aujourd\'hui';
    if (isYesterday) return 'Hier';

    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return 'Cette semaine';
    if (diffDays < 30) return 'Ce mois-ci';

    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// ===== GESTION DES MODALES =====

function openModal(id) {
    document.getElementById(id).classList.add('active');
    if (id === 'modal-config') {
        activeConfigTab = 'categories';
        renderConfigModal();
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    if (id === 'modal-config') {
        resetCatForm();
        editingCategory = null;
    }
}

// ===== RENDU DE L'INTERFACE =====

function render() {
    const mult = getMultiplier();

    // Mise à jour du thème
    document.documentElement.style.setProperty('--c-primary', CONFIG.THEMES[state.rebirths % CONFIG.THEMES.length]);

    // Mise à jour des statistiques
    document.getElementById('coins').innerText = Math.floor(Math.max(0, state.coins));
    document.getElementById('coin-icon').innerHTML = getCreditIcon('sm', 'text-yellow-500');

    const ascPtsHeaderEl = document.getElementById('asc-pts-header');
    if (ascPtsHeaderEl) ascPtsHeaderEl.innerText = state.ascensionPoints;

    document.getElementById('rb-val').innerText = state.rebirths;

    // Mise à jour du stage
    const cur = getCurrentStage();
    if (lastRank !== "" && lastRank !== cur.n) {
        fx('profile-card', 'flash-win');
    }
    lastRank = cur.n;

    document.getElementById('comp-stage').innerText = cur.n;
    document.getElementById('comp-rank').innerText = cur.r;
    document.getElementById('comp-icon').className = `fa-solid ${cur.i} text-3xl text-primary`;

    // Mise à jour de la description du stage
    const descEl = document.getElementById('comp-desc');
    if (descEl) {
        descEl.innerText = cur.desc;
    }

    // Afficher le prochain rang avec barre de progression
    const nextStage = CONFIG.STAGES.find(s => s.min > state.ascensionPoints);
    const nextRankEl = document.getElementById('next-rank-info');
    
    if (nextStage) {
        const remaining = nextStage.min - state.ascensionPoints;
        const progress = ((state.ascensionPoints - cur.min) / (nextStage.min - cur.min)) * 100;

        // Info du prochain rang avec stats et barre de progression
        if (nextRankEl) {
            nextRankEl.innerHTML = `
                <div class="text-[9px] text-slate-500 uppercase font-bold mb-3">Prochain Rang</div>
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-primary/20">
                        <i class="fa-solid ${nextStage.i} text-primary text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <div class="text-[11px] font-bold text-white">${nextStage.n}</div>
                        <div class="text-[9px] text-slate-500 mb-2">Encore ${remaining} points</div>
                        <div class="h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                    <div class="text-center">
                        <div class="text-[8px] text-slate-500 uppercase font-bold mb-1">Total XP</div>
                        <div class="font-gaming text-xs text-white">${Math.floor(state.xp)}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-[8px] text-slate-500 uppercase font-bold mb-1">Multiplicateur</div>
                        <div class="font-gaming text-xs text-primary">x${mult.toFixed(1)}</div>
                    </div>
                </div>
            `;
        }
    } else {
        // Rang maximum atteint
        if (nextRankEl) {
            nextRankEl.innerHTML = `
                <div class="text-center py-4">
                    <i class="fa-solid fa-trophy text-yellow-500 text-2xl mb-2"></i>
                    <div class="text-[9px] text-yellow-500 uppercase font-bold mb-3">
                        Rang Maximum Atteint !
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                        <div class="text-center">
                            <div class="text-[8px] text-slate-500 uppercase font-bold mb-1">Total XP</div>
                            <div class="font-gaming text-xs text-white">${Math.floor(state.xp)}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-[8px] text-slate-500 uppercase font-bold mb-1">Multiplicateur</div>
                            <div class="font-gaming text-xs text-primary">x${mult.toFixed(1)}</div>
                        </div>
                    </div>
                    <div class="text-[8px] text-slate-500 mt-3">Prêt pour la Renaissance</div>
                </div>
            `;
        }
    }

    // Rendu des composants
    renderShop();
    renderFilterBar();
    renderQuests(mult);
    renderDailyCard();
    renderCategorySelect();
    initIconPicker();
}

function renderCategorySelect() {
    // Initialiser la catégorie sélectionnée si elle n'existe pas
    if (!selectedCategoryForQuest && state.categories.length > 0) {
        selectedCategoryForQuest = state.categories[0];
    }

    // Mettre à jour le bouton avec la catégorie sélectionnée
    if (selectedCategoryForQuest) {
        const iconEl = document.getElementById('selected-cat-icon');
        const nameEl = document.getElementById('selected-cat-name');

        if (iconEl && nameEl) {
            const validColor = isValidHexColor(selectedCategoryForQuest.color) ? selectedCategoryForQuest.color : '#06b6d4';
            const validIcon = isValidIcon(selectedCategoryForQuest.icon) ? selectedCategoryForQuest.icon : 'fa-tag';
            iconEl.style.background = `${validColor}33`;
            iconEl.innerHTML = `<i class="fa-solid ${validIcon} text-xs" style="color: ${validColor};"></i>`;
            nameEl.textContent = escapeHtml(selectedCategoryForQuest.name);
        }
    }

    // Remplir la liste déroulante
    const listEl = document.getElementById('cat-selector-list');
    if (listEl) {
        listEl.innerHTML = state.categories.map(c => {
            const validColor = isValidHexColor(c.color) ? c.color : '#06b6d4';
            const validIcon = isValidIcon(c.icon) ? c.icon : 'fa-tag';
            return `
            <button onclick="selectCategoryForQuest(${c.id})" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all group ${selectedCategoryForQuest && selectedCategoryForQuest.id === c.id ? 'bg-slate-800/50' : ''}">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="background: ${validColor}33;">
                    <i class="fa-solid ${validIcon} text-sm" style="color: ${validColor};"></i>
                </div>
                <span class="text-xs font-black uppercase text-white flex-1 text-left">${escapeHtml(c.name)}</span>
                ${selectedCategoryForQuest && selectedCategoryForQuest.id === c.id ? '<i class="fa-solid fa-check text-primary text-xs"></i>' : ''}
            </button>
        `;
        }).join('');
    }
}

function toggleCategorySelector() {
    const dropdown = document.getElementById('cat-selector-dropdown');
    const chevron = document.querySelector('#cat-selector-btn .fa-chevron-down');

    if (dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('animate-pop');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        dropdown.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

function selectCategoryForQuest(categoryId) {
    selectedCategoryForQuest = state.categories.find(c => c.id === categoryId);
    renderCategorySelect();
    toggleCategorySelector();
}

// Fermer le dropdown si on clique ailleurs
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('cat-selector-dropdown');
    const btn = document.getElementById('cat-selector-btn');

    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.add('hidden');
        const chevron = document.querySelector('#cat-selector-btn .fa-chevron-down');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }

    // Fermer aussi le dropdown des dailies
    const dailyDropdown = document.getElementById('daily-cat-selector-dropdown');
    const dailyBtn = document.getElementById('daily-cat-selector-btn');

    if (dailyDropdown && dailyBtn && !dailyDropdown.contains(e.target) && !dailyBtn.contains(e.target)) {
        dailyDropdown.classList.add('hidden');
        const dailyChevron = document.querySelector('#daily-cat-selector-btn .fa-chevron-down');
        if (dailyChevron) dailyChevron.style.transform = 'rotate(0deg)';
    }
});

function renderFilterBar() {
    const bar = document.getElementById('filter-bar');
    const cats = [{ name: 'Toutes', icon: 'fa-layer-group', color: '#06b6d4' }, ...state.categories];

    bar.innerHTML = cats.map(c => {
        const total = c.name === 'Toutes'
            ? state.quests.length
            : state.quests.filter(q => q.cat === c.name).length;
        const activeCount = c.name === 'Toutes'
            ? state.quests.filter(q => !q.done).length
            : state.quests.filter(q => q.cat === c.name && !q.done).length;

        const isActive = state.activeCat === c.name;
        const validColor = isValidHexColor(c.color) ? c.color : '#06b6d4';
        const bgStyle = isActive ? `background: linear-gradient(135deg, ${validColor}dd, ${validColor}99);` : '';

        return `
            <button onclick="filterByCategory('${escapeHtml(c.name)}')" class="filter-btn flex-shrink-0 px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-3 ${isActive ? 'text-white shadow-xl scale-105' : 'glass text-slate-400 hover:scale-105'}" style="${bgStyle}">
                <i class="fa-solid ${isValidIcon(c.icon) ? c.icon : 'fa-tag'} text-base"></i> 
                <span>${escapeHtml(c.name)}</span>
                <span class="opacity-60 font-mono text-[9px] ml-1">${activeCount}/${total}</span>
            </button>`;
    }).join('');
}

function renderQuests(mult) {
    const questListEl = document.getElementById('quest-list');

    // Filtrer et trier les quêtes
    const filtered = state.quests
        .filter(q => state.activeCat === 'Toutes' || q.cat === state.activeCat)
        .sort((a, b) => b.id - a.id);

    // Grouper par date
    const grouped = {};
    filtered.forEach(q => {
        const group = getDateGroup(q.id);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(q);
    });

    // Générer le HTML
    let html = '';
    Object.keys(grouped).forEach(groupName => {
        const quests = grouped[groupName];

        html += `
            <div class="col-span-full">
                <div class="flex items-center gap-3 mb-4">
                    <div class="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1"></div>
                    <h3 class="text-xs font-black uppercase text-slate-500 tracking-wider">
                        <i class="fa-solid fa-calendar-days mr-2"></i>${escapeHtml(groupName)}
                    </h3>
                    <div class="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1"></div>
                </div>
            </div>
        `;

        quests.forEach(q => {
            const reward = Math.floor(50 * mult);
            const category = state.categories.find(c => c.name === q.cat);
            const catColor = isValidHexColor(category?.color) ? category.color : '#06b6d4';
            const catIcon = isValidIcon(category?.icon) ? category.icon : 'fa-tag';
            const relativeTime = getRelativeTime(q.id);
            const fullDate = getFullDate(q.id);

            html += `
                <div class="glass p-5 rounded-[2rem] flex items-center gap-4 quest-card border transition-all hover:scale-[1.02] ${q.done ? 'opacity-40 border-white/5' : 'border-white/10 hover:border-primary/50'}">
                    <div onclick="toggleQuest(${q.id})" class="w-12 h-12 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${q.done ? 'border-primary' : 'border-slate-800 hover:border-primary'}" style="${q.done ? `background: ${catColor}; border-color: ${catColor};` : ''}">
                        ${q.done ? '<i class="fa-solid fa-check text-white text-lg"></i>' : ''}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: ${catColor}33;">
                                <i class="fa-solid ${catIcon} text-xs" style="color: ${catColor};"></i>
                            </div>
                            <span class="text-[9px] font-black uppercase" style="color: ${catColor};">${escapeHtml(q.cat)}</span>
                            <span class="text-[9px] font-bold text-slate-600 cursor-help" title="${escapeHtml(fullDate)}">
                                <i class="fa-solid fa-clock mr-1"></i>${escapeHtml(relativeTime)}
                            </span>
                        </div>
                        <div class="text-sm font-bold text-white">${escapeHtml(q.text)}</div>
                    </div>
                    <div class="text-right flex flex-col items-end gap-2">
                         <div class="text-xs font-gaming text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg align-center m-auto justify-center inline-flex gap-1">+${reward} ${getCreditIcon('sm')}</div>
                         <button onclick="event.stopPropagation(); deleteQuest(${q.id})" class="text-slate-600 hover:text-red-500 transition-colors p-1"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                </div>
            `;
        });
    });

    questListEl.innerHTML = html || '<div class="col-span-full text-center py-12 text-slate-500"><i class="fa-solid fa-inbox text-4xl mb-3 opacity-30"></i><p class="text-sm">Aucune tâche dans cette catégorie</p></div>';
}

function renderDailyCard() {
    const dailyCardEl = document.getElementById('daily-card-sidebar');

    if (state.dailies.length === 0) {
        dailyCardEl.innerHTML = '';
        return;
    }

    const completedCount = state.dailies.filter(d => d.done).length;
    const totalCount = state.dailies.length;
    const allDone = completedCount === totalCount;
    const progress = (completedCount / totalCount) * 100;
    const mult = getMultiplier();
    const isLocked = state.dailyBonusClaimed;

    let timerHtml = '';
    if (isLocked) {
        const timeLeft = getTimeUntilMidnight();
        timerHtml = `
            <div class="bg-slate-900/80 p-4 rounded-2xl border border-white/10 text-center">
                <div class="text-[10px] text-slate-400 font-bold uppercase mb-2">
                    <i class="fa-solid fa-lock mr-1"></i>Réinitialisation dans
                </div>
                <div id="daily-timer" class="font-gaming text-primary text-lg font-black">
                    ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}
                </div>
            </div>
        `;
    }

    dailyCardEl.innerHTML = `
        <div class="glass p-6 rounded-[2.5rem] border-2 ${isLocked ? 'border-green-500/50 bg-green-500/5' : allDone ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/30'} transition-all ${isLocked ? 'opacity-60' : ''}">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-calendar-check'} text-white text-xl"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-gaming text-sm font-black uppercase text-white">Objectifs réguliers</h3>
                    <p class="text-[9px] text-slate-400 font-bold">${completedCount}/${totalCount} complétés ${allDone ? '🎉' : ''}</p>
                </div>
            </div>
            
            ${isLocked ? `
                <div class="text-center mb-4">
                    <div class="text-xs font-bold text-green-400 mb-1">✓ BONUS OBTENU</div>
                    <div class="text-[10px] text-yellow-500 font-gaming inline-flex gap-1 m-auto justify-center">+${Math.floor(350 * mult)} ${getCreditIcon('sm')}</div>
                </div>
            ` : `
                <div class="text-xs font-bold text-yellow-500 inline-flex gap-1 content-center justify-center m-auto w-full text-center mb-4">
                    Bonus: ${Math.floor(350 * mult)} ${getCreditIcon('sm')}
                </div>
            `}
            
            <div class="h-2 bg-slate-900 rounded-full overflow-hidden mb-4">
                <div class="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500" style="width: ${progress}%"></div>
            </div>
            
            ${timerHtml}
            
            <div class="space-y-2 mt-4 ${isLocked ? 'pointer-events-none' : ''}">
                ${state.dailies.map(d => {
        const category = state.categories.find(c => c.name === d.cat);
        const catColor = isValidHexColor(category?.color) ? category.color : '#06b6d4';
        const catIcon = isValidIcon(category?.icon) ? category.icon : 'fa-tag';
        return `
                        <div onclick="toggleDaily(${d.id})" class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 cursor-pointer transition-all group ${d.done ? 'opacity-50' : ''} ${isLocked ? 'cursor-not-allowed' : ''}">
                            <div class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${d.done ? 'bg-green-500 border-green-500' : 'border-slate-700 group-hover:border-primary'}">
                                ${d.done ? '<i class="fa-solid fa-check text-white text-xs"></i>' : ''}
                            </div>
                            <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: ${catColor}33;">
                                <i class="fa-solid ${catIcon} text-xs" style="color: ${catColor};"></i>
                            </div>
                            <span class="text-xs font-bold text-white flex-1">${escapeHtml(d.text)}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function renderShop() {
    const container = document.getElementById('shop-items-container');

    if (state.ascensionPoints >= 5000) {
        container.innerHTML = `
            <div class="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50 border-2 border-purple-500/30">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>
                <div class="relative z-10 text-center">
                    <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl animate-float">
                        <i class="fa-solid fa-infinity text-white text-4xl"></i>
                    </div>
                    <h4 class="font-gaming text-2xl font-black text-white uppercase mb-3 tracking-wider">Renaissance Disponible</h4>
                    <p class="text-sm text-slate-300 mb-6 max-w-md mx-auto">Transcendez votre existence actuelle. Réinitialisez votre progression pour obtenir un multiplicateur permanent et débloquer de nouvelles couleurs.</p>
                    <div class="flex items-center justify-center gap-4 mb-6">
                        <div class="glass px-4 py-2 rounded-xl">
                            <div class="text-[10px] text-slate-400 uppercase font-bold">Nouveau Multiplicateur</div>
                            <div class="text-lg font-gaming text-primary">x${(1 + (state.rebirths + 1) * 0.2).toFixed(1)}</div>
                        </div>
                        <div class="glass px-4 py-2 rounded-xl">
                            <div class="text-[10px] text-slate-400 uppercase font-bold">Renaissances</div>
                            <div class="text-lg font-gaming text-yellow-500">${state.rebirths} → ${state.rebirths + 1}</div>
                        </div>
                    </div>
                    <button onclick="performRebirth()" class="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white px-8 py-4 rounded-2xl font-gaming uppercase tracking-widest text-lg shadow-2xl hover:scale-105 transition-transform">
                        <i class="fa-solid fa-sparkles mr-2"></i>Renaître
                    </button>
                    <p class="text-[10px] text-slate-500 mt-4">⚠️ Réinitialise XP, Crédits et Points d'Ascension</p>
                </div>
            </div>
        `;
        return;
    }

    const items = [
        { n: 'Cellule Basique', g: 30, p: 300, i: 'fa-battery-half', desc: 'Amélioration génétique de base', color: 'from-cyan-500 to-blue-500' },
        { n: 'Module Avancé', g: 100, p: 900, i: 'fa-microchip', desc: 'Augmentation neuronale', color: 'from-blue-500 to-purple-500' },
        { n: 'Noyau Quantique', g: 450, p: 3500, i: 'fa-atom', desc: 'Évolution transcendantale', color: 'from-purple-500 to-pink-500' }
    ];

    container.innerHTML = `
        <div class="mb-6 glass p-6 rounded-2xl border border-white/10">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-xs text-slate-400 font-bold uppercase mb-1">Progression vers la Renaissance</div>
                    <div class="text-2xl font-gaming text-white">${state.ascensionPoints} <span class="text-sm text-slate-500">/ 5000</span></div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-slate-400 font-bold uppercase mb-1">Crédits Disponibles</div>
                    <div class="text-2xl font-gaming text-yellow-500">${Math.floor(state.coins)}</div>
                </div>
            </div>
            <div class="h-3 bg-slate-900 rounded-full overflow-hidden mt-4">
                <div class="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-1000" style="width: ${(state.ascensionPoints / 5000) * 100}%"></div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${items.map(item => {
        const canAfford = state.coins >= item.p;
        return `
                    <div class="relative group">
                        <div class="absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 rounded-3xl transition-opacity duration-300 blur-xl"></div>
                        <div class="relative glass p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all hover:scale-105 duration-300">
                            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg">
                                <i class="fa-solid ${item.i} text-2xl text-white"></i>
                            </div>
                            <h4 class="text-sm font-black uppercase text-white text-center mb-2">${item.n}</h4>
                            <p class="text-[10px] text-slate-400 text-center mb-4 h-8">${item.desc}</p>
                            
                            <div class="bg-slate-900/50 rounded-xl p-3 mb-4">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-[10px] text-slate-500 uppercase font-bold">Gain</span>
                                    <span class="text-sm font-gaming text-green-400">+${item.g} ASC</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] text-slate-500 uppercase font-bold">Coût</span>
                                    <span class="text-sm font-gaming text-yellow-500 gap-1 inline-flex">${item.p} ${getCreditIcon('md')}</span>
                                </div>
                            </div>
                            
                            <button onclick="buyAscension(${item.p}, ${item.g})" class="w-full bg-gradient-to-r ${item.color} text-white font-black py-3 rounded-xl text-sm hover:shadow-xl transition-all ${!canAfford ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}" ${!canAfford ? 'disabled' : ''}>
                                <i class="fa-solid fa-shopping-cart mr-2"></i>Acheter
                            </button>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
        
        <div class="mt-8 glass p-6 rounded-2xl border border-white/10 text-center">
            <i class="fa-solid fa-lightbulb text-yellow-500 text-2xl mb-3"></i>
            <p class="text-xs text-slate-400">
                <span class="font-bold text-white">Astuce :</span> Accumulez 5000 points d'Ascension pour débloquer la Renaissance et obtenir un multiplicateur permanent !
            </p>
        </div>
    `;
}

// ===== GESTION DES QUÊTES =====

function addQuest() {
    const input = document.getElementById('q-input');
    const text = input.value.trim();

    // Validation: longueur max 200 caractères
    if (!text || text.length > 200) return;
    if (!selectedCategoryForQuest) {
        selectedCategoryForQuest = state.categories[0];
    }

    state.quests.unshift({
        id: Date.now(),
        text: text,
        cat: selectedCategoryForQuest.name,
        catColor: selectedCategoryForQuest.color,
        done: false
    });

    input.value = "";
    fx('input-area', 'flash-win');
    saveState();
    render();
}

function toggleQuest(id) {
    const q = state.quests.find(x => x.id === id);
    if (!q) return;

    q.done = !q.done;
    const val = 50 * getMultiplier();

    if (q.done) {
        const oldCoins = state.coins;
        state.xp += val;
        state.coins += val;

        // Animations de gain
        createCoinParticles(val, 'coin-display');
        animateNumberIncrement('coins', oldCoins, state.coins);
        fx('coin-display', 'animate-pop');
    } else {
        state.xp = Math.max(0, state.xp - val);
        state.coins = Math.max(0, state.coins - val);
    }

    saveState();
    render();
}


function toggleDaily(id) {
    // Si le bonus a déjà été réclamé, empêcher toute modification
    if (state.dailyBonusClaimed) {
        return;
    }

    const d = state.dailies.find(x => x.id === id);
    if (!d) return;

    d.done = !d.done;

    // Vérifier si tous les dailies sont complétés
    const allDone = state.dailies.length > 0 && state.dailies.every(x => x.done);

    if (allDone && !state.dailyBonusClaimed) {
        const bonus = 350 * getMultiplier();
        const oldCoins = state.coins;

        state.coins += bonus;
        state.xp += bonus;
        state.dailyBonusClaimed = true;
        state.dailyBonusClaimedAt = new Date().toISOString();

        // Animations de célébration
        setTimeout(() => {
            celebrateCompletion('daily-card-sidebar');
            createCoinParticles(bonus, 'coin-display');
            animateNumberIncrement('coins', oldCoins, state.coins, 1200);
            fx('coin-display', 'animate-pop');
            fx('asc-display', 'animate-pop');
        }, 300);
    }

    saveState();
    render();
}


function deleteQuest(id) {
    state.quests = state.quests.filter(q => q.id !== id);
    saveState();
    render();
}

function filterByCategory(name) {
    state.activeCat = name;
    render();
}

// ===== GESTION DE LA BOUTIQUE =====

function buyAscension(cost, gain) {
    if (state.coins >= cost) {
        state.coins -= cost;
        state.ascensionPoints += gain;
        fx('shop-card', 'flash-win');
        saveState();
        render();
    } else {
        fx('shop-card', 'animate-shake');
    }
}

function performRebirth() {
    state.rebirths++;
    state.xp = 0;
    state.coins = 0;
    state.ascensionPoints = 0;
    saveState();
    render();
    closeModal('modal-shop');
}

// ===== GESTION DES CATÉGORIES =====

function renderConfigModal() {
    const tabsHtml = `
        <div class="flex gap-2 mb-6">
            <button onclick="switchConfigTab('categories')" class="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase transition-all ${activeConfigTab === 'categories' ? 'bg-primary text-white' : 'glass text-slate-400'}">
                <i class="fa-solid fa-folder mr-2"></i>Catégories
            </button>
            <button onclick="switchConfigTab('dailies')" class="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase transition-all ${activeConfigTab === 'dailies' ? 'bg-primary text-white' : 'glass text-slate-400'}">
                <i class="fa-solid fa-calendar-check mr-2"></i>Objectifs réguliers
            </button>
        </div>
    `;

    document.getElementById('config-tabs').innerHTML = tabsHtml;

    if (activeConfigTab === 'categories') {
        renderCategoryManager();
    } else {
        renderDailyManager();
    }
}

function switchConfigTab(tab) {
    activeConfigTab = tab;
    renderConfigModal();
}

function renderCategoryManager() {
    const list = document.getElementById('cat-manage-list');
    list.innerHTML = state.categories.map(c => `
        <div draggable="true" data-id="${c.id}" class="flex justify-between items-center glass p-4 rounded-2xl border-white/5 cursor-move group hover:border-primary/30 transition-all">
            <div class="flex items-center gap-3 pointer-events-none text-white">
                <i class="fa-solid fa-grip-vertical text-slate-700"></i>
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: ${c.color}33; border: 2px solid ${c.color};">
                    <i class="fa-solid ${c.icon}" style="color: ${c.color};"></i>
                </div>
                <span class="font-bold text-xs uppercase">${c.name}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="editCategory(${c.id})" class="p-2 text-slate-500 hover:text-primary transition-colors">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="removeCategory(${c.id})" class="p-2 text-slate-500 hover:text-red-500 transition-colors">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`).join('');

    const formHtml = `
        <div class="bg-slate-900/80 p-5 rounded-[2rem] border border-white/10">
            <div id="icon-picker" class="grid grid-cols-8 gap-2 mb-4 max-h-40 overflow-y-auto pr-2"></div>
            <div id="color-picker" class="grid grid-cols-8 gap-2 mb-4"></div>
            <div class="flex gap-2">
                <input type="text" id="new-cat-input" placeholder="Nom du secteur..." class="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 ring-primary outline-none">
                <button onclick="saveCategory()" class="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                    <i class="fa-solid ${editingCategory ? 'fa-check' : 'fa-plus'}"></i>
                </button>
                ${editingCategory ? '<button onclick="cancelEditCategory()" class="bg-slate-700 text-white px-4 py-3 rounded-xl font-bold hover:scale-105 transition-transform"><i class="fa-solid fa-times"></i></button>' : ''}
            </div>
        </div>
    `;

    document.getElementById('cat-form-area').innerHTML = formHtml;
    initIconPicker();
    initColorPicker();
    initDragAndDrop();
}

function renderDailyManager() {
    const list = document.getElementById('cat-manage-list');

    if (state.dailies.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-slate-500">
                <i class="fa-solid fa-calendar-xmark text-4xl mb-3 opacity-30"></i>
                <p class="text-sm">Aucun objectif régulier défini</p>
            </div>
        `;
    } else {
        list.innerHTML = state.dailies.map(d => {
            const category = state.categories.find(c => c.name === d.cat);
            const catColor = category ? category.color : '#06b6d4';

            return `
                <div class="flex justify-between items-center glass p-4 rounded-2xl border-white/5 hover:border-primary/30 transition-all group">
                    <div class="flex items-center gap-3 text-white flex-1">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: ${catColor}33; border: 2px solid ${catColor};">
                            <i class="fa-solid ${category ? category.icon : 'fa-tag'}" style="color: ${catColor};"></i>
                        </div>
                        <div class="flex-1">
                            <div class="text-xs font-bold">${d.text}</div>
                            <div class="text-[9px] text-slate-500 uppercase">${d.cat}</div>
                        </div>
                    </div>
                    <button onclick="removeDaily(${d.id})" class="p-2 text-slate-500 hover:text-red-500 transition-colors">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    // Initialiser la catégorie sélectionnée pour les dailies
    if (!selectedCategoryForDaily && state.categories.length > 0) {
        selectedCategoryForDaily = state.categories[0];
    }

    const formHtml = `
        <div class="bg-slate-900/80 p-5 rounded-[2rem] border border-white/10">
            <div class="flex gap-2 mb-3">
                <input type="text" id="new-daily-input" placeholder="Nouvel objectif régulier..." class="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 ring-primary outline-none">
            </div>
            <div class="flex gap-2">
                <div class="relative flex-1">
                    <button id="daily-cat-selector-btn" onclick="toggleDailyCategorySelector()" class="w-full glass py-3 px-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-all border border-white/10 hover:border-primary/30">
                        <div id="selected-daily-cat-icon" class="w-6 h-6 rounded-lg flex items-center justify-center" style="background: ${selectedCategoryForDaily.color}33;">
                            <i class="fa-solid ${selectedCategoryForDaily.icon} text-xs" style="color: ${selectedCategoryForDaily.color};"></i>
                        </div>
                        <span id="selected-daily-cat-name" class="text-xs font-black uppercase text-white flex-1 text-left">${selectedCategoryForDaily.name}</span>
                        <i class="fa-solid fa-chevron-down text-slate-500 text-xs"></i>
                    </button>
                    
                    <div id="daily-cat-selector-dropdown" class="absolute bottom-full mb-2 left-0 right-0 glass rounded-2xl border border-white/10 shadow-2xl z-50 hidden">
                        <div id="daily-cat-selector-list" class="p-2 max-h-48 overflow-y-auto">
                            ${state.categories.map(c => `
                                <button onclick="selectCategoryForDaily(${c.id})" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all group ${selectedCategoryForDaily.id === c.id ? 'bg-slate-800/50' : ''}">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style="background: ${c.color}33;">
                                        <i class="fa-solid ${c.icon} text-sm" style="color: ${c.color};"></i>
                                    </div>
                                    <span class="text-xs font-black uppercase text-white flex-1 text-left">${c.name}</span>
                                    ${selectedCategoryForDaily.id === c.id ? '<i class="fa-solid fa-check text-primary text-xs"></i>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <button onclick="addDaily()" class="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
    `;

    document.getElementById('cat-form-area').innerHTML = formHtml;
}

function saveCategory() {
    const name = document.getElementById('new-cat-input').value.trim();
    
    // Validation: longueur max 50 caractères
    if (!name || name.length > 50) return;
    
    // Validation: couleur et icône
    if (!isValidHexColor(selectedColor) || !isValidIcon(selectedIcon)) {
        return;
    }

    if (editingCategory) {
        // Mode édition
        const cat = state.categories.find(c => c.id === editingCategory);
        if (cat) {
            cat.name = name;
            cat.icon = selectedIcon;
            cat.color = selectedColor;
        }
        editingCategory = null;
    } else {
        // Mode ajout
        const newId = state.categories.length > 0 ? Math.max(...state.categories.map(c => c.id)) + 1 : 1;
        state.categories.push({ id: newId, name, icon: selectedIcon, color: selectedColor });
    }

    saveState();
    render();
    renderConfigModal();
    resetCatForm();
}

function editCategory(id) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    editingCategory = id;
    selectedIcon = cat.icon;
    selectedColor = cat.color;
    document.getElementById('new-cat-input').value = cat.name;

    initIconPicker();
    initColorPicker();
    renderConfigModal();
}

function cancelEditCategory() {
    editingCategory = null;
    resetCatForm();
    renderConfigModal();
}

function removeCategory(id) {
    if (confirm("Supprimer ce secteur ?")) {
        state.categories = state.categories.filter(c => c.id !== id);
        saveState();
        render();
        renderConfigModal();
    }
}

function addDaily() {
    const input = document.getElementById('new-daily-input');
    const text = input.value.trim();
    
    // Validation: longueur max 200 caractères
    if (!text || text.length > 200) return;

    if (!selectedCategoryForDaily) {
        selectedCategoryForDaily = state.categories[0];
    }

    const newId = state.dailies.length > 0 ? Math.max(...state.dailies.map(d => d.id)) + 1 : 1;

    state.dailies.push({
        id: newId,
        text: text,
        cat: selectedCategoryForDaily.name,
        done: false
    });

    input.value = "";
    saveState();
    render();
    renderConfigModal();
}

function toggleDailyCategorySelector() {
    const dropdown = document.getElementById('daily-cat-selector-dropdown');
    const chevron = document.querySelector('#daily-cat-selector-btn .fa-chevron-down');

    if (dropdown && dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('animate-pop');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else if (dropdown) {
        dropdown.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

function selectCategoryForDaily(categoryId) {
    selectedCategoryForDaily = state.categories.find(c => c.id === categoryId);
    renderConfigModal();
    toggleDailyCategorySelector();
}

function removeDaily(id) {
    if (confirm("Supprimer cet objectif quotidien ?")) {
        state.dailies = state.dailies.filter(d => d.id !== id);
        saveState();
        render();
        renderConfigModal();
    }
}

function resetCatForm() {
    const input = document.getElementById('new-cat-input');
    if (input) input.value = "";
    selectedIcon = 'fa-tag';
    selectedColor = '#06b6d4';
    editingCategory = null;
    initIconPicker();
    initColorPicker();
}

function initIconPicker() {
    const picker = document.getElementById('icon-picker');
    if (!picker) return;

    picker.innerHTML = CONFIG.ICON_POOL.map(icon => `
        <button onclick="selectIcon('${icon}')" class="w-10 h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-110 ${selectedIcon === icon ? 'border-primary bg-primary/20 text-primary scale-110' : 'border-white/5 text-slate-500 hover:border-primary/50'}">
            <i class="fa-solid ${icon}"></i>
        </button>`).join('');
}

function initColorPicker() {
    const picker = document.getElementById('color-picker');
    if (!picker) return;

    const colors = ['#06b6d4', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

    picker.innerHTML = colors.map(color => `
        <button onclick="selectColor('${color}')" class="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${selectedColor === color ? 'scale-110 ring-2 ring-white' : ''}" style="background: ${color}; border-color: ${selectedColor === color ? '#fff' : color};">
        </button>`).join('');
}

function selectColor(color) {
    selectedColor = color;
    initColorPicker();
}

function selectIcon(icon) {
    selectedIcon = icon;
    initIconPicker();
}

// ===== DRAG AND DROP =====

function initDragAndDrop() {
    const list = document.getElementById('cat-manage-list');
    if (!list) return;

    let dragTarget = null;

    list.addEventListener('dragstart', (e) => {
        if (!e.target.hasAttribute('data-id')) return;
        dragTarget = e.target;
        e.target.classList.add('dragging');
    });

    list.addEventListener('dragend', (e) => {
        if (!e.target.hasAttribute('data-id')) return;
        e.target.classList.remove('dragging');
        const newOrder = [];
        list.querySelectorAll('[data-id]').forEach(el => {
            const cat = state.categories.find(c => c.id === parseInt(el.getAttribute('data-id')));
            if (cat) newOrder.push(cat);
        });
        state.categories = newOrder;
        saveState();
        render();
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = [...list.querySelectorAll('[draggable]:not(.dragging)')].reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = e.clientY - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;

        if (afterElement == null) {
            list.appendChild(dragTarget);
        } else {
            list.insertBefore(dragTarget, afterElement);
        }
    });
}

// ===== GESTION DES DONNÉES =====

function confirmClearData() {
    const confirmed = confirm(
        '⚠️ ATTENTION - Action irréversible ⚠️\n\n' +
        'Cela supprimera définitivement :\n' +
        '• Toutes vos tâches et objectifs\n' +
        '• Votre progression et vos points\n' +
        '• Vos rangs et récompenses\n' +
        '• Vos catégories personnalisées\n' +
        '• Vos tâches quotidiennes\n\n' +
        'Êtes-vous absolument certain de vouloir continuer ?'
    );

    if (confirmed) {
        const doubleConfirmed = confirm(
            'Dernière confirmation :\n\n' +
            'Tapez "SUPPRIMER" dans la prochaine boîte de dialogue pour confirmer la suppression définitive de toutes vos données.'
        );

        if (doubleConfirmed) {
            const userInput = prompt('Tapez "SUPPRIMER" pour confirmer :');
            if (userInput === 'SUPPRIMER') {
                clearAllData();
            } else {
                alert('Suppression annulée. Vos données sont sûres.');
            }
        }
    }
}

function clearAllData() {
    try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Réinitialiser l'état en mémoire
        state = {
            quests: [],
            ascensionPoints: 0,
            coins: 0,
            rebirths: 0,
            categories: [],
            dailies: [],
            dailyBonusClaimed: false,
            lastDailyReset: null,
            filterOrder: []
        };

        // Recharger la page pour réinitialiser complètement
        alert('✓ Toutes vos données ont été supprimées avec succès.\n\nLa page va se recharger.');
        location.reload();
    } catch (error) {
        console.error('Erreur lors de la suppression des données :', error);
        alert('Une erreur s\'est produite lors de la suppression des données.');
    }
}

// ===== INITIALISATION =====

function initFilterBarDrag() {
    const slider = document.getElementById('filter-bar');
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadState();
    render();
    initFilterBarDrag();

    // Gérer l'état du bouton d'ajout
    const questInput = document.getElementById('q-input');
    const addBtn = document.getElementById('add-quest-btn');

    if (questInput && addBtn) {
        questInput.addEventListener('input', () => {
            addBtn.disabled = !questInput.value.trim();
        });

        questInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && questInput.value.trim()) {
                addQuest();
            }
        });
    }

    // Mettre à jour le timer toutes les secondes
    setInterval(() => {
        if (state.dailyBonusClaimed) {
            const timerEl = document.getElementById('daily-timer');
            if (timerEl) {
                const timeLeft = getTimeUntilMidnight();
                timerEl.textContent = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;
            }
        }
    }, 1000);
});
