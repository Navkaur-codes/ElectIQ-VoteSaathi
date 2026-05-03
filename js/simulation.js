// Voting Simulation Logic

function initSimulation() {
    const steps = document.querySelectorAll('.stepper .step');
    const simContents = document.querySelectorAll('.sim-content');
    const verifyBtn = document.getElementById('sim-verify-btn');
    const feedback1 = document.getElementById('sim-feedback-1');
    const evmBtns = document.querySelectorAll('.evm-btn');
    const vvpatSlip = document.getElementById('vvpat-slip');
    const votedCandidate = document.getElementById('voted-candidate');
    const restartBtn = document.getElementById('sim-restart-btn');

    let currentStep = 1;

    if (!verifyBtn) return;

    verifyBtn.addEventListener('click', () => {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = `<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Verifying Identity...`;
        
        setTimeout(() => {
            feedback1.classList.remove('hidden');
            steps[0].classList.add('completed');
            verifyBtn.innerHTML = `Show Voter ID`;
            
            setTimeout(() => {
                goToStep(2);
            }, 1500);
        }, 1500);
    });

    evmBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent multiple votes
            evmBtns.forEach(b => b.disabled = true);
            const target = e.target;
            target.classList.add('pressed');
            
            const candidate = target.getAttribute('data-candidate');
            
            // Beep sound simulation
            playSound(800, 'sine', 1); // 800Hz beep for 1 second
            
            steps[1].classList.add('completed');
            
            setTimeout(() => {
                goToStep(3);
                showVVPAT(candidate);
            }, 1000);
        });
    });

    restartBtn.addEventListener('click', resetSimulation);

    function goToStep(stepNum) {
        currentStep = stepNum;
        
        // Update stepper UI
        steps.forEach(step => {
            const num = parseInt(step.getAttribute('data-step'));
            if (num === stepNum) {
                step.classList.add('active');
            } else if (num > stepNum) {
                step.classList.remove('active');
                step.classList.remove('completed');
            }
        });

        // Update Content
        simContents.forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`sim-step-${stepNum}`);
        targetContent.classList.remove('hidden');
        setTimeout(() => targetContent.classList.add('active'), 10);
    }

    function showVVPAT(candidate) {
        votedCandidate.textContent = candidate === 'NOTA' ? 'NOTA' : `Candidate ${candidate}`;
        vvpatSlip.classList.remove('hidden');
        
        // Slip drops and disappears after 7 seconds (handled by CSS animation)
        setTimeout(() => {
            restartBtn.classList.remove('hidden');
            steps[2].classList.add('completed');
            
            // Firebase - Anonymous Metrics & Sync
            if (window.firebaseService) {
                window.firebaseService.markSimulationComplete();
            }
        }, 7000);
    }

    function resetSimulation() {
        currentStep = 1;
        verifyBtn.disabled = false;
        feedback1.classList.add('hidden');
        
        evmBtns.forEach(b => {
            b.disabled = false;
            b.classList.remove('pressed');
        });
        
        vvpatSlip.classList.add('hidden');
        restartBtn.classList.add('hidden');
        
        goToStep(1);
    }

    function playSound(frequency, type, duration) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            
            // Fade out
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
            
            setTimeout(() => {
                oscillator.stop();
                audioCtx.close();
            }, duration * 1000);
        } catch(e) {
            console.log("Audio not supported or blocked");
        }
    }
}

document.addEventListener('DOMContentLoaded', initSimulation);
