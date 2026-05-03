// AI Civic Coach Module

function initCoach() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const personaSelect = document.getElementById('user-persona');
    const voiceBtn = document.getElementById('voice-input-btn');
    const suggestionBanner = document.getElementById('ai-suggestion-banner');

    let isWaitingForResponse = false;
    let repeatCount = 0;

    // Mock responses for development
    const mockResponses = {
        'general': "That's a great question about general voting! Remember, every vote counts. Make sure you check your name on the electoral roll.",
        'first-time': "Welcome to the democratic process! As a first-time voter, you'll need your Voter ID (EPIC) and to find your polling booth. Don't worry, it's very simple.",
        'student': "As a student, if you study in a different city, you can register as a voter at your current address. Voting is a powerful way to shape your future.",
        'rural': "Voting in your village/panchayat is your right. Local authorities provide facilities to ensure everyone can vote easily."
    };

    if (!chatInput || !sendBtn) return;

    const debouncedSend = window.debounce(() => handleSendMessage(), 500);

    sendBtn.addEventListener('click', debouncedSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') debouncedSend();
    });

    // Voice Input Setup
    if (voiceBtn && 'webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        voiceBtn.addEventListener('click', () => {
            voiceBtn.style.color = 'red';
            recognition.start();
        });

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            chatInput.value = transcript;
            voiceBtn.style.color = 'var(--primary-color)';
            debouncedSend();
        };

        recognition.onerror = () => {
            voiceBtn.style.color = 'var(--primary-color)';
        };
    }

    // Adaptive UI Setup
    const quizScore = window.loadProgress('quizScore', -1);
    if (quizScore > -1 && quizScore < 3 && suggestionBanner) {
        suggestionBanner.classList.remove('hidden');
    }

    async function handleSendMessage() {
        let message = chatInput.value.trim();
        message = window.sanitizeInput(message); // Strict sanitization
        if (!message || isWaitingForResponse) return;

        // Add User Message
        addMessageToChat(message, 'user');
        chatInput.value = '';

        // Fail-safe UI
        isWaitingForResponse = true;
        chatInput.disabled = true;
        sendBtn.disabled = true;

        // Add Loading Indicator
        const loadingId = 'loading-' + Date.now();
        addMessageToChat('Typing...', 'ai', loadingId);

        const persona = personaSelect ? personaSelect.value : 'general';
        const startTime = Date.now();

        try {
            let aiResponse = "";

            if (window.CONFIG.USE_MOCK_AI) {
                // Use Fallback/Mock system
                await new Promise(resolve => setTimeout(resolve, 800));
                aiResponse = getFallbackResponse(message, persona) + " (Offline Mode)";
            } else {
                // Actual Gemini API Call
                try {
                    aiResponse = await callGeminiAPI(message, persona);
                } catch (apiError) {
                    console.warn("Gemini API failed, using fallback:", apiError);
                    aiResponse = getFallbackResponse(message, persona) + " ⚠️ (Offline Mode: Showing basic guidance)";
                }
            }

            // Replace loading with actual response
            removeMessage(loadingId);
            addMessageToChat(aiResponse, 'ai');

            // Metrics update
            if (window.METRICS) {
                window.METRICS.apiCalls++;
                window.METRICS.aiCallCount++;
                window.METRICS.totalAiLatency += (Date.now() - startTime);
            }
        } catch (error) {
            console.error("AI System Error:", error);
            removeMessage(loadingId);
            addMessageToChat("I'm having trouble thinking right now. You can explore the Timeline or Simulation while I recover!", 'ai');
        } finally {
            isWaitingForResponse = false;
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    /**
     * Fallback Response Logic
     * Matches user keywords to predefined high-quality answers.
     */
    function getFallbackResponse(userMessage, persona) {
        // Map UI persona values to Fallback data keys
        const personaKey = persona === 'first-time' ? 'firstTime' : (persona || 'general');
        const list = window.FALLBACK_QA[personaKey] || window.FALLBACK_QA.general;
        const input = userMessage.toLowerCase().replace(/[?.,!]/g, "");

        // Intent Mapping (Keywords -> Questions)
        const intentMap = {
            'vote': 'voting',
            'voting': 'voting',
            'evm': 'evm',
            'machine': 'evm',
            'register': 'vote',
            'how': 'vote',
            'documents': 'documents',
            'id': 'documents',
            'proof': 'documents',
            'where': 'where',
            'booth': 'where',
            'student': 'student',
            'rural': 'rural'
        };

        // 1. Try Keyword/Intent match
        const words = input.split(" ");
        let foundIntent = null;
        for (const word of words) {
            if (intentMap[word]) {
                foundIntent = intentMap[word];
                break;
            }
        }

        // 2. Find match in list based on Intent or Keyword
        let match = list.find(item => {
            const q = item.q.toLowerCase().replace(/[?.,!]/g, "");
            if (foundIntent && q.includes(foundIntent)) return true;
            return words.some(w => w.length > 3 && q.includes(w));
        });

        // 3. Global fallback if not found in persona list
        if (!match) {
            match = window.FALLBACK_QA.general.find(item => {
                const q = item.q.toLowerCase().replace(/[?.,!]/g, "");
                if (foundIntent && q.includes(foundIntent)) return true;
                return words.some(w => w.length > 3 && q.includes(w));
            });
        }

        if (match) return match.a;

        // 4. Smart Default Fallback
        return "I'm currently in offline mode. Try asking about 'Voting', 'EVM', 'ID Documents', or 'Polling Booths'. You can also explore the Simulation or Timeline for more info!";
    }

    async function callGeminiAPI(prompt, persona) {
        const apiKey = window.CONFIG.GEMINI_API_KEY;

        // ✅ FIXED ENDPOINT & MODEL
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const quizScore = window.loadProgress('quizScore', 0);

        let contextInstruction = "";
        if (quizScore < 3) contextInstruction = "Recommend the Election Timeline/Simulator.";
        else contextInstruction = "Provide helpful civic education insights.";

        let personaContext = "";
        if (persona === 'first-time') personaContext = "User is a first-time voter.";
        else if (persona === 'student') personaContext = "User is a student.";
        else if (persona === 'rural') personaContext = "User is a rural voter.";
        else personaContext = "User is a general voter.";

        const systemInstructionText =
            `You are ElectIQ Civic Assistant. ${contextInstruction} ${personaContext} Keep answers short (max 3-4 lines).`;

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${systemInstructionText}\n\nUser: ${prompt}`
                        }
                    ]
                }
            ]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            throw new Error(data.error?.message || "Gemini API failed");
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    function addMessageToChat(text, sender, id = null) {
        if (!chatMessages) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        if (id) msgDiv.id = id;

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';

        // Simple bold markdown parsing
        let formattedText = window.escapeHTML(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        bubble.innerHTML = formattedText;

        // Add Avatar
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = sender === 'ai' ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

        if (sender === 'ai') {
            msgDiv.appendChild(avatar);
            msgDiv.appendChild(bubble);
        } else {
            msgDiv.appendChild(bubble);
            msgDiv.appendChild(avatar);
        }

        chatMessages.appendChild(msgDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeMessage(id) {
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    }
}

document.addEventListener('DOMContentLoaded', initCoach);
