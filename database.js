/**
 * Gestionnaire de base de données localStorage
 * Gère la persistance des données avec versioning et migrations
 * 
 * IMPORTANT: Cette application est client-only. Les données sont stockées localement.
 * Pour une sécurité maximale sur GitHub Pages:
 * - Les données ne quittent jamais le navigateur de l'utilisateur
 * - Chaque utilisateur a ses propres données isolées
 * - Aucune donnée n'est envoyée à un serveur
 */

const DB = {
    VERSION: '1.2',
    STORAGE_KEY: 'task_manager',
    MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB max
    
    // Structure par défaut de la base de données
    getDefaultState() {
        return {
            version: this.VERSION,
            xp: 0,
            coins: 0,
            ascensionPoints: 0,
            rebirths: 0,
            activeCat: 'Toutes',
            streak: 0,
            streakLastDate: null,
            streakRequirement: 3,
            notes: [],
            unlockedAchievements: [],
            questsCreated: 0,
            questsCompleted: 0,
            dailiesCreated: 0,
            peaceFearsBurned: 0,
            peaceFearAdded: 0,
            dailyCompletions: 0,
            categories: [
                { id: 1, name: 'Général', icon: 'fa-tag', color: '#06b6d4' },
                { id: 2, name: 'Santé', icon: 'fa-heart', color: '#ec4899' },
                { id: 3, name: 'Travail', icon: 'fa-briefcase', color: '#10b981' }
            ],
            quests: [],
            dailies: [],
            lastLoginDate: "",
            dailyBonusClaimed: false,
            dailyBonusClaimedAt: null,
            lastAscensionPurchase: null,
            chronosEvents: [],
            activeEventType: 'all',
            forge: {},
            eventTypes: [
                { id: 1, name: 'Général',      icon: 'fa-tag',            color: '#06b6d4' },
                { id: 2, name: 'Anniversaire', icon: 'fa-cake-candles',   color: '#ec4899' },
                { id: 3, name: 'Rendez-vous',  icon: 'fa-stethoscope',    color: '#10b981' },
                { id: 4, name: 'Réunion',      icon: 'fa-briefcase',      color: '#f59e0b' },
                { id: 5, name: 'Voyage',       icon: 'fa-plane',          color: '#8b5cf6' },
                { id: 6, name: 'Deadline',     icon: 'fa-clock',          color: '#ef4444' },
                { id: 7, name: 'Célébration',  icon: 'fa-champagne-glasses', color: '#f97316' },
                { id: 8, name: 'Sport',        icon: 'fa-dumbbell',       color: '#14b8a6' },
            ],
            chronosEventsCreated: 0,
            chronosEventsCompleted: 0,
            forgeBuilds: 0,
            forgeMaxLevel: 0,
            totalCoinsEarned: 0
        };
    },

    // Valider l'intégrité des données
    validateState(state) {
        if (!state || typeof state !== 'object') return false;
        if (typeof state.xp !== 'number' || state.xp < 0) return false;
        if (typeof state.coins !== 'number' || state.coins < 0) return false;
        if (typeof state.ascensionPoints !== 'number' || state.ascensionPoints < 0) return false;
        if (typeof state.rebirths !== 'number' || state.rebirths < 0) return false;
        if (!Array.isArray(state.categories)) return false;
        if (!Array.isArray(state.quests)) return false;
        if (!Array.isArray(state.dailies)) return false;
        return true;
    },

    // Sauvegarder l'état dans localStorage
    save(state) {
        try {
            // Valider avant de sauvegarder
            if (!this.validateState(state)) {
                console.error('État invalide - sauvegarde refusée');
                return false;
            }

            const data = JSON.stringify(state);
            
            // Vérifier la taille
            if (data.length > this.MAX_STORAGE_SIZE) {
                console.error('Données trop volumineuses');
                return false;
            }

            // Encodage base64 (note: ce n'est PAS du chiffrement, juste de l'obfuscation)
            const encoded = btoa(unescape(encodeURIComponent(data)));
            localStorage.setItem(this.STORAGE_KEY, encoded);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    },

    // Charger l'état depuis localStorage
    load() {
        try {
            const encoded = localStorage.getItem(this.STORAGE_KEY);
            if (!encoded) {
                return this.getDefaultState();
            }
            
            const data = decodeURIComponent(escape(atob(encoded)));
            const state = JSON.parse(data);
            
            // Valider les données chargées
            if (!this.validateState(state)) {
                console.warn('Données corrompues - réinitialisation');
                return this.getDefaultState();
            }
            
            // Migration si nécessaire
            return this.migrate(state);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return this.getDefaultState();
        }
    },

    // Système de migration pour les futures versions
    migrate(state) {
        const defaultState = this.getDefaultState();
        
        // Fusionner avec les valeurs par défaut pour les nouvelles propriétés
        const migratedState = { ...defaultState, ...state };
        
        // S'assurer que les catégories par défaut existent
        if (!migratedState.categories || migratedState.categories.length === 0) {
            migratedState.categories = defaultState.categories;
        }

        // S'assurer que les types d'événements par défaut existent
        if (!migratedState.eventTypes || migratedState.eventTypes.length === 0) {
            migratedState.eventTypes = defaultState.eventTypes;
        }
        
        // Nettoyer les données invalides
        migratedState.quests = (migratedState.quests || []).filter(q => 
            q && typeof q === 'object' && q.id && q.text && q.cat
        );
        
        migratedState.dailies = (migratedState.dailies || []).filter(d => 
            d && typeof d === 'object' && d.id && d.text && d.cat
        );
        
        // Mettre à jour la version
        migratedState.version = this.VERSION;
        
        return migratedState;
    },

    // Exporter les données (pour backup)
    export(state) {
        try {
            const dataStr = JSON.stringify(state, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hero_os_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
        }
    },

    // Importer les données (depuis backup)
    import(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target.result);
                
                // Valider avant d'importer
                if (!this.validateState(state)) {
                    callback(null, new Error('Fichier invalide'));
                    return;
                }
                
                const migratedState = this.migrate(state);
                callback(migratedState, null);
            } catch (error) {
                callback(null, error);
            }
        };
        reader.readAsText(file);
    },

    // Réinitialiser toutes les données
    reset() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return this.getDefaultState();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            return this.getDefaultState();
        }
    }
};
