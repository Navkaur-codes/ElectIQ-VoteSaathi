/**
 * ElectIQ: VoteSaathi - Live Civic Updates Module
 * Handles real-time election news fetching, filtering, and rendering.
 */

let newsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const mockNews = [
    {
        title: "Election Commission Announces New Voter Awareness Campaign",
        source: "Civic Times",
        description: "The ECI has launched a nationwide initiative to increase voter turnout in rural areas ahead of the upcoming phases.",
        url: "#",
        publishedAt: new Date().toISOString(),
        category: "Awareness"
    },
    {
        title: "Understanding Your Voting Rights: A Comprehensive Guide",
        source: "Education Portal",
        description: "Learn about the constitutional protections for every voter and how to ensure your vote counts.",
        url: "#",
        publishedAt: new Date().toISOString(),
        category: "Education"
    },
    {
        title: "New Security Measures for EVMs Implemented",
        source: "Government News",
        description: "Enhanced multi-layer security protocols have been established for the safe storage of Electronic Voting Machines.",
        url: "#",
        publishedAt: new Date().toISOString(),
        category: "Policy"
    }
];

async function fetchNews(forceRefresh = false) {
    const newsContainer = document.getElementById('news-list');
    if (!newsContainer) return;

    // Use cache if available and not expired
    const now = Date.now();
    if (!forceRefresh && newsCache && (now - lastFetchTime < CACHE_DURATION)) {
        renderNewsCards(newsCache);
        return;
    }

    renderLoadingSkeleton();

    try {
        let articles = [];
        if (window.CONFIG.USE_MOCK_NEWS) {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
            articles = mockNews;
        } else {
            // Updated: Using local backend proxy to resolve CORS issues permanently
            const url = '/api/news';
            
            console.log("Fetching news from proxy:", url);
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("GNews API Error:", errorData);
                throw new Error(errorData.errors ? errorData.errors[0] : "API Failure");
            }
            const data = await response.json();
            console.log("News Data Received:", data);
            articles = data.articles || [];
        }

        const filteredNews = filterElectionNews(articles);
        newsCache = filteredNews;
        lastFetchTime = Date.now();
        renderNewsCards(filteredNews);
        
        if (window.METRICS) window.METRICS.apiCalls++;
    } catch (error) {
        console.error("News Fetch Error:", error);
        newsContainer.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--error); opacity: 0.5;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Unable to load live updates. Please try again later.</p>
                <button class="btn btn-outline btn-sm mt-3" onclick="fetchNews(true)">Retry</button>
            </div>
        `;
    }
}

function filterElectionNews(articles) {
    if (!articles) return [];
    
    // Keywords for categorization and filtering
    const awarenessKeywords = ['awareness', 'campaign', 'education', 'how to', 'guide', 'youth'];
    const policyKeywords = ['commission', 'law', 'security', 'government', 'supreme court', 'order'];
    
    const quizScore = typeof window.loadProgress === 'function' ? window.loadProgress('quizScore', 0) : 0;

    let processedArticles = articles.map(art => {
        const text = (art.title + " " + (art.description || "")).toLowerCase();
        
        // Categorize
        let category = "Election";
        if (awarenessKeywords.some(k => text.includes(k))) category = "Awareness";
        else if (policyKeywords.some(k => text.includes(k))) category = "Policy";
        
        return {
            ...art,
            category: category,
            relevanceScore: awarenessKeywords.some(k => text.includes(k)) ? 2 : 1
        };
    });

    // Smart Filtering: If low score, prioritize educational/awareness content
    if (quizScore < 3) {
        processedArticles.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return processedArticles;
}

function renderNewsCards(articles) {
    const newsContainer = document.getElementById('news-list');
    if (!newsContainer) return;
    
    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"></path><line x1="18" y1="14" x2="6" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line><line x1="6" y1="10" x2="6" y2="6"></line><line x1="10" y1="6" x2="18" y2="6"></line><line x1="10" y1="10" x2="18" y2="10"></line></svg>
                <p>No election news found at the moment. Check back soon!</p>
            </div>
        `;
        return;
    }

    newsContainer.innerHTML = '';
    
    articles.forEach(article => {
        const date = new Date(article.publishedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'card news-card glass-panel';
        
        // Sanitize content
        const title = window.utils ? window.utils.escapeHTML(article.title) : article.title;
        const desc = window.utils ? window.utils.escapeHTML(article.description || "") : (article.description || "");
        const source = window.utils ? window.utils.escapeHTML(article.source.name || article.source) : (article.source.name || article.source);

        card.innerHTML = `
            <div class="news-badge">${article.category}</div>
            <div class="news-content">
                <span class="news-source">${source} • ${date}</span>
                <h4>${title}</h4>
                <p>${desc}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-link">Read Full Article →</a>
            </div>
        `;
        newsContainer.appendChild(card);
    });
}

function renderLoadingSkeleton() {
    const newsContainer = document.getElementById('news-list');
    if (!newsContainer) return;

    newsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'card news-card glass-panel skeleton-loader';
        skeleton.innerHTML = `
            <div style="height: 20px; width: 60px; background: rgba(0,0,0,0.05); margin-bottom: 1rem; border-radius: 4px;"></div>
            <div style="height: 24px; width: 80%; background: rgba(0,0,0,0.05); margin-bottom: 0.5rem; border-radius: 4px;"></div>
            <div style="height: 16px; width: 100%; background: rgba(0,0,0,0.03); margin-bottom: 0.5rem; border-radius: 4px;"></div>
            <div style="height: 16px; width: 60%; background: rgba(0,0,0,0.03); border-radius: 4px;"></div>
        `;
        newsContainer.appendChild(skeleton);
    }
}

// Global exposure
window.fetchNews = fetchNews;
