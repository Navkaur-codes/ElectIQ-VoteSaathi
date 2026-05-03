const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for the specific Render domain
const corsOptions = {
    origin: ['https://electiq-votesaathi.onrender.com', 'http://localhost:3000'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));
/**
 * GET /api/news
 * Proxy endpoint for GNews API to resolve CORS issues
 */
app.get('/api/news', async (req, res) => {
    try {
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Server Configuration Error: Missing NEWS_API_KEY" });
        }

        const query = encodeURIComponent("India elections");
        const gnewsUrl = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=10&token=${apiKey}`;

        console.log("Proxying request to GNews API...");
        const response = await fetch(gnewsUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("GNews API Error:", errorText);
            return res.status(response.status).json({ error: "Failed to fetch news from provider" });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Proxy Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fallback for SPA routing: serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ElectIQ Proxy Server running on port ${PORT}`);
    console.log(`CORS enabled for: ${corsOptions.origin}`);
});
