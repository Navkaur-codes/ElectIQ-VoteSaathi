// Smart Quiz Logic

function initQuiz() {
    const quizStartScreen = document.getElementById('quiz-start-screen');
    const quizQuestionScreen = document.getElementById('quiz-question-screen');
    const quizResultScreen = document.getElementById('quiz-result-screen');

    const startBtn = document.getElementById('start-quiz-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const retryBtn = document.getElementById('retry-quiz-btn');

    const questionText = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options');
    const explanationBox = document.getElementById('quiz-explanation');
    const progressText = document.getElementById('quiz-progress');
    const scoreText = document.getElementById('quiz-score');
    const finalScoreText = document.getElementById('final-score-text');
    const badgeText = document.getElementById('quiz-badge');

    // Question Bank
    const questions = [
        {
            q: "What is the minimum age to be eligible to vote in India?",
            options: ["16 Years", "18 Years", "21 Years", "25 Years"],
            answer: 1, // index of correct option
            explanation: "The 61st Amendment Act (1988) lowered the voting age for elections to the Lok Sabha and State Legislative Assemblies from 21 years to 18 years."
        },
        {
            q: "What document is primarily issued by the Election Commission for identification?",
            options: ["Aadhaar Card", "PAN Card", "EPIC (Voter ID)", "Passport"],
            answer: 2,
            explanation: "EPIC stands for Electors Photo Identity Card. It is issued by the Election Commission of India to eligible voters."
        },
        {
            q: "What does NOTA stand for on the EVM?",
            options: ["None Of The Above", "No Other True Alternative", "Not Offered To Anyone", "New Option To Agree"],
            answer: 0,
            explanation: "NOTA (None Of The Above) allows voters to officially register a vote of rejection for all candidates contesting."
        },
        {
            q: "How long is the VVPAT slip visible to the voter?",
            options: ["3 seconds", "5 seconds", "7 seconds", "10 seconds"],
            answer: 2,
            explanation: "The printed VVPAT slip containing the serial number, name, and symbol of the candidate voted for remains exposed through a glass window for 7 seconds."
        },
        {
            q: "When does the election campaign officially end before polling?",
            options: ["24 hours before", "48 hours before", "72 hours before", "1 week before"],
            answer: 1,
            explanation: "The campaign period ends 48 hours before the polling concludes. This is known as the 'silence period'."
        }
    ];

    let currentQuestionIndex = 0;
    let score = 0;
    let selectedQuestions = [];

    if (!startBtn) return;

    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', loadNextQuestion);
    retryBtn.addEventListener('click', startQuiz);
    
    // Load highest score badge if any
    const highScore = window.loadProgress('quizHighScore', 0);
    if (highScore > 0) {
        startBtn.textContent = `Retake Quiz (Best: ${highScore}/${questions.length})`;
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        selectedQuestions = [...questions]; 
        
        quizStartScreen.classList.add('hidden');
        quizResultScreen.classList.add('hidden');
        quizQuestionScreen.classList.remove('hidden');
        
        renderQuestion();
    }

    function renderQuestion() {
        const qData = selectedQuestions[currentQuestionIndex];
        
        // Update UI
        progressText.textContent = `Question ${currentQuestionIndex + 1}/${selectedQuestions.length}`;
        scoreText.textContent = `Score: ${score}`;
        questionText.textContent = qData.q;
        
        // Clear previous options
        optionsContainer.innerHTML = '';
        explanationBox.classList.add('hidden');
        nextBtn.classList.add('hidden');
        
        qData.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(index, btn));
            optionsContainer.appendChild(btn);
        });
    }

    function handleAnswer(selectedIndex, btnElement) {
        const qData = selectedQuestions[currentQuestionIndex];
        const isCorrect = selectedIndex === qData.answer;
        
        // Disable all options
        const allBtns = optionsContainer.querySelectorAll('.quiz-option');
        allBtns.forEach((b, idx) => {
            b.disabled = true;
            if (idx === qData.answer) {
                b.classList.add('correct'); // Highlight correct answer
            } else if (idx === selectedIndex && !isCorrect) {
                b.classList.add('wrong'); // Highlight user's wrong answer
            }
        });

        if (isCorrect) score++;
        
        scoreText.textContent = `Score: ${score}`;
        
        // Show explanation
        explanationBox.innerHTML = `<strong>Explanation:</strong> ${qData.explanation}`;
        explanationBox.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        
        if (currentQuestionIndex === selectedQuestions.length - 1) {
            nextBtn.textContent = 'See Results';
        } else {
            nextBtn.textContent = 'Next Question';
        }
    }

    function loadNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < selectedQuestions.length) {
            renderQuestion();
        } else {
            showResults();
        }
    }

    function showResults() {
        quizQuestionScreen.classList.add('hidden');
        quizResultScreen.classList.remove('hidden');
        
        finalScoreText.textContent = `${score}/${selectedQuestions.length}`;
        
        let badge = 'Novice Voter';
        let icon = '🌱';
        if (score === selectedQuestions.length) { badge = 'Civic Expert'; icon = '🏆'; }
        else if (score >= selectedQuestions.length - 2) { badge = 'Informed Citizen'; icon = '🌟'; }
        
        badgeText.innerHTML = `<span style="font-size: 2rem">${icon}</span><br>Badge: <strong>${badge}</strong>`;
        
        // Save high score
        const prevHigh = window.loadProgress('quizHighScore', 0);
        if (score > prevHigh) {
            window.saveProgress('quizHighScore', score);
        }

        // Firebase - Anonymous Metrics & Sync
        if (window.firebaseService) {
            window.firebaseService.saveQuizResult(score);
        }
    }
}

document.addEventListener('DOMContentLoaded', initQuiz);
