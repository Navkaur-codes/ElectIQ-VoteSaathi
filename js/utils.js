// Shared utility functions

// Text-to-Speech (Web Speech API)
let synth = window.speechSynthesis;
let isSpeaking = false;

window.toggleTTS = function(text = null) {
    const ttsBtn = document.getElementById('tts-toggle');
    
    if (isSpeaking) {
        synth.cancel();
        isSpeaking = false;
        if(ttsBtn) {
            ttsBtn.classList.remove('btn-primary');
            ttsBtn.classList.add('btn-outline');
        }
        return;
    }

    if (!text) {
        // If no specific text, read the current visible view's main content
        const activeView = document.querySelector('.view-section.active');
        if (activeView) {
            text = activeView.innerText || activeView.textContent;
        }
    }

    if (text && synth) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to set a good voice (English)
        const voices = synth.getVoices();
        const enVoice = voices.find(voice => voice.lang.includes('en'));
        if (enVoice) utterance.voice = enVoice;

        utterance.onend = () => {
            isSpeaking = false;
            if(ttsBtn) {
                ttsBtn.classList.remove('btn-primary');
                ttsBtn.classList.add('btn-outline');
            }
        };

        synth.speak(utterance);
        isSpeaking = true;
        if(ttsBtn) {
            ttsBtn.classList.remove('btn-outline');
            ttsBtn.classList.add('btn-primary');
        }
    }
};

// Local Storage Wrappers
window.saveProgress = function(key, value) {
    try {
        localStorage.setItem(`civicsense_${key}`, JSON.stringify(value));
    } catch (e) {
        console.error('Error saving to localStorage', e);
    }
};

window.loadProgress = function(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(`civicsense_${key}`);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error loading from localStorage', e);
        return defaultValue;
    }
};

/**
 * Sanitize Input to prevent XSS and script injection
 * Removes < > and script tags
 */
window.sanitizeInput = function(input) {
    if (!input) return '';
    return input
        .replace(/[<>]/g, "") // Remove potential HTML tags
        .replace(/script/gi, "") // Remove script word
        .trim();
};

/**
 * Robust HTML Escaping
 */
window.escapeHTML = function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/**
 * Rate limiting utility (Debounce)
 */
window.debounce = function(func, wait = 500) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
