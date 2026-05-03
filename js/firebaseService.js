/**
 * ElectIQ: VoteSaathi - Firebase Realtime Database Service
 * Handles anonymous progress tracking, real-time metrics, and feedback.
 */

const firebaseService = {
    db: null,
    uid: null,

    async init() {
        if (!window.CONFIG || !window.CONFIG.FIREBASE_CONFIG || window.CONFIG.FIREBASE_CONFIG.apiKey.includes('YOUR_')) {
            console.log("Firebase config missing or incomplete. RTDB disabled.");
            return;
        }

        try {
            const app = window.FIREBASE.initializeApp(window.CONFIG.FIREBASE_CONFIG);
            this.db = window.FIREBASE.getDatabase(app);
            this.uid = this.getUserId();
            
            // Initial visit increment
            this.incrementMetric('visits');
            
            // Start real-time listener for the dashboard
            this.listenToMetrics((data) => this.updateMetricsUI(data));
            
            console.log("Firebase RTDB Service Initialized (Anonymous Mode)");
        } catch (e) {
            console.error("Firebase RTDB init failed:", e);
        }
    },

    getUserId() {
        let uid = localStorage.getItem("votesaathi_uid");
        if (!uid) {
            uid = "user_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
            localStorage.setItem("votesaathi_uid", uid);
        }
        return uid;
    },

    incrementMetric(type) {
        if (!this.db) return;
        const metricRef = window.FIREBASE.ref(this.db, 'metrics/' + type);
        
        // Use increment function for atomic updates
        window.FIREBASE.set(metricRef, window.FIREBASE.increment(1)).catch(err => {
            console.error("Metric increment failed:", err);
        });
    },

    saveUserProgress(data = {}) {
        if (!this.db || !this.uid) return;
        
        const userRef = window.FIREBASE.ref(this.db, 'users/' + this.uid);
        
        // Merge with local data if not provided
        const progress = {
            quizScore: window.loadProgress ? window.loadProgress('quizScore', 0) : 0,
            modulesVisited: window.loadProgress ? window.loadProgress('visitedModules', []) : [],
            lastActivity: Date.now(),
            ...data
        };

        window.FIREBASE.update(userRef, progress).catch(err => {
            console.error("Progress save failed:", err);
        });
    },

    saveQuizResult(score) {
        if (!this.db || !this.uid) return;
        const quizRef = window.FIREBASE.ref(this.db, 'users/' + this.uid + '/quiz');
        
        window.FIREBASE.set(quizRef, {
            score: score,
            timestamp: Date.now()
        }).then(() => {
            this.incrementMetric("quizAttempts");
            this.saveUserProgress({ quizScore: score });
        }).catch(err => {
            console.error("Quiz result save failed:", err);
        });
    },

    markSimulationComplete() {
        if (!this.db || !this.uid) return;
        const simRef = window.FIREBASE.ref(this.db, 'users/' + this.uid + '/simulation');
        
        window.FIREBASE.set(simRef, {
            completed: true,
            timestamp: Date.now()
        }).then(() => {
            this.incrementMetric("simulations");
            this.saveUserProgress();
        }).catch(err => {
            console.error("Simulation mark failed:", err);
        });
    },

    submitFeedback(helpful, comment = "") {
        if (!this.db) return;

        const feedbackRef = window.FIREBASE.ref(this.db, 'feedback');
        const newFeedbackRef = window.FIREBASE.push(feedbackRef);
        
        return window.FIREBASE.set(newFeedbackRef, {
            type: helpful ? 'positive' : 'negative',
            comment: comment.substring(0, 500),
            userId: this.uid,
            timestamp: Date.now()
        }).then(() => {
            // Update aggregate stats
            const statsRef = window.FIREBASE.ref(this.db, 'metrics/feedback_total');
            window.FIREBASE.set(statsRef, window.FIREBASE.increment(1));
            return true;
        }).catch(err => {
            console.error("Feedback submission failed:", err);
            return false;
        });
    },

    listenToMetrics(callback) {
        if (!this.db) return;
        const metricsRef = window.FIREBASE.ref(this.db, 'metrics');
        window.FIREBASE.onValue(metricsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },

    updateMetricsUI(data) {
        const visitEl = document.getElementById('active-users-count');
        const quizEl = document.getElementById('total-quizzes-count');
        const simEl = document.getElementById('total-sims-count');

        if (visitEl) visitEl.textContent = data.visits || 0;
        if (quizEl) quizEl.textContent = data.quizAttempts || data.quizzes || 0;
        if (simEl) simEl.textContent = data.simulations || 0;
        
        const avgScoreEl = document.getElementById('avg-engagement-stats');
        if (avgScoreEl && data.visits > 0) {
            const quizAttempts = data.quizAttempts || data.quizzes || 0;
            const engagement = (((quizAttempts + (data.simulations || 0)) / data.visits) * 100).toFixed(1);
            avgScoreEl.textContent = `${engagement}%`;
        }
    }
};

window.firebaseService = firebaseService;
