# 🗳️ ElectIQ: VoteSaathi
### *Empowering every citizen to vote with confidence.*

**🚀 Live Demo:** [electiq-votesaathi.onrender.com](https://electiq-votesaathi.onrender.com)

---

ElectIQ: VoteSaathi is an engineering-grade, modular AI learning platform designed to bridge the civic knowledge gap in India. It provides a personalized, interactive experience to help citizens—especially first-time voters, students, and rural residents—understand the election process with clarity and confidence.

---

## 🌟 Key Features

### 🧠 Intelligent AI Civic Coach
Powered by **Gemini 1.5 Flash**, the Coach acts as a context-aware mentor. It adaptively suggests modules based on your quiz performance and provides persona-based guidance for different user groups.

### 🗳️ Voting Simulation (EVM + VVPAT)
A realistic, step-by-step digital simulation of the Indian voting process. Includes authentic audio feedback and a visual VVPAT confirmation slip to demystify the experience at the polling booth.

### 📍 Polling Booth Finder
Integrates **OpenStreetMap** and **Leaflet.js** to help users locate their nearest polling station via 6-digit PIN code search or real-time geolocation.

### 📅 Interactive Election Timeline
A curated visual guide to the official election phases, from the initial announcement by the ECI to the final declaration of results.

### 📝 Smart Quiz & Progress Tracking
An interactive assessment tool that tracks civic knowledge, identifies learning gaps, and syncs progress anonymously to the cloud.

### 📰 Live Civic Updates
A real-time news module that fetches and filters election-related announcements, prioritizing educational content based on user interaction.

---

## 🧠 AI System Design & Resilience

The AI Coach is designed with **stability and reliability** as core principles:

- **Persona-Based Responses**: Tailors knowledge for *General Citizens*, *Students*, *Rural Voters*, and *First-Time Voters*.
- **Keyword-Driven Fallback**: Implements a robust `fallbackQA.js` engine. If external AI APIs fail or are offline, the system gracefully switches to high-quality, pre-defined civic guidance without interrupting the user experience.
- **Context Injection**: Dynamically adjusts its advice based on the user's latest quiz scores and journey progress.

---

## 🛡️ Security Approach

ElectIQ: VoteSaathi implements security best practices to protect the integrity of the application:

- **Input Sanitization**: All user-generated content (chat, feedback) is processed through a strict sanitization utility to prevent XSS and script injection.
- **Strict Validation**: Implements regex-based validation for 6-digit Indian PIN codes and length constraints on feedback submissions.
- **Content Security Policy (CSP)**: A hardened CSP meta-tag is used to whitelist only trusted domains (Google, Firebase, OpenStreetMap, GNews).
- **Safe Rendering**: Prioritizes `textContent` over `innerHTML` for rendering user-supplied data to eliminate injection vectors.

> [!IMPORTANT]
> **Firebase Evaluation Note**: Firebase Realtime Database is utilized in **Anonymous/Demo Mode** for hackathon evaluation purposes. Production deployments would implement full authentication-based security rules and private user instances.

---

## ⚙️ Technical Architecture

The application is built with a **decoupled vanilla JavaScript architecture**, ensuring high performance and ease of maintenance:

- **Modular Structure**: Logic is separated into dedicated services (AI, Maps, Firebase, News) to ensure modularity.
- **Service Layer**: Centralized API handling in `firebaseService.js` and `news.js` manages external data flow.
- **State Management**: Uses persistent `localStorage` linked with real-time cloud synchronization for a seamless multi-session experience.

---

## 🧪 Testing & Reliability Strategy

Core logic and critical paths are covered by a combination of automated and manual validation:

- **Automated QA Dashboard**: A dedicated `test.html` utility runs unit tests for input sanitization, PIN validation logic, and distance calculation accuracy.
- **Edge Case Handling**: The system includes defensive coding for empty inputs, rapid clicks (debouncing), and network failures.
- **Fail-Safe UI**: All interactive elements include loading states and are disabled during API calls to prevent race conditions.

---

## 📊 Evaluation Mapping (Judges' Guide)

| Criteria | Implementation Proof |
| :--- | :--- |
| **Code Quality** | Clean, modular JS with clear separation of concerns and zero external framework bloat. |
| **Security** | Hardened CSP, strict regex validation, and multi-layer input sanitization. |
| **Efficiency** | In-memory API caching, debounced event listeners, and real-time metrics (Ctrl+M). |
| **Innovation** | Persona-based AI coaching, live engagement counters, and a robust offline fallback system. |
| **Accessibility** | Native Voice Support (TTS/STT), semantic HTML5 structure, and high-contrast glassmorphic UI. |

---

## 🌐 External Services Used

- **Google Gemini API**: Dynamic AI Civic Coaching.
- **Firebase RTDB**: Real-time global engagement metrics and anonymous tracking.
- **Leaflet.js / OSM**: Mapping and Polling Booth location services.
- **GNews API**: Real-time election news integration.

---

## 🚀 Setup & Installation

1. **Configuration**: Open `js/config.js` and provide your Gemini and GNews API keys.
2. **Firebase Setup**: Ensure your Firebase RTDB is initialized and the URL is added to the config.
3. **Database Rules**: For the demo to function, set Realtime Database rules to `{ ".read": true, ".write": true }`.
4. **Local Server**: Run the app using a local server for the best experience:
   ```bash
   npx serve .  # or python -m http.server
   ```

Designed with ❤️ for a more informed and engaged democracy.
