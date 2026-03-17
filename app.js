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
let categoryToDelete = null; // Catégorie en cours de suppression
let reassignmentData = null; // Données de réassignation des objectifs
let currentPage = 'dashboard'; // Page actuelle
let peaceFears = []; // Peurs dans le sac d'apaisement
let achievements = []; // Achievements chargés depuis le JSON

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

// Fonction pour gérer le pluriel/singulier
function pluralize(count, singular, plural = null) {
    if (plural === null) {
        plural = singular + 's';
    }
    return count <= 1 ? singular : plural;
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
        // Vérifier le streak avant de réinitialiser
        checkAndUpdateStreak();
        
        state.dailies.forEach(d => d.done = false);
        state.dailyBonusClaimed = false;
        state.dailyBonusClaimedAt = null;
        state.lastLoginDate = today;
        saveState();
    }
}

function checkAndUpdateStreak() {
    const completedDailies = state.dailies.filter(d => d.done).length;
    const totalDailies = state.dailies.length;
    const requirement = state.streakRequirement || 3;
    
    // Si pas assez de dailies, ne pas compter le streak
    if (totalDailies === 0) return;
    
    const oldStreak = state.streak || 0;
    
    // Si le nombre de dailies complétées est inférieur au requirement, réinitialiser le streak
    if (completedDailies < requirement) {
        if (state.streak > 0) {
            // Afficher une notification de perte de streak
            showStreakLostNotification(state.streak);
        }
        state.streak = 0;
    } else {
        // Augmenter le streak
        state.streak = (state.streak || 0) + 1;
        
        // Animer le streak si augmenté
        if (state.streak > oldStreak) {
            const streakEl = document.getElementById('streak-val');
            if (streakEl) {
                streakEl.classList.remove('streak-pulse');
                // Forcer le reflow pour relancer l'animation
                void streakEl.offsetWidth;
                streakEl.classList.add('streak-pulse');
            }
        }
    }
    
    state.streakLastDate = new Date().toLocaleDateString('fr-FR');
    saveState();
}

function showStreakLostNotification(streakCount) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 glass p-4 rounded-xl border border-red-500/30 bg-red-500/10 z-50 animate-bounce';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fa-solid fa-fire text-2xl text-red-500"></i>
            <div>
                <p class="font-bold text-white">Streak perdu!</p>
                <p class="text-xs text-slate-300">Vous aviez une série de ${streakCount} ${pluralize(streakCount, 'jour')}.</p>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
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

    // Mise à jour du streak
    const streakEl = document.getElementById('streak-val');
    if (streakEl) streakEl.innerText = state.streak || 0;

    // Sync valeurs menu mobile
    const coinsMobile = document.getElementById('coins-mobile');
    const streakMobile = document.getElementById('streak-mobile');
    const ascMobile = document.getElementById('asc-mobile');
    const coinsMobileHeader = document.getElementById('coins-mobile-header');
    const streakMobileHeader = document.getElementById('streak-mobile-header');
    const coinIconMobile = document.getElementById('coin-icon-mobile');
    const coins = Math.floor(Math.max(0, state.coins));
    const streak = state.streak || 0;
    if (coinsMobile) coinsMobile.innerText = coins;
    if (streakMobile) streakMobile.innerText = streak;
    if (ascMobile) ascMobile.innerText = state.ascensionPoints;
    if (coinsMobileHeader) coinsMobileHeader.innerText = coins;
    if (streakMobileHeader) streakMobileHeader.innerText = streak;
    if (coinIconMobile) coinIconMobile.innerHTML = getCreditIcon('sm', 'text-yellow-500');
    document.getElementById('rb-val').innerText = state.rebirths;
    document.getElementById('rb-label').innerText = pluralize(state.rebirths, 'Renaissance');

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
                        <div class="text-[9px] text-slate-500 mb-2">Encore ${remaining} ${pluralize(remaining, 'point')}</div>
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
            const locked = isQuestLocked(q);

            const toggleBtn = locked
                ? `<div class="w-12 h-12 rounded-xl border-2 border-slate-700 flex items-center justify-center cursor-not-allowed opacity-60" title="Objectif verrouillé">
                       <i class="fa-solid fa-lock text-slate-500 text-sm"></i>
                   </div>`
                : `<div onclick="toggleQuest(${q.id})" class="w-12 h-12 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${q.done ? 'border-primary' : 'border-slate-800 hover:border-primary'}" style="${q.done ? `background: ${catColor}; border-color: ${catColor};` : ''}">
                       ${q.done ? '<i class="fa-solid fa-check text-white text-lg"></i>' : ''}
                   </div>`;

            html += `
                <div class="glass p-5 rounded-[2rem] flex items-center gap-4 quest-card border transition-all hover:scale-[1.02] ${q.done ? 'opacity-40 border-white/5' : 'border-white/10 hover:border-primary/50'}">
                    ${toggleBtn}
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
                    <h3 class="font-gaming text-sm font-black uppercase text-white">Objectifs quotidiens</h3>
                    <p class="text-[9px] text-slate-400 font-bold">${completedCount}/${totalCount} ${pluralize(completedCount, 'complété')} ${allDone ? '🎉' : ''}</p>
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
        { n: 'Noyau Quantique', g: 450, p: 3200, i: 'fa-atom', desc: 'Évolution transcendantale', color: 'from-purple-500 to-pink-500' }
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

    state.questsCreated++;
    input.value = "";
    fx('input-area', 'flash-win');
    saveState();
    render();
    checkAchievements();
}

function toggleQuest(id) {
    const q = state.quests.find(x => x.id === id);
    if (!q) return;

    // Vérifier si la quest est verrouillée (anti-abus)
    if (q.done && isQuestLocked(q)) {
        fx('coin-display', 'animate-shake');
        showLockWarning();
        return;
    }

    q.done = !q.done;
    const val = 50 * getMultiplier();

    if (q.done) {
        q.completedAt = Date.now();
        const oldCoins = state.coins;
        state.xp += val;
        state.coins += val;
        state.questsCompleted++;

        // Animations de gain
        createCoinParticles(val, 'coin-display');
        animateNumberIncrement('coins', oldCoins, state.coins);
        fx('coin-display', 'animate-pop');
    } else {
        delete q.completedAt;
        state.xp = Math.max(0, state.xp - val);
        state.coins = Math.max(0, state.coins - val);
        state.questsCompleted = Math.max(0, state.questsCompleted - 1);
    }

    saveState();
    render();
    checkAchievements();
}

// Retourne true si la quest complétée ne peut plus être décochée
function isQuestLocked(q) {
    if (!q.done || !q.completedAt) return false;
    const LOCK_DELAY_MS = 5 * 60 * 1000; // 5 minutes
    // Verrouillé si un achat ASC a eu lieu après la complétion
    if (state.lastAscensionPurchase && state.lastAscensionPurchase > q.completedAt) return true;
    // Verrouillé après 5 minutes
    if (Date.now() - q.completedAt > LOCK_DELAY_MS) return true;
    return false;
}

function showLockWarning() {
    const existing = document.getElementById('lock-warning-toast');
    if (existing) return;
    const toast = document.createElement('div');
    toast.id = 'lock-warning-toast';
    toast.className = 'fixed top-4 right-4 glass p-4 rounded-xl border border-red-500/30 bg-red-500/10 z-50 max-w-xs';
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fa-solid fa-lock text-red-400 text-lg flex-shrink-0"></i>
            <div>
                <p class="font-bold text-white text-sm">Objectif verrouillé</p>
                <p class="text-xs text-slate-300">Cet objectif ne peut plus être décoché.</p>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
        state.dailyCompletions = (state.dailyCompletions || 0) + 1;

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
    if (allDone) checkAchievements();
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
        state.lastAscensionPurchase = Date.now();
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
    checkAchievements();
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
                <i class="fa-solid fa-calendar-check mr-2"></i>Objectifs quotidiens
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
            const oldName = cat.name;
            cat.name = name;
            cat.icon = selectedIcon;
            cat.color = selectedColor;
            
            // Mettre à jour tous les objectifs enfants
            state.quests.forEach(quest => {
                if (quest.cat === oldName) {
                    quest.cat = name;
                }
            });
            
            // Mettre à jour toutes les tâches quotidiennes enfants
            state.dailies.forEach(daily => {
                if (daily.cat === oldName) {
                    daily.cat = name;
                }
            });
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
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    // Trouver tous les objectifs et tâches quotidiennes de cette catégorie
    const affectedQuests = state.quests.filter(q => q.cat === cat.name);
    const affectedDailies = state.dailies.filter(d => d.cat === cat.name);
    const totalAffected = affectedQuests.length + affectedDailies.length;

    // S'il n'y a pas d'objectifs affectés, supprimer directement
    if (totalAffected === 0) {
        if (confirm(`Supprimer la catégorie "${cat.name}" ?`)) {
            state.categories = state.categories.filter(c => c.id !== id);
            saveState();
            render();
            renderConfigModal();
        }
        return;
    }

    // Sinon, ouvrir la modal de réassignation
    categoryToDelete = { id, name: cat.name };
    openReassignModal(affectedQuests, affectedDailies);
}

function openReassignModal(quests, dailies) {
    // Stocker les objectifs à réassigner
    reassignmentData = {
        quests: quests.map(q => ({ ...q })),
        dailies: dailies.map(d => ({ ...d })),
        assignments: {}
    };

    // Initialiser les assignments
    [...quests, ...dailies].forEach(item => {
        reassignmentData.assignments[item.id] = null;
    });

    // Remplir le nom de la catégorie
    document.getElementById('reassign-cat-name').textContent = categoryToDelete.name;

    // Rendre les items
    renderReassignItems();

    // Ouvrir la modal
    openModal('modal-reassign');
}

function renderReassignItems() {
    const container = document.getElementById('reassign-items-container');
    container.innerHTML = '';

    const allItems = [...reassignmentData.quests, ...reassignmentData.dailies];

    // Mettre à jour le compteur avec pluriel
    const count = allItems.length;
    document.getElementById('reassign-count').textContent = count;
    document.getElementById('reassign-count-label').textContent = pluralize(count, 'objectif à traiter', 'objectifs à traiter');

    allItems.forEach((item, index) => {
        const isDaily = reassignmentData.dailies.some(d => d.id === item.id);
        const itemType = isDaily ? 'Quotidien' : 'Objectif';
        const currentAssignment = reassignmentData.assignments[item.id];
        const selectedCat = state.categories.find(c => c.name === currentAssignment);

        const div = document.createElement('div');
        div.className = 'group bg-gradient-to-r from-slate-900/40 to-slate-800/40 border border-white/5 hover:border-primary/30 rounded-xl p-3 transition-all hover:shadow-lg hover:shadow-primary/10 reassign-item-row';
        div.setAttribute('data-item-id', item.id);

        const buttonId = `reassign-btn-${item.id}`;

        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                            ${itemType}
                        </span>
                        ${isDaily ? '<i class="fa-solid fa-repeat text-primary text-xs"></i>' : '<i class="fa-solid fa-check-circle text-slate-500 text-xs"></i>'}
                    </div>
                    <p class="text-sm font-semibold text-white truncate">${escapeHtml(item.text)}</p>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    <button id="${buttonId}" onclick="toggleReassignDropdown(${item.id})" class="glass py-1.5 px-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 transition-all border border-white/10 hover:border-primary/30 text-xs font-semibold">
                        <div class="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"};">
                            <i class="fa-solid ${selectedCat ? selectedCat.icon : 'fa-trash-alt'} text-xs" style="color: ${selectedCat ? selectedCat.color : '#f87171'};"></i>
                        </div>
                        <span class="text-white max-w-[100px] truncate">${selectedCat ? escapeHtml(selectedCat.name) : 'Supprimer'}</span>
                        <i class="fa-solid fa-chevron-down text-slate-500 text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}



function updateReassignment(itemId, newCategory) {
    reassignmentData.assignments[itemId] = newCategory || null;
}

function toggleReassignDropdown(itemId) {
    const button = document.getElementById(`reassign-btn-${itemId}`);
    const chevron = button.querySelector('.fa-chevron-down');
    
    // Fermer tous les autres dropdowns
    document.querySelectorAll('[id^="reassign-dropdown-"]').forEach(d => {
        d.remove();
    });
    
    // Vérifier si on doit ouvrir ou fermer
    if (button.getAttribute('data-open') === 'true') {
        button.setAttribute('data-open', 'false');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        return;
    }
    
    // Créer le dropdown en fixed
    const rect = button.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.id = `reassign-dropdown-${itemId}`;
    dropdown.className = 'glass rounded-xl border border-white/10 shadow-2xl min-w-[180px] animate-pop';
    dropdown.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 8}px;
        right: ${window.innerWidth - rect.right}px;
        z-index: 50000;
    `;
    
    const currentAssignment = reassignmentData.assignments[itemId];
    
    dropdown.innerHTML = `
        <div class="p-2 max-h-48 overflow-y-auto">
            <button onclick="selectReassignCategory(${itemId}, null)" class="w-full text-left mb-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1">
                <i class="fa-solid fa-trash-alt"></i>
                Supprimer cet objectif
            </button>
            ${state.categories
                .filter(c => c.name !== categoryToDelete.name)
                .map(c => `
                    <button onclick="selectReassignCategory(${itemId}, '${c.name}')" class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-slate-700/50 transition-colors flex items-center gap-2 ${currentAssignment === c.name ? 'bg-primary/20 border border-primary/30' : ''}">
                        <div class="w-4 h-4 rounded flex items-center justify-center" style="background: ${c.color}33;">
                            <i class="fa-solid ${c.icon} text-xs" style="color: ${c.color};"></i>
                        </div>
                        ${escapeHtml(c.name)}
                    </button>
                `)
                .join('')}
        </div>
    `;
    
    document.body.appendChild(dropdown);
    button.setAttribute('data-open', 'true');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    
    // Fermer au clic en dehors
    setTimeout(() => {
        document.addEventListener('click', closeReassignDropdownOnClickOutside);
    }, 0);
}

function closeReassignDropdownOnClickOutside(e) {
    if (!e.target.closest('[id^="reassign-btn-"]') && !e.target.closest('[id^="reassign-dropdown-"]')) {
        document.querySelectorAll('[id^="reassign-dropdown-"]').forEach(d => {
            d.remove();
        });
        document.querySelectorAll('[id^="reassign-btn-"]').forEach(btn => {
            btn.setAttribute('data-open', 'false');
            const chevron = btn.querySelector('.fa-chevron-down');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        });
        document.removeEventListener('click', closeReassignDropdownOnClickOutside);
    }
}

function selectReassignCategory(itemId, categoryName) {
    updateReassignment(itemId, categoryName);
    document.querySelectorAll('[id^="reassign-dropdown-"]').forEach(d => {
        d.remove();
    });
    document.querySelectorAll('[id^="reassign-btn-"]').forEach(btn => {
        btn.setAttribute('data-open', 'false');
        const chevron = btn.querySelector('.fa-chevron-down');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    });
    document.removeEventListener('click', closeReassignDropdownOnClickOutside);
    renderReassignItems();
}

function deleteReassignItem(itemId) {
    // Marquer l'item pour suppression
    reassignmentData.assignments[itemId] = 'DELETE';
    renderReassignItems();
}

function confirmReassignAndDelete() {
    // Appliquer les réassignations
    Object.entries(reassignmentData.assignments).forEach(([itemId, newCategory]) => {
        const questIndex = reassignmentData.quests.findIndex(q => q.id === parseInt(itemId));
        const dailyIndex = reassignmentData.dailies.findIndex(d => d.id === parseInt(itemId));

        if (newCategory === 'DELETE' || newCategory === null) {
            // Supprimer l'objectif
            if (questIndex !== -1) {
                state.quests = state.quests.filter(q => q.id !== parseInt(itemId));
            }
            if (dailyIndex !== -1) {
                state.dailies = state.dailies.filter(d => d.id !== parseInt(itemId));
            }
        } else if (newCategory) {
            // Réassigner à la nouvelle catégorie
            if (questIndex !== -1) {
                const quest = state.quests.find(q => q.id === parseInt(itemId));
                if (quest) quest.cat = newCategory;
            }
            if (dailyIndex !== -1) {
                const daily = state.dailies.find(d => d.id === parseInt(itemId));
                if (daily) daily.cat = newCategory;
            }
        }
    });

    // Supprimer la catégorie
    state.categories = state.categories.filter(c => c.id !== categoryToDelete.id);

    // Nettoyer
    categoryToDelete = null;
    reassignmentData = null;

    // Sauvegarder et rafraîchir
    saveState();
    render();
    renderConfigModal();
    closeModal('modal-reassign');
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

    state.dailiesCreated++;
    input.value = "";
    saveState();
    render();
    renderConfigModal();
    checkAchievements();
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
    loadAchievements();
    render();
    initFilterBarDrag();

    // Vérification en temps réel du lock des quests (toutes les 30s)
    setInterval(() => {
        const hasLockable = state.quests.some(q => q.done && q.completedAt && !isQuestLocked(q));
        if (hasLockable) renderQuests(getMultiplier());
    }, 30000);

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

    // Re-synchroniser les boutons peace si on change de résolution
    let peaceResizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(peaceResizeTimer);
        peaceResizeTimer = setTimeout(() => {
            const burnD = document.getElementById('peace-burn-btn-desktop');
            const burnVisible = burnD && !burnD.classList.contains('hidden');
            setPeaceBtnState(burnVisible ? 'burn' : (peaceFears.length > 0 ? 'send' : 'empty'));
        }, 150);
    });
});


// ===== NAVIGATION =====

function toggleSidebar() {} // conservé pour compatibilité éventuelle

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('mobile-menu-btn');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    btn.classList.toggle('bg-slate-700/50', isHidden);
}

function navigateTo(page) {
    currentPage = page;

    // Masquer toutes les pages
    document.querySelectorAll('.page-content').forEach(p => {
        p.classList.add('hidden');
    });
    
    // Afficher la page sélectionnée
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    // Charger les données spécifiques à la page
    if (page === 'notes') {
        renderNotes();
        updateNotesCount();
    } else if (page === 'achievements') {
        renderAchievements();
        updateAchievementsCount();
    }
    
    // Mettre à jour la bottom nav + sidebar avec la couleur de la page
    const pageColors = {
        dashboard: '#06b6d4',
        peace: '#ec4899',
        notes: '#8b5cf6',
        achievements: '#fbbf24'
    };
    const color = pageColors[page] || 'var(--c-primary)';

    // Sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active', 'border');
        link.classList.add('text-slate-400');
        link.style.color = '';
        link.style.background = '';
        link.style.borderColor = '';
    });
    const activeLink = document.querySelector(`.sidebar-link[onclick="navigateTo('${page}')"]`);
    if (activeLink) {
        activeLink.classList.remove('text-slate-400');
        activeLink.classList.add('active', 'border');
        activeLink.style.color = color;
        activeLink.style.background = color + '18';
        activeLink.style.borderColor = color + '55';
    }

    // Bottom nav
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '';
    });
    const activeBnBtn = document.getElementById(`bn-${page}`);
    if (activeBnBtn) {
        activeBnBtn.classList.add('active');
        activeBnBtn.style.color = color;
    }
}

// ===== SAC D'APAISEMENT =====

function addPeaceFear() {
    const input = document.getElementById('peace-input');
    const typeEl = document.getElementById('peace-type-value');
    const type = typeEl ? typeEl.value : 'anxiety';
    const text = input.value.trim();
    
    if (!text) {
        alert('Veuillez écrire votre peur ou angoisse');
        return;
    }
    
    const fear = {
        id: Date.now(),
        text: text,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    peaceFears.push(fear);
    state.peaceFearAdded++;
    input.value = '';
    
    renderPeaceFears();
    updatePeaceBag();
    saveState();
    checkAchievements();
}

function togglePeaceTypeSelector() {
    const dropdown = document.getElementById('peace-type-dropdown');
    const btn = document.getElementById('peace-type-btn');
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
        renderPeaceTypeList();
        dropdown.classList.remove('hidden');
        
        // Position dropdown above button
        const rect = btn.getBoundingClientRect();
        
        document.addEventListener('click', closePeaceTypeDropdownOnClickOutside);
    } else {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closePeaceTypeDropdownOnClickOutside);
    }
}

function closePeaceTypeDropdownOnClickOutside(e) {
    const dropdown = document.getElementById('peace-type-dropdown');
    const btn = document.getElementById('peace-type-btn');
    
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closePeaceTypeDropdownOnClickOutside);
    }
}

function renderPeaceTypeList() {
    const typeList = document.getElementById('peace-type-list');
    const types = [
        { value: 'anxiety', label: 'Anxiété', icon: 'fa-heart', color: '#ec4899' },
        { value: 'fear', label: 'Peur', icon: 'fa-face-flushed', color: '#ef4444' },
        { value: 'stress', label: 'Stress', icon: 'fa-bolt', color: '#eab308' },
        { value: 'sadness', label: 'Tristesse', icon: 'fa-cloud-rain', color: '#a855f7' },
        { value: 'anger', label: 'Colère', icon: 'fa-fire', color: '#f97316' },
        { value: 'doubt', label: 'Doute', icon: 'fa-question', color: '#64748b' },
        { value: 'other', label: 'Autre', icon: 'fa-ellipsis', color: '#06b6d4' }
    ];
    
    typeList.innerHTML = types.map(type => `
        <button onclick="selectPeaceType('${type.value}', '${type.label}', '${type.icon}', '${type.color}')" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-800/50 transition-all text-left group">
            <div class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style="background: ${type.color}33;">
                <i class="fa-solid ${type.icon} text-xs" style="color: ${type.color};"></i>
            </div>
            <span class="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">${type.label}</span>
        </button>
    `).join('');
}

function selectPeaceType(value, label, icon, color) {
    document.getElementById('peace-type-value').value = value;
    document.getElementById('peace-type-name').textContent = label;
    document.getElementById('peace-type-icon').style.background = color + '33';
    document.getElementById('peace-type-icon').innerHTML = `<i class="fa-solid ${icon} text-xs" style="color: ${color};"></i>`;
    document.getElementById('peace-type-dropdown').classList.add('hidden');
}

function renderPeaceFears() {
    const container = document.getElementById('peace-list');
    container.innerHTML = '';
    
    peaceFears.forEach(fear => {
        const typeLabels = {
            'anxiety': 'Anxiété',
            'fear': 'Peur',
            'stress': 'Stress',
            'sadness': 'Tristesse',
            'anger': 'Colère',
            'doubt': 'Doute',
            'other': 'Autre'
        };
        
        const typeColors = {
            'anxiety': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            'fear': 'bg-red-500/10 text-red-400 border-red-500/30',
            'stress': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
            'sadness': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            'anger': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
            'doubt': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
            'other': 'bg-pink-500/10 text-pink-400 border-pink-500/30'
        };
        
        const div = document.createElement('div');
        div.className = 'glass p-3 rounded-xl border border-white/10 group hover:border-pink-500/30 transition-all';
        div.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-white truncate mb-1">${escapeHtml(fear.text)}</p>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${typeColors[fear.type]}">
                        ${typeLabels[fear.type]}
                    </span>
                </div>
                <button onclick="removePeaceFear(${fear.id})" class="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 hover:bg-red-500/10 rounded-lg lg:opacity-0 lg:group-hover:opacity-100">
                    <i class="fa-solid fa-trash-alt text-sm"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function removePeaceFear(id) {
    peaceFears = peaceFears.filter(f => f.id !== id);
    renderPeaceFears();
    updatePeaceBag();
}

// 'send' = afficher envoyer, cacher brûler
// 'burn' = cacher envoyer, afficher brûler
// 'empty' = envoyer désactivé, brûler caché
function setPeaceBtnState(mode) {
    const sendM = document.getElementById('peace-send-btn');
    const burnM = document.getElementById('peace-burn-btn');
    const sendD = document.getElementById('peace-send-btn-desktop');
    const burnD = document.getElementById('peace-burn-btn-desktop');

    if (mode === 'send') {
        [sendM, sendD].forEach(b => { if (b) { b.classList.remove('hidden'); b.disabled = false; } });
        [burnM, burnD].forEach(b => { if (b) b.classList.add('hidden'); });
    } else if (mode === 'burn') {
        [sendM, sendD].forEach(b => { if (b) b.classList.add('hidden'); });
        [burnM, burnD].forEach(b => { if (b) { b.classList.remove('hidden'); b.disabled = false; } });
    } else { // 'empty'
        [sendM, sendD].forEach(b => { if (b) { b.classList.remove('hidden'); b.disabled = true; } });
        [burnM, burnD].forEach(b => { if (b) b.classList.add('hidden'); });
    }
}

function updatePeaceBag() {
    const count = peaceFears.length;
    const countLabel = pluralize(count, 'peur', 'peurs');

    ['peace-count', 'peace-count-desktop'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${count} ${countLabel}`;
    });

    const cloudContainer = document.getElementById('peace-words-cloud');

    if (count === 0) {
        if (cloudContainer) cloudContainer.innerHTML = '';
        setPeaceBtnState('empty');
    } else {
        if (cloudContainer) {
            cloudContainer.innerHTML = peaceFears.map((fear, index) => {
                const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg'];
                const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
                const randomRotation = Math.random() * 20 - 10;
                const randomOpacity = 0.6 + Math.random() * 0.4;
                return `
                    <div class="peace-cloud-word ${randomSize} font-bold px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/40 to-rose-500/40 text-pink-200 border border-pink-500/50 whitespace-nowrap cursor-default transition-all hover:from-pink-500/60 hover:to-rose-500/60" 
                         style="transform: rotate(${randomRotation}deg); opacity: ${randomOpacity}; animation-delay: ${index * 0.05}s;">
                        ${escapeHtml(fear.text.substring(0, 20))}${fear.text.length > 20 ? '...' : ''}
                    </div>
                `;
            }).join('');
        }
        // Ne pas écraser l'état 'burn' si le sac est déjà en attente de brûlage
        const burnD = document.getElementById('peace-burn-btn-desktop');
        if (!burnD || burnD.classList.contains('hidden')) {
            setPeaceBtnState('send');
        }
    }
}

function sendFearsToSac() {
    if (peaceFears.length === 0) return;

    const isMobile = window.innerWidth < 1024;

    // Message dans les deux versions
    ['peace-message', 'peace-message-desktop'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<i class="fa-solid fa-heart text-pink-500 mr-2"></i>Vos peurs sont en sécurité...';
    });

    if (isMobile) {
        // --- MOBILE: ouvrir la modal d'animation ---
        const modal = document.getElementById('peace-anim-modal');
        const animCloud = document.getElementById('peace-anim-cloud');
        const animBag = document.getElementById('peace-anim-bag-container');
        const animMsg = document.getElementById('peace-anim-message');

        // Peupler le nuage dans la modal
        animCloud.innerHTML = peaceFears.map((fear, index) => {
            const sizes = ['text-xs', 'text-sm', 'text-base'];
            const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
            const randomRotation = Math.random() * 20 - 10;
            return `
                <div class="peace-cloud-word ${randomSize} font-bold px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/40 to-rose-500/40 text-pink-200 border border-pink-500/50 whitespace-nowrap"
                     style="transform: rotate(${randomRotation}deg); animation-delay: ${index * 0.05}s;">
                    ${escapeHtml(fear.text.substring(0, 20))}${fear.text.length > 20 ? '...' : ''}
                </div>
            `;
        }).join('');

        animMsg.textContent = '';
        animMsg.style.opacity = '0';

        // Afficher la modal
        modal.style.display = 'flex';
        requestAnimationFrame(() => { modal.style.opacity = '1'; });

        // Lancer l'animation après un court délai
        setTimeout(() => {
            const cloudWords = animCloud.querySelectorAll('.peace-cloud-word');
            const bagRect = animBag.getBoundingClientRect();
            const bagCenterX = bagRect.left + bagRect.width / 2;
            const bagCenterY = bagRect.top + bagRect.height / 2;

            cloudWords.forEach((word, index) => {
                setTimeout(() => {
                    const wordRect = word.getBoundingClientRect();
                    const deltaX = bagCenterX - (wordRect.left + wordRect.width / 2);
                    const deltaY = bagCenterY - (wordRect.top + wordRect.height / 2);
                    word.style.animation = `flyToBag 0.9s ease-in forwards`;
                    word.style.setProperty('--deltaX', deltaX + 'px');
                    word.style.setProperty('--deltaY', deltaY + 'px');
                }, index * 80);
            });

            const totalDuration = peaceFears.length * 80 + 900;

            setTimeout(() => {
                // Message de confirmation
                animMsg.textContent = '✨ Vos peurs sont en sécurité';
                animMsg.style.opacity = '1';

                // Basculer les boutons
                setPeaceBtnState('burn');

                // Fermer la modal après un délai
                setTimeout(() => {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.style.display = 'none';
                        animCloud.innerHTML = '';
                    }, 400);
                }, 1200);
            }, totalDuration);
        }, 200);

    } else {
        // --- DESKTOP: animation originale nuage → sac ---
        const bagContainer = document.getElementById('peace-bag-container');
        if (bagContainer) {
            const cloudWords = document.querySelectorAll('.peace-cloud-word');
            cloudWords.forEach((word, index) => {
                setTimeout(() => {
                    const bagRect = bagContainer.getBoundingClientRect();
                    const bagCenterX = bagRect.left + bagRect.width / 2;
                    const bagCenterY = bagRect.top + bagRect.height / 2;
                    const wordRect = word.getBoundingClientRect();
                    const deltaX = bagCenterX - (wordRect.left + wordRect.width / 2);
                    const deltaY = bagCenterY - (wordRect.top + wordRect.height / 2);
                    word.style.animation = `flyToBag 1s ease-in forwards`;
                    word.style.setProperty('--deltaX', deltaX + 'px');
                    word.style.setProperty('--deltaY', deltaY + 'px');
                }, index * 80);
            });
        }

        setTimeout(() => {
            const cloudContainer = document.getElementById('peace-words-cloud');
            if (cloudContainer) cloudContainer.innerHTML = '';
            const bagWords = document.getElementById('peace-bag-words');
            if (bagWords) bagWords.innerHTML = '';

            setPeaceBtnState('burn');
        }, peaceFears.length * 80 + 1000);
    }
}

function burnFears() {
    if (peaceFears.length === 0) return;

    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
        // --- MOBILE: ouvrir la modal pour l'animation de brûlage ---
        const modal = document.getElementById('peace-anim-modal');
        const animBag = document.getElementById('peace-anim-bag-container');
        const animBagImage = document.getElementById('peace-anim-bag-image');
        const animMsg = document.getElementById('peace-anim-message');
        const animCloud = document.getElementById('peace-anim-cloud');

        animCloud.innerHTML = '';
        animMsg.textContent = '';
        animMsg.style.opacity = '0';

        modal.style.display = 'flex';
        requestAnimationFrame(() => { modal.style.opacity = '1'; });

        setTimeout(() => {
            const bagRect = animBag.getBoundingClientRect();
            const bagCenterX = bagRect.left + bagRect.width / 2;
            const bagCenterY = bagRect.top + bagRect.height / 2;

            for (let wave = 0; wave < 3; wave++) {
                setTimeout(() => createFireParticlesFromPoint(bagCenterX, bagCenterY), wave * 300);
            }

            const flameOverlay = document.createElement('div');
            flameOverlay.className = 'absolute inset-0 flex items-center justify-center pointer-events-none';
            flameOverlay.innerHTML = `
                <div class="relative w-32 h-32 flex items-center justify-center">
                    <i class="fa-solid fa-fire text-6xl text-orange-500 absolute" style="animation: flameBurst 1.5s ease-out forwards;"></i>
                    <i class="fa-solid fa-fire text-5xl text-red-600 absolute" style="animation: flameBurst 1.5s ease-out 0.2s forwards;"></i>
                    <i class="fa-solid fa-fire text-4xl text-yellow-500 absolute" style="animation: flameBurst 1.5s ease-out 0.4s forwards;"></i>
                </div>
            `;
            animBag.appendChild(flameOverlay);

            if (animBagImage) setTimeout(() => { animBagImage.style.animation = 'burnBag 1s ease-out forwards'; }, 300);

            setTimeout(() => {
                state.peaceFearsBurned += peaceFears.length;
                peaceFears = [];
                updatePeaceBag();
                renderPeaceFears();

                if (animBagImage) {
                    animBagImage.style.animation = '';
                    animBagImage.style.opacity = '1';
                    animBagImage.style.transform = 'scale(1) rotate(0deg)';
                    animBagImage.style.animation = 'bagReappear 0.8s ease-out forwards';
                }

                // Réinitialiser les boutons
                setPeaceBtnState('empty');

                animMsg.textContent = '🌟 Vous êtes libéré !';
                animMsg.style.opacity = '1';

                flameOverlay.remove();
                saveState();
                checkAchievements();

                // Fermer la modal
                setTimeout(() => {
                    modal.style.opacity = '0';
                    setTimeout(() => { modal.style.display = 'none'; }, 400);
                }, 1400);
            }, 1500);
        }, 200);

    } else {
        // --- DESKTOP: animation originale ---
        const bagContainer = document.getElementById('peace-bag-container');
        const bagImage = document.getElementById('peace-bag-image-desktop');

        const bagRect = bagContainer.getBoundingClientRect();
        const bagCenterX = bagRect.left + bagRect.width / 2;
        const bagCenterY = bagRect.top + bagRect.height / 2;

        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => createFireParticlesFromPoint(bagCenterX, bagCenterY), wave * 300);
        }

        const flameOverlay = document.createElement('div');
        flameOverlay.className = 'absolute inset-0 flex items-center justify-center pointer-events-none';
        flameOverlay.innerHTML = `
            <div class="relative w-32 h-32 flex items-center justify-center">
                <i class="fa-solid fa-fire text-6xl text-orange-500 absolute animate-pulse" style="animation: flameBurst 1.5s ease-out forwards;"></i>
                <i class="fa-solid fa-fire text-5xl text-red-600 absolute animate-pulse" style="animation: flameBurst 1.5s ease-out 0.2s forwards;"></i>
                <i class="fa-solid fa-fire text-4xl text-yellow-500 absolute animate-pulse" style="animation: flameBurst 1.5s ease-out 0.4s forwards;"></i>
            </div>
        `;
        bagContainer.appendChild(flameOverlay);

        if (bagImage) setTimeout(() => { bagImage.style.animation = 'burnBag 1s ease-out forwards'; }, 300);

        setTimeout(() => {
            state.peaceFearsBurned += peaceFears.length;
            peaceFears = [];
            updatePeaceBag();
            renderPeaceFears();

            if (bagImage) {
                bagImage.style.animation = '';
                bagImage.style.opacity = '1';
                bagImage.style.transform = 'scale(1) rotate(0deg)';
                bagImage.style.animation = 'bagReappear 0.8s ease-out forwards';
            }

            setPeaceBtnState('empty');

            ['peace-message', 'peace-message-desktop'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = '<i class="fa-solid fa-fire text-orange-500 mr-2"></i>Vous êtes libéré! 🌟';
                    setTimeout(() => { el.innerHTML = ''; }, 3000);
                }
            });

            flameOverlay.remove();
            saveState();
            checkAchievements();
        }, 1500);
    }
}




function createFireParticles(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'fire-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 3 + Math.random() * 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 2;
        
        particle.style.setProperty('--vx', vx);
        particle.style.setProperty('--vy', vy);
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}

function createFireParticlesFromPoint(x, y) {
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'fire-particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const angle = (Math.PI * 2 * i) / 12;
        const velocity = 4 + Math.random() * 4;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 3;
        
        particle.style.setProperty('--vx', vx);
        particle.style.setProperty('--vy', vy);
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}


// ===== NOTES PERSONNELLES =====

function addNote() {
    const contentEl = document.getElementById('note-content');
    const content = contentEl.value.trim();
    
    if (!content) {
        alert('Veuillez écrire une note');
        return;
    }
    
    const note = {
        id: Date.now(),
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.notes.push(note);
    contentEl.value = '';
    
    renderNotes();
    updateNotesCount();
    saveState();
    checkAchievements();
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    container.innerHTML = '';
    
    if (state.notes.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400"><i class="fa-solid fa-inbox text-3xl mb-3 block opacity-50"></i><p class="text-sm">Aucune note pour le moment</p></div>';
        return;
    }
    
    const sortedNotes = [...state.notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    sortedNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'glass p-3 rounded-xl border border-white/10 group hover:border-purple-500/30 transition-all cursor-pointer';
        
        const updatedDate = new Date(note.updatedAt);
        const dateStr = updatedDate.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        div.innerHTML = `
            <div class="flex items-start justify-between gap-2 mb-1.5">
                <p class="text-sm text-white flex-1 leading-relaxed">${escapeHtml(note.content)}</p>
                <button onclick="deleteNote(${note.id})" class="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1.5 hover:bg-red-500/10 rounded-lg lg:opacity-0 lg:group-hover:opacity-100">
                    <i class="fa-solid fa-trash-alt text-xs"></i>
                </button>
            </div>
            <div class="text-[10px] text-slate-500 flex items-center gap-1.5">
                <i class="fa-solid fa-clock"></i>
                <span>${dateStr}</span>
                <span class="text-slate-600 ml-1">— appuyer pour modifier</span>
            </div>
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('button')) editNote(note.id);
        });
        
        container.appendChild(div);
    });
}

let _editingNoteId = null;

function editNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;
    _editingNoteId = id;
    const textarea = document.getElementById('note-edit-content');
    if (textarea) textarea.value = note.content;
    openModal('modal-note-edit');
    setTimeout(() => { if (textarea) { textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); } }, 100);
}

function saveNoteEdit() {
    const note = state.notes.find(n => n.id === _editingNoteId);
    if (!note) return;
    const textarea = document.getElementById('note-edit-content');
    const newContent = textarea ? textarea.value.trim() : '';
    if (newContent) {
        note.content = newContent;
        note.updatedAt = new Date().toISOString();
        renderNotes();
        saveState();
    }
    closeModal('modal-note-edit');
    _editingNoteId = null;
}

function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    renderNotes();
    updateNotesCount();
    saveState();
}

function updateNotesCount() {
    const count = state.notes.length;
    const countLabel = pluralize(count, 'note', 'notes');
    const text = `${count} ${countLabel}`;
    ['notes-count', 'notes-count-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    });
}


// ===== ACHIEVEMENTS =====

async function loadAchievements() {
    try {
        const response = await fetch('achievements.json');
        const data = await response.json();
        achievements = data.achievements;
        checkAchievements();
    } catch (error) {
        console.error('Erreur lors du chargement des achievements:', error);
    }
}

function checkAchievements() {
    achievements.forEach(achievement => {
        // Vérifier si l'achievement est déjà débloqué
        if (state.unlockedAchievements.includes(achievement.id)) {
            return;
        }
        
        // Vérifier les conditions
        let isUnlocked = false;
        
        switch (achievement.condition.type) {
            case 'quests_created':
                isUnlocked = state.questsCreated >= achievement.condition.value;
                break;
            case 'quests_completed':
                isUnlocked = state.questsCompleted >= achievement.condition.value;
                break;
            case 'dailies_created':
                isUnlocked = state.dailiesCreated >= achievement.condition.value;
                break;
            case 'streak':
                isUnlocked = state.streak >= achievement.condition.value;
                break;
            case 'peace_fears_added':
                isUnlocked = state.peaceFearAdded >= achievement.condition.value;
                break;
            case 'notes_created':
                isUnlocked = state.notes.length >= achievement.condition.value;
                break;
            case 'rebirths':
                isUnlocked = state.rebirths >= achievement.condition.value;
                break;
            case 'daily_completions':
                isUnlocked = (state.dailyCompletions || 0) >= achievement.condition.value;
                break;
            case 'all_achievements':
                // Vérifier si tous les autres achievements sont débloqués
                const otherAchievements = achievements.filter(a => a.id !== achievement.id);
                isUnlocked = otherAchievements.every(a => state.unlockedAchievements.includes(a.id));
                break;
        }
        
        if (isUnlocked) {
            unlockAchievement(achievement);
        }
    });
}

function unlockAchievement(achievement) {
    state.unlockedAchievements.push(achievement.id);
    saveState();
    
    // Afficher une notification
    showAchievementNotification(achievement);
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-4 glass p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 z-50 animate-bounce max-w-sm';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style="background: ${achievement.color}33;">
                <i class="fa-solid ${achievement.icon} text-lg" style="color: ${achievement.color};"></i>
            </div>
            <div>
                <p class="font-bold text-white text-sm">🏆 ${achievement.name}</p>
                <p class="text-xs text-slate-300">${achievement.description}</p>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function renderAchievements() {
    const container = document.getElementById('achievements-list');
    if (!container) return;

    container.innerHTML = '';

    if (achievements.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400"><p class="text-sm">Chargement des achievements...</p></div>';
        return;
    }

    achievements.forEach(achievement => {
        const isUnlocked = state.unlockedAchievements.includes(achievement.id);
        const shouldObscure = achievement.obscuration && !isUnlocked;
        const displayDescription = shouldObscure ? '????' : achievement.description;

        // Icône de difficulté évolutive
        const difficultyIcons = {
            1: { icon: 'fa-leaf', color: '#10b981' },
            2: { icon: 'fa-fire', color: '#f97316' },
            3: { icon: 'fa-bolt', color: '#eab308' },
            4: { icon: 'fa-skull', color: '#ef4444' },
            5: { icon: 'fa-crown', color: '#a855f7' }
        };
        
        const diffIcon = difficultyIcons[achievement.difficulty] || difficultyIcons[1];

        const div = document.createElement('div');
        div.className = `glass p-4 rounded-xl border transition-all ${isUnlocked ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10 opacity-50'}`;

        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style="background: ${isUnlocked ? achievement.color + '33' : 'rgba(30,41,59,0.6)'};">
                    <i class="fa-solid ${isUnlocked ? achievement.icon : 'fa-lock'} text-lg" style="color: ${isUnlocked ? achievement.color : '#475569'};"></i>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid ${diffIcon.icon} text-xs" style="color: ${diffIcon.color};"></i>
                        <h3 class="text-sm font-bold text-white">${achievement.name}</h3>
                    </div>
                    <p class="text-xs text-slate-400">${displayDescription}</p>
                </div>
                ${isUnlocked ? '<i class="fa-solid fa-check text-yellow-500 text-lg flex-shrink-0"></i>' : ''}
            </div>
        `;

        container.appendChild(div);
    });
}



function updateAchievementsCount() {
    const count = state.unlockedAchievements.length;
    const countLabel = pluralize(count, 'succès obtenu', 'succès obtenus');
    const countEl = document.getElementById('achievements-count');
    if (countEl) {
        countEl.textContent = `${count} ${countLabel}`;
    }
}
