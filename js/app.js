// Main App Logic

// DOM Elements
const sidebar = document.getElementById('sidebar');
const mobileMenuOpenBtn = document.getElementById('mobile-menu-open');
const mobileMenuCloseBtn = document.getElementById('mobile-menu-close');
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');
const currentViewTitle = document.getElementById('current-view-title');
const themeToggle = document.getElementById('theme-toggle');
const ttsBtn = document.getElementById('tts-toggle');
const authBtn = document.getElementById('auth-btn');

// Global Metrics
window.METRICS = { apiCalls: 0, cacheHits: 0, totalAiLatency: 0, aiCallCount: 0 };

let currentUser = null;

// Initialize App
function initApp() {
    setupRouting();
    setupMobileMenu();
    setupPreferences();
    setupTTS();
    setupMetricsToggle();
    setupFirebase();
    
    // Check hash on load
    handleRoute();
}

// Routing Logic
function setupRouting() {
    window.addEventListener('hashchange', handleRoute);
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });
}

function handleRoute() {
    let hash = window.location.hash || '#home';
    const viewId = hash.substring(1); // remove '#'
    
    // Validate view exists
    const targetView = document.getElementById(`view-${viewId}`);
    if (!targetView) {
        window.location.hash = '#home';
        return;
    }

    // Update Nav
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === hash) {
            item.classList.add('active');
            // Clean up title (remove icons/svgs)
            currentViewTitle.textContent = item.textContent.trim().replace(/^[^\w\s]+/, '');
        }
    });

    // Update Views
    viewSections.forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    
    targetView.classList.remove('hidden');
    // Add active with a slight delay to trigger CSS animations properly
    setTimeout(() => {
        targetView.classList.add('active');
    }, 10);

    // Update Progress Journey
    updateJourneyProgress(viewId);

    // Feature specific initializations
    if (viewId === 'news' && window.fetchNews) {
        window.fetchNews();
    }
}

function updateJourneyProgress(currentView) {
    let visited = window.loadProgress('visitedModules', []);
    if (!visited.includes(currentView)) {
        visited.push(currentView);
        window.saveProgress('visitedModules', visited);
    }
    
    const totalCoreModules = 6; // home, map, coach, simulation, timeline, news
    const coreVisited = visited.filter(v => ['home', 'map', 'coach', 'simulation', 'timeline', 'news'].includes(v)).length;
    const quizScore = window.loadProgress('quizScore', 0);
    
    // Progress calculation logic
    let percentage = (coreVisited / totalCoreModules) * 70;
    if (quizScore > 0) percentage += (quizScore / 5) * 30; // Max 30% from quiz
    
    percentage = Math.min(Math.round(percentage), 100);
    
    const journeyBar = document.getElementById('journey-bar');
    const journeyText = document.getElementById('journey-text');
    if (journeyBar && journeyText) {
        journeyBar.style.width = `${percentage}%`;
        journeyText.textContent = `${percentage}% Ready`;
    }

    // Sync to backend anonymously
    if (window.firebaseService) {
        window.firebaseService.saveUserProgress();
    }
}

// Mobile Menu
function setupMobileMenu() {
    if (mobileMenuOpenBtn) {
        mobileMenuOpenBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    if (mobileMenuCloseBtn) {
        mobileMenuCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
}

// Preferences (Theme & Accessibility)
function setupPreferences() {
    // Load saved prefs
    const savedTheme = window.loadProgress('theme', 'light');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.checked = true;
    }

    // Listeners
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', theme);
            window.saveProgress('theme', theme);
        });
    }
}

// TTS
function setupTTS() {
    if (ttsBtn) {
        ttsBtn.addEventListener('click', () => window.toggleTTS());
    }
}

// Dev Metrics
function setupMetricsToggle() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'm') {
            const panel = document.getElementById('dev-metrics-panel');
            if (panel) panel.classList.toggle('hidden');
        }
    });
    
    // Auto update metrics UI periodically
    setInterval(() => {
        const pApi = document.getElementById('metric-api');
        const pCache = document.getElementById('metric-cache');
        const pLat = document.getElementById('metric-latency');
        
        if (pApi) pApi.textContent = window.METRICS.apiCalls;
        if (pCache) pCache.textContent = window.METRICS.cacheHits;
        if (pLat) {
            const avg = window.METRICS.aiCallCount > 0 ? (window.METRICS.totalAiLatency / window.METRICS.aiCallCount) : 0;
            pLat.textContent = Math.round(avg);
        }
    }, 1000);
}

// Firebase Integration (New Anonymous Firestore Service)
function setupFirebase() {
    if (!window.FIREBASE || !window.firebaseService) {
        setTimeout(setupFirebase, 100);
        return;
    }
    window.firebaseService.init();
    setupFeedbackListeners();
}

function setupFeedbackListeners() {
    const feedbackBtns = document.querySelectorAll('.feedback-btn');
    const feedbackSuccess = document.getElementById('feedback-success');

    feedbackBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const helpful = btn.getAttribute('data-helpful') === 'true';
            const success = await window.firebaseService.submitFeedback(helpful);
            if (success) {
                feedbackSuccess.classList.remove('hidden');
                // Disable buttons after submission
                feedbackBtns.forEach(b => b.disabled = true);
            }
        });
    });
}



// Run on load
document.addEventListener('DOMContentLoaded', initApp);
