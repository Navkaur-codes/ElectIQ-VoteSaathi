// Maps Module

let map = null;
const locationCache = {}; // Cache for performance

function initMaps() {
    const searchBtn = document.getElementById('search-booth-btn');
    const locationBtn = document.getElementById('use-location-btn');
    const pinInput = document.getElementById('pincode-input');
    const mapElement = document.getElementById('map-element');
    const boothResults = document.getElementById('booth-results');
    const boothList = document.getElementById('booth-list');

    if (!searchBtn) return;

    const handleSearch = window.debounce(() => {
        let pin = pinInput.value.trim();
        pin = window.sanitizeInput(pin); // Strict sanitization
        
        const pinError = document.getElementById('pin-error');
        if (pinError) pinError.classList.add('hidden');

        // PIN Code Schema Validation (Indian Standard: 6 digits)
        const pinRegex = /^[0-9]{6}$/;
        if (!pinRegex.test(pin)) {
            if (pinError) {
                pinError.textContent = "Please enter a valid 6-digit Indian PIN code.";
                pinError.classList.remove('hidden');
            } else {
                alert("Please enter a valid 6-digit PIN code.");
            }
            return;
        }

        if (pin) searchLocationByPin(pin);
    }, 500);

    searchBtn.addEventListener('click', handleSearch);

    locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            locationBtn.innerHTML = `<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Locating...`;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    locationBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> Use My Location`;
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    renderLeafletMap(lat, lon, "Your Location");
                },
                (error) => {
                    locationBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> Use My Location`;
                    alert("Unable to retrieve your location.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    function searchLocationByPin(pin) {
        if (!navigator.onLine) {
            mapElement.innerHTML = `<div class="empty-state"><p>❌ You are offline. Please check your network connection.</p></div>`;
            return;
        }

        mapElement.innerHTML = `<div class="loader-container"><div class="loader"></div><p>Searching area for PIN: ${pin}...</p></div>`;
        boothResults.classList.add('hidden');
        
        searchBtn.disabled = true;
        pinInput.disabled = true;

        if (locationCache[pin]) {
            if (window.METRICS) window.METRICS.cacheHits++;
            // Use cached result
            let lat = parseFloat(locationCache[pin].lat);
            let lon = parseFloat(locationCache[pin].lon);
            renderLeafletMap(lat, lon, `PIN: ${pin}`);
            return;
        }

        // Note: Using nominatim API. Adding country=India as per requirement.
        fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json`)
            .then(res => res.json())
            .then(data => {
                if (data.length > 0) {
                    locationCache[pin] = { lat: data[0].lat, lon: data[0].lon }; // Save to cache
                    let lat = parseFloat(data[0].lat);
                    let lon = parseFloat(data[0].lon);
                    renderLeafletMap(lat, lon, `PIN: ${pin}`);
                } else {
                    mapElement.innerHTML = `
                        <div class="empty-state">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); opacity: 0.5;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            <p>Location not found for PIN: ${pin}</p>
                        </div>
                    `;
                }
            })
            .catch(err => {
                console.error(err);
                mapElement.innerHTML = `
                    <div class="empty-state">
                        <p>Error fetching location data. Network issue.</p>
                    </div>
                `;
            }).finally(() => {
                searchBtn.disabled = false;
                pinInput.disabled = false;
            });
    }

    function renderLeafletMap(centerLat, centerLon, locationName) {
        // Clean map container before initializing Leaflet
        const mapContainer = document.getElementById('map-element');
        
        // If map was already initialized, remove it
        if (map !== null) {
            map.remove();
        }
        
        // Create new container div inside mapElement to prevent Leaflet conflicts if re-initialized
        mapContainer.innerHTML = '<div id="actual-map" style="width: 100%; height: 100%; min-height: 400px; border-radius: var(--radius-md);"></div>';

        map = L.map('actual-map').setView([centerLat, centerLon], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Generate mock booths around the center
        const booths = generateMockBooths(centerLat, centerLon);

        // Calculate distance and find nearest
        let nearestBooth = null;
        let minDistance = Infinity;

        booths.forEach(booth => {
            const dist = calculateDistance(centerLat, centerLon, booth.lat, booth.lon);
            booth.distanceVal = dist;
            booth.distanceText = dist < 1 ? (dist * 1000).toFixed(0) + " m" : dist.toFixed(1) + " km";
            
            if (dist < minDistance) {
                minDistance = dist;
                nearestBooth = booth;
            }
        });

        // Add markers
        booths.forEach(booth => {
            const isNearest = booth === nearestBooth;
            
            const marker = L.marker([booth.lat, booth.lon]).addTo(map);
            
            let popupContent = `
                <div style="font-family: var(--font-main);">
                    <strong style="font-size: 1.1em; color: var(--primary-color);">${booth.name}</strong><br>
                    <span style="font-size: 0.9em; color: #666;">${booth.address}</span><br>
                    <span style="display:inline-block; margin-top: 5px; font-size: 0.9em; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px;">Time: 7 AM - 6 PM</span>
                    ${isNearest ? '<div style="margin-top: 8px; font-weight: bold; color: #ef4444; font-size: 0.9em;">📍 Nearest Booth</div>' : ''}
                </div>
            `;
            
            marker.bindPopup(popupContent);
            
            if (isNearest) {
                marker.openPopup();
            }
        });

        // Add a marker for the user's searched/current location
        L.circleMarker([centerLat, centerLon], {
            color: 'var(--accent-color)',
            fillColor: 'var(--accent-color)',
            fillOpacity: 0.5,
            radius: 8
        }).addTo(map).bindPopup("Your Location");

        // Draw Route Line to Nearest Booth
        if (nearestBooth) {
            const routeLine = L.polyline([
                [centerLat, centerLon],
                [nearestBooth.lat, nearestBooth.lon]
            ], {
                color: 'blue',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10' // dashed line
            }).addTo(map);
        }

        renderBoothList(booths, nearestBooth);
    }

    function renderBoothList(booths, nearestBooth) {
        if (!boothList || !boothResults) return;
        
        // Sort booths by distance
        booths.sort((a, b) => a.distanceVal - b.distanceVal);

        boothList.innerHTML = '';
        booths.forEach(booth => {
            const isNearest = booth === nearestBooth;
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="booth-item ${isNearest ? 'nearest-booth' : ''}" style="${isNearest ? 'border-left: 4px solid var(--primary-color); background: rgba(var(--primary-color-rgb), 0.05);' : ''}">
                    <div class="booth-info">
                        <strong>${booth.name} ${isNearest ? '<span class="badge badge-outline" style="font-size:0.7em; padding: 2px 4px; margin-left: 5px;">Nearest</span>' : ''}</strong>
                        <span class="distance" style="display: block; margin-top: 4px; font-size: 0.85em; color: var(--text-muted);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> 
                            ${booth.distanceText}
                        </span>
                    </div>
                    <div class="booth-status" style="text-align: right;">
                        <span class="wait-time" style="font-size: 0.85em; color: var(--success-color); display: block; margin-bottom: 4px;">~${booth.waitTime} wait</span>
                        <button class="btn btn-sm btn-outline" onclick="map.setView([${booth.lat}, ${booth.lon}], 16)">View on Map</button>
                    </div>
                </div>
            `;
            boothList.appendChild(li);
        });
        
        boothResults.classList.remove('hidden');
    }

    // Helper functions
    function generateMockBooths(lat, lon) {
        // Generate 3 random booths within roughly 2km of the center
        return [
            {
                name: "Govt. Primary School",
                address: "Sector 4 Main Road",
                lat: lat + (Math.random() - 0.5) * 0.02,
                lon: lon + (Math.random() - 0.5) * 0.02,
                waitTime: "5 mins"
            },
            {
                name: "Community Center",
                address: "Block B, Phase 1",
                lat: lat + (Math.random() - 0.5) * 0.03,
                lon: lon + (Math.random() - 0.5) * 0.03,
                waitTime: "15 mins"
            },
            {
                name: "Municipal Ward Office",
                address: "Near Water Tank",
                lat: lat + (Math.random() - 0.5) * 0.015,
                lon: lon + (Math.random() - 0.5) * 0.015,
                waitTime: "2 mins"
            }
        ];
    }

    // Calculate distance in km using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1); 
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }
    
    // Expose for testing
    window.calculateDistance = calculateDistance;
}

document.addEventListener('DOMContentLoaded', initMaps);
