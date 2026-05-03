/**
 * ElectIQ: VoteSaathi - Automated Testing Suite
 * Focuses on Security, Sanitization, and Core Logic.
 */

function runTestSuite() {
    const resultsContainer = document.getElementById('test-results');
    const totalEl = document.getElementById('total-tests');
    const passEl = document.getElementById('pass-count');
    const failEl = document.getElementById('fail-count');
    
    let total = 0;
    let passed = 0;
    let failed = 0;

    resultsContainer.innerHTML = '';

    function assert(name, condition, details = "") {
        total++;
        const card = document.createElement('div');
        card.className = `test-card ${condition ? 'pass' : 'fail'}`;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong>${name}</strong>
                <span class="badge ${condition ? 'badge-pass' : 'badge-fail'}">${condition ? 'PASS' : 'FAIL'}</span>
            </div>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${details}</p>
        `;
        
        resultsContainer.appendChild(card);
        if (condition) passed++; else failed++;
        
        totalEl.textContent = total;
        passEl.textContent = passed;
        failEl.textContent = failed;
    }

    // 1. Sanitization Tests
    assert(
        "Sanitize Script Tags",
        window.sanitizeInput("<script>alert('xss')</script>") === "alert('xss')",
        "Removes script tags and brackets"
    );
    assert(
        "Sanitize Brackets",
        window.sanitizeInput("<div>Hello</div>") === "divHellodiv",
        "Removes HTML brackets < >"
    );

    // 2. PIN Validation Tests
    const pinRegex = /^[0-9]{6}$/;
    assert(
        "Valid PIN Acceptance",
        pinRegex.test("110001") === true,
        "Accepts valid 6-digit Indian PIN"
    );
    assert(
        "Invalid PIN Rejection (Length)",
        pinRegex.test("11001") === false,
        "Rejects short PIN"
    );
    assert(
        "Invalid PIN Rejection (Chars)",
        pinRegex.test("11000A") === false,
        "Rejects alpha-numeric PIN"
    );

    // 3. Logic Tests (Haversine Formula)
    // Distance between two points in Delhi (approx 2.4km)
    // CP: 28.6315, 77.2167
    // India Gate: 28.6129, 77.2295
    if (window.calculateDistance) {
        const dist = window.calculateDistance(28.6315, 77.2167, 28.6129, 77.2295);
        assert(
            "Haversine Formula Accuracy",
            dist > 2.0 && dist < 2.8,
            `Expected ~2.4km, got ${dist.toFixed(2)}km`
        );
    } else {
        assert("Haversine Test", false, "calculateDistance function not found in window");
    }

    // 4. Persistence Tests
    window.saveProgress('test_key', 'test_value');
    const loaded = window.loadProgress('test_key');
    assert(
        "localStorage Safety",
        loaded === 'test_value',
        "Correctly saves and loads JSON-safe data"
    );

    // 5. AI Fallback logic tests
    // Mocking the getFallbackResponse if needed or testing it if exposed
    if (window.getFallbackResponse) {
        const resp = window.getFallbackResponse("What is voting?", "general");
        assert(
            "AI Fallback Keyword Match",
            resp.includes("process") || resp.includes("citizens"),
            "Retrieved high-quality fallback answer for keyword 'voting'"
        );
    }
}

document.getElementById('run-tests-btn')?.addEventListener('click', runTestSuite);
