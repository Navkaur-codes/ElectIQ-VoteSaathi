// Configuration file for API keys and global constants

window.CONFIG = {
    // Replace these with actual API keys for full functionality
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
    NEWS_API_KEY: '7d592bdb6032ed122b17334b703a0f91',

    // Feature flags to use mock data if API keys are not provided
    USE_MOCK_AI: true,
    USE_MOCK_NEWS: true,

    // Firebase Config (Realtime Database)
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCAuWVC-a-rgAlHhmJZ8NbX0XJ-4vDoFIU",
        authDomain: "electiq-votesaathi.firebaseapp.com",
        databaseURL: "https://electiq-votesaathi-default-rtdb.firebaseio.com",
        projectId: "electiq-votesaathi",
        storageBucket: "electiq-votesaathi.firebasestorage.app",
        messagingSenderId: "972870468035",
        appId: "1:972870468035:web:fc45cd57d31838ea477d76"
    }
};

// Check if keys are provided to disable mock mode
if (window.CONFIG.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    window.CONFIG.USE_MOCK_AI = false;
}
if (window.CONFIG.NEWS_API_KEY && window.CONFIG.NEWS_API_KEY !== 'YOUR_NEWS_API_KEY_HERE' && window.CONFIG.NEWS_API_KEY !== '') {
    window.CONFIG.USE_MOCK_NEWS = false;
}
