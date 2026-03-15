/**
 * Système d'animations pour la gamification
 */

// Créer des particules de pièces qui flottent
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

// Animer l'incrémentation d'un nombre
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

// Créer des confettis
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

// Célébrer une complétion
function celebrateCompletion(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('celebrate');
        setTimeout(() => element.classList.remove('celebrate'), 600);
    }
    
    createConfetti();
}
