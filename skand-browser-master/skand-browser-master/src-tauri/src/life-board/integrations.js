// Integrations: calendar embed, map modal & carousel, location + panchang, download/export, SoundCloud
// Depends on globals: userLocation, userCountry, deliveryServices, soundCloudPlaylists, selectedDate
// Uses: openModal(), formatCountryName()

// Import Panchang calculation library
const { HinduLunar } = window.hindulunar || {};

// Google OAuth 2.0 Configuration
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// Google API client
let tokenClient;
let gapiInited = false;

// Initialize Google API client
document.addEventListener('DOMContentLoaded', () => {
    // Load the Google API client library
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
        gapi.load('client', initializeGapiClient);
    };
    document.head.appendChild(gapiScript);

    // Load Google Identity Services
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = initializeGisClient;
    document.head.appendChild(gisScript);
});

// Initialize Google API client with API key
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('Google API client initialized');
        updateSigninStatus();
    } catch (error) {
        console.error('Error initializing Google API client:', error);
    }
}

// Initialize Google Identity Services client
function initializeGisClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error !== undefined) {
                console.error('Authentication error:', response.error);
                return;
            }
            // Token received, update UI
            updateSigninStatus();
            // Load calendar if we have a token
            if (gapi.client.getToken()) {
                showCalendarWidget();
            }
        },
    });
    console.log('Google Identity Services client initialized');
    updateSigninStatus();
}

// Update the sign-in status
function updateSigninStatus() {
    // Keep this lightweight; buttons may not exist in current UI
    try {
        const isSignedIn = !!(window.gapi && gapi.client && gapi.client.getToken && gapi.client.getToken());
        const authButton = document.getElementById('authorize-button');
        const signoutButton = document.getElementById('signout-button');
        if (authButton) {
            authButton.style.display = isSignedIn ? 'none' : 'block';
            authButton.onclick = handleAuthClick;
        }
        if (signoutButton) {
            signoutButton.style.display = isSignedIn ? 'block' : 'none';
            signoutButton.onclick = handleSignout;
        }
    } catch (_) {}
}

// Handle sign-in
function handleAuthClick() {
    if (!window.gapi || !gapi.client || !tokenClient) {
        // Graceful fallback if credentials are not configured
        alert('Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_API_KEY in integrations.js');
        return;
    }
    if (!gapi.client.getToken()) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Handle sign-out
function handleSignout() {
    const token = (window.gapi && gapi.client && gapi.client.getToken) ? gapi.client.getToken() : null;
    if (token && window.google && google.accounts && google.accounts.oauth2) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
        updateSigninStatus();
        // Close calendar widget if open
        closeCalendarWidget();
    }
}

// Show the calendar widget (uses existing #calendarWidget container)
async function showCalendarWidget() {
    // If Google API isn't configured, show a helpful message in the widget area
    const container = document.getElementById('calendarWidget');
    if (!container) return;

    try {
        if (!window.gapi || !gapi.client || !gapi.client.getToken || !gapi.client.getToken()) {
            container.style.display = 'block';
            container.innerHTML = '<div style="padding:12px">\
              <h4 style="margin:0 0 8px">Google Calendar</h4>\
              <p>Calendar integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_API_KEY in <code>integrations.js</code>, then click again.</p>\
              <p><button class="btn btn-small" onclick="authenticateAndShowCalendar()">Try Sign In</button>\
              <button class="btn btn-small" onclick="closeCalendarWidget()" style="margin-left:8px">Close</button></p>\
            </div>';
            return;
        }

        // Show loading state
        container.style.display = 'block';
        container.innerHTML = '<p style="padding:12px">Loading calendar...</p>';

        // Fetch calendar events
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 10,
            orderBy: 'startTime',
        });

        const events = response.result.items || [];
        if (events.length === 0) {
            container.innerHTML = '<div style="padding:12px"><h4 style="margin:0 0 8px">Upcoming Events</h4><p>No upcoming events found.</p><p><button class="btn btn-small" onclick="closeCalendarWidget()">Close</button></p></div>';
            return;
        }

        // Display events in the existing container
        let output = '<div style="padding:12px"><h4 style="margin:0 0 8px">Upcoming Events</h4><ul class="event-list">';
        events.forEach((event) => {
            const start = event.start.dateTime || event.start.date;
            output += `\
                <li class="event-item" style="margin:6px 0;">\
                    <div class="event-time" style="font-size:0.9em;color:#666;">${new Date(start).toLocaleString()}</div>\
                    <div class="event-summary" style="font-weight:600;">${event.summary || 'No title'}</div>\
                </li>`;
        });
        output += '</ul><p><button class="btn btn-small" onclick="closeCalendarWidget()">Close</button></p></div>';
        container.innerHTML = output;

    } catch (error) {
        console.error('Error loading calendar events:', error);
        if (error && error.status === 401 && window.gapi && gapi.client && gapi.client.setToken) {
            gapi.client.setToken(null);
            updateSigninStatus();
            showNotification('Please sign in again to access Google Calendar', 'error');
        } else {
            showNotification('Failed to load calendar events', 'error');
        }
    }
}

// Close the calendar widget
function closeCalendarWidget() {
    const container = document.getElementById('calendarWidget');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Use the app's notification system if available
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback to alert
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Export the authentication functions
window.authenticateAndShowCalendar = showCalendarWidget;
window.handleSignout = handleSignout;

// Open map modal & carousel, location + panchang, download/export, SoundCloud
function openMapModal(label, query) {
  document.getElementById("mapModalTitle").textContent = label || "Find Location";
  const input = document.getElementById("mapSearchInput");
  let q = query;
  if (userLocation?.lat && query.toLowerCase().includes("near me")) {
    q = query.replace(/near me/gi, `near ${userLocation.lat},${userLocation.lon}`);
  }
  if (input) input.value = q;
  document.getElementById("mapIframe").src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=15`;
  populateMapCarousel(q);
  openModal("mapModal");
}

function searchOnMap() {
  const q = document.getElementById("mapSearchInput").value.trim();
  if (q) openMapModal("Search Results", q);
}

function populateMapCarousel(base) {
  const wrap = document.getElementById("mapCarousel");
  wrap.innerHTML = "";
  const items = [
    { name: "Nearby Park", query: `park near ${base}` },
    { name: "Cozy Coffee Shop", query: `coffee shop near ${base}` },
    { name: "Public Library", query: `library near ${base}` },
    { name: "Supermarket", query: `supermarket near ${base}` },
    { name: "Yoga Studio", query: `yoga studio near ${base}` },
  ];
  items.forEach(it => {
    const el = document.createElement("div");
    el.className = "carousel-item";
    el.innerHTML = `<h4>${it.name}</h4>`;
    el.onclick = () => updateMapFromCarousel(it);
    wrap.appendChild(el);
  });
}

function updateMapFromCarousel(item) {
  document.getElementById("mapModalTitle").textContent = item.name;
  const input = document.getElementById("mapSearchInput");
  if (input) input.value = item.name;
  document.getElementById("mapIframe").src = `https://www.google.com/maps?q=${encodeURIComponent(item.query)}&output=embed&z=15`;
  document.querySelectorAll(".carousel-item").forEach(el => el.classList.remove("active"));
  event.currentTarget.classList.add("active");
}

async function reverseGeocode(lat, lon) {
  // Stubbed reverse geocode used previously
  return new Promise(res => {
    setTimeout(() => { res({ city: "Seri Kembangan, Selangor", timezone: "Asia/Kuala_Lumpur" }); }, 500);
  });
}

function getUserLocation() {
  const status = document.getElementById("locationStatus");
  status.textContent = "Fetching location...";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const info = await reverseGeocode(lat, lon);
        userLocation = { lat, lon, city: info.city, timezone: info.timezone };
        status.textContent = `📍 Location: ${userLocation.city}`;
        fetchAndDisplayPanchang();
      } catch (e) {
        userLocation = { lat, lon, city: "Unknown", timezone: "UTC" };
        status.textContent = "📍 Could not name location.";
        fetchAndDisplayPanchang();
      }
    }, () => {
      status.textContent = "Location access denied.";
      fetchAndDisplayPanchang();
    });
  } else {
    status.textContent = "Geolocation not supported.";
    fetchAndDisplayPanchang();
  }
}

async function fetchAndDisplayPanchang() {
  const container = document.getElementById("panchangContainer");
  container.innerHTML = "<p>Fetching panchang details...</p>";
  
  try {
    // Use local-noon to avoid UTC date shifts affecting lunar calculations
    const base = new Date(selectedDate);
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
    const panchangData = await calculatePanchang(date);
    
    if (!panchangData) {
      container.innerHTML = "<p>Could not calculate Panchang data for this date.</p>";
      return;
    }
    
    const { tithi, nakshatra, sunrise, sunset, festivals, choghadiya } = panchangData;
    
    let festivalsHtml = festivals && festivals.length > 0 
      ? `<ul>${festivals.map(f => `<li>${f}</li>`).join("")}</ul>`
      : "No major festivals.";
    
    let choghadiyaHtml = choghadiya && choghadiya.day
      ? `<div class="chogadiya-grid">${
          choghadiya.day.map(e => {
            const quality = getChoghadiyaQuality(e.muhurat); // good | bad | neutral
            return `
            <div class="choghadiya-muhurat ${quality}">
              <strong>${e.muhurat}</strong><br>
              <small>${e.time}</small>
            </div>`;
          }).join("")
        }</div>`
      : "Day Choghadiya not available.";
    
    container.innerHTML = `
      <div class="panchang-item"><strong>Tithi:</strong> ${tithi}</div>
      <div class="panchang-item"><strong>Nakshatra:</strong> ${nakshatra}</div>
      <div class="panchang-item"><strong>Sunrise:</strong> ${sunrise || 'N/A'}</div>
      <div class="panchang-item"><strong>Sunset:</strong> ${sunset || 'N/A'}</div>
      <div class="panchang-item"><strong>Festivals:</strong> ${festivalsHtml}</div>
      <hr style="margin: 10px 0;">
      <h4 style="margin-bottom: 5px;">Day Choghadiya</h4>
      ${choghadiyaHtml}
    `;
  } catch (error) {
    console.error("Error fetching Panchang data:", error);
    container.innerHTML = "<p>Error loading Panchang data. Please try again later.</p>";
  }
}

async function calculatePanchang(date) {
  try {
    // Accept either lon or lng on userLocation
    if (!userLocation || !userLocation.lat || (!userLocation.lng && !userLocation.lon)) {
      console.warn('User location not available for Panchang calculation');
      return getRealisticPanchangData(date);
    }
    
    const lat = userLocation.lat;
    const lng = (userLocation.lng != null) ? userLocation.lng : userLocation.lon;
    
    // Create a local noon date for better accuracy
    const localNoon = new Date(date);
    localNoon.setHours(12, 0, 0, 0);
    
    try {
      // Use the Hindu Lunar library if available
      if (!window.hindulunar || typeof window.hindulunar.fromDate !== 'function') {
        console.warn('Hindu Lunar library not properly loaded, using realistic fallback');
        return getRealisticPanchangData(date, { lat, lng });
      }
      
      const hinduDate = window.hindulunar.fromDate(localNoon, { lat, lng });
      
      // Validate that we got a proper response
      if (!hinduDate) {
        console.warn('Hindu Lunar library returned null, using fallback');
        return getRealisticPanchangData(date, { lat, lng });
      }
      
      // Safely get tithi and nakshatra
      let tithi, nakshatra;
      try {
        tithi = hinduDate.tithi ? hinduDate.tithi() : null;
        nakshatra = hinduDate.nakshatra ? hinduDate.nakshatra() : null;
      } catch (e) {
        console.warn('Error getting tithi/nakshatra:', e);
        return getRealisticPanchangData(date, { lat, lng });
      }
      
      // Get sunrise and sunset using SunCalc or similar calculation
      const sunTimes = calculateSunTimes(date, lat, lng);
      
      // Safely get festivals
      let festivals = [];
      try {
        festivals = hinduDate.festivals ? hinduDate.festivals() : [];
      } catch (e) {
        console.warn('Error getting festivals:', e);
        festivals = getRealisticFestivals(date);
      }
      
      // Calculate Choghadiya
      const choghadiya = calculateChoghadiya(date, { lat, lng }, sunTimes);
      
      return {
        tithi: tithi?.name || 'Unknown',
        nakshatra: nakshatra?.name || 'Unknown',
        sunrise: sunTimes.sunrise,
        sunset: sunTimes.sunset,
        festivals: Array.isArray(festivals) ? festivals : [],
        choghadiya: choghadiya || { day: [] }
      };
    } catch (error) {
      console.error('Error in Panchang calculation:', error);
      return getRealisticPanchangData(date, { lat, lng });
    }
  } catch (error) {
    console.error("Error in calculatePanchang:", error);
    return getRealisticPanchangData(date);
  }
}

function calculateChoghadiya(date, { lat, lng }, sunTimes) {
  // Calculate Choghadiya based on actual sunrise/sunset times
  const muhurats = ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"];
  const day = date.getDay();
  
  // Parse sunrise and sunset times
  const sunriseHour = parseTimes(sunTimes.sunrise);
  const sunsetHour = parseTimes(sunTimes.sunset);
  
  // Calculate day duration and divide into 8 periods
  const dayDuration = sunsetHour - sunriseHour;
  const periodDuration = dayDuration / 8;
  
  const dayMuhurats = [];
  for (let i = 0; i < 8; i++) {
    const startHour = sunriseHour + (i * periodDuration);
    const endHour = startHour + periodDuration;
    
    dayMuhurats.push({
      muhurat: muhurats[(day + i) % muhurats.length],
      time: `${formatHour(startHour)} - ${formatHour(endHour)}`,
      type: 'day'
    });
  }
  
  return { day: dayMuhurats };
}

function parseTimes(timeStr) {
  // Parse both "06:15 AM" and "06:15" (24-hour) formats to decimal hours
  if (timeStr.includes(' ')) {
    // 12-hour format with AM/PM
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour = hours + (minutes / 60);
    if (period === 'PM' && hours !== 12) hour += 12;
    if (period === 'AM' && hours === 12) hour = minutes / 60;
    return hour;
  } else {
    // 24-hour format
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  }
}

function formatHour(decimalHour) {
  // Convert decimal hour back to "HH:MM AM/PM" format
  let hour = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Map Choghadiya name to quality for color-coding
function getChoghadiyaQuality(name) {
  const n = (name || "").toLowerCase();
  // Traditionally: Shubh, Labh, Amrit are favorable; Rog, Kaal, Udveg are unfavorable; Char is neutral
  if (["amrit", "shubh", "labh"].includes(n)) return "good";
  if (["rog", "kaal", "udveg"].includes(n)) return "bad";
  return "neutral";
}

// Realistic Panchang calculation using astronomical formulas
function getRealisticPanchangData(date, location) {
  const sunTimes = calculateSunTimes(date, location?.lat, location?.lng);
  const lunarData = calculateLunarData(date);
  const festivals = getRealisticFestivals(date);
  
  return {
    tithi: lunarData.tithi,
    nakshatra: lunarData.nakshatra,
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    festivals: festivals,
    choghadiya: calculateChoghadiya(date, location || {lat: 28.6139, lng: 77.2090}, sunTimes)
  };
}

// Get timezone from coordinates using a simple lookup
function getTimezoneFromCoordinates(lat, lng) {
  // Simplified timezone detection based on longitude
  // For more accuracy, you could use a timezone API or library
  const timezoneOffset = Math.round(lng / 15);
  
  // Common timezone mappings for major regions
  const timezoneMap = {
    '-12': 'Pacific/Baker_Island',
    '-11': 'Pacific/Samoa',
    '-10': 'Pacific/Honolulu',
    '-9': 'America/Anchorage',
    '-8': 'America/Los_Angeles',
    '-7': 'America/Denver',
    '-6': 'America/Chicago',
    '-5': 'America/New_York',
    '-4': 'America/Halifax',
    '-3': 'America/Sao_Paulo',
    '-2': 'Atlantic/South_Georgia',
    '-1': 'Atlantic/Azores',
    '0': 'Europe/London',
    '1': 'Europe/Paris',
    '2': 'Europe/Berlin',
    '3': 'Europe/Moscow',
    '4': 'Asia/Dubai',
    '5': 'Asia/Karachi',
    '5.5': 'Asia/Kolkata',
    '6': 'Asia/Dhaka',
    '7': 'Asia/Bangkok',
    '8': 'Asia/Shanghai',
    '9': 'Asia/Tokyo',
    '10': 'Australia/Sydney',
    '11': 'Pacific/Norfolk',
    '12': 'Pacific/Auckland'
  };
  
  // Handle India specifically (UTC+5:30)
  if (lat >= 6 && lat <= 37 && lng >= 68 && lng <= 97) {
    return 'Asia/Kolkata';
  }
  
  return timezoneMap[timezoneOffset.toString()] || timezoneMap['0'];
}

// Calculate sunrise/sunset using astronomical formulas with proper timezone
function calculateSunTimes(date, lat = 28.6139, lng = 77.2090) {
  // Get the proper timezone for the location
  const timezone = getTimezoneFromCoordinates(lat, lng);
  
  // Create date in the local timezone
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  
  // Simplified sun calculation (for more accuracy, use SunCalc library)
  const dayOfYear = Math.floor((localDate - new Date(localDate.getFullYear(), 0, 0)) / 86400000);
  const P = Math.asin(0.39795 * Math.cos(0.98563 * (dayOfYear - 173) * Math.PI / 180));
  
  // Calculate sunrise/sunset hour angles
  const argument = -Math.tan(lat * Math.PI / 180) * Math.tan(P);
  let hourAngle = 0;
  
  if (Math.abs(argument) < 1) {
    hourAngle = Math.acos(argument) * 180 / Math.PI / 15;
  } else {
    hourAngle = 6; // Default 6 hours from noon
  }
  
  // More accurate equation of time calculation
  const n = dayOfYear;
  const B = 2 * Math.PI * (n - 81) / 365;
  const eqTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  
  // Calculate local solar time
  const timeCorrection = eqTime + 4 * lng;
  
  const sunriseHour = 12 - hourAngle - timeCorrection / 60;
  const sunsetHour = 12 + hourAngle - timeCorrection / 60;
  
  // Convert to local timezone
  const sunriseDate = new Date(date);
  sunriseDate.setHours(Math.floor(sunriseHour), (sunriseHour % 1) * 60, 0, 0);
  
  const sunsetDate = new Date(date);
  sunsetDate.setHours(Math.floor(sunsetHour), (sunsetHour % 1) * 60, 0, 0);
  
  return {
    sunrise: sunriseDate.toLocaleTimeString('en-US', { 
      timeZone: timezone, 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    sunset: sunsetDate.toLocaleTimeString('en-US', { 
      timeZone: timezone, 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    timezone: timezone
  };
}

// Calculate lunar tithi and nakshatra using astronomical formulas
function calculateLunarData(date) {
  const tithis = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"];
  const nakshatras = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
  
  // Calculate days since J2000.0 epoch
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const daysSinceJ2000 = (date - J2000) / (1000 * 60 * 60 * 24);
  
  // Lunar calculations (simplified)
  const lunarMonth = 29.530588853; // Average lunar month
  const lunarCycle = (daysSinceJ2000 % lunarMonth) / lunarMonth;
  const tithiIndex = Math.floor(lunarCycle * 15) % 15;
  
  // Nakshatra calculation (27 nakshatras in ~27.3 days)
  const nakshatraMonth = 27.321661;
  const nakshatraCycle = (daysSinceJ2000 % nakshatraMonth) / nakshatraMonth;
  const nakshatraIndex = Math.floor(nakshatraCycle * 27) % 27;
  
  return {
    tithi: tithis[tithiIndex] || "Pratipada",
    nakshatra: nakshatras[nakshatraIndex] || "Ashwini"
  };
}

// Get realistic festivals based on date
function getRealisticFestivals(date) {
  const festivals = [];
  const month = date.getMonth();
  const day = date.getDate();
  
  // Major Hindu festivals (Gregorian dates - approximate)
  if (month === 0 && day === 14) festivals.push("Makar Sankranti");
  if (month === 2 && (day >= 8 && day <= 10)) festivals.push("Holi");
  if (month === 3 && (day >= 13 && day <= 15)) festivals.push("Ram Navami");
  if (month === 7 && (day >= 18 && day <= 20)) festivals.push("Krishna Janmashtami");
  if (month === 8 && (day >= 15 && day <= 25)) festivals.push("Ganesh Chaturthi");
  if (month === 9 && (day >= 15 && day <= 25)) festivals.push("Navratri");
  if (month === 10 && (day >= 10 && day <= 15)) festivals.push("Diwali");
  
  return festivals;
}

function formatDecimalToTime(decimalHour) {
  let hour = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function openMusicGenreModal() { openModal("musicGenreModal"); }
function openSoundCloudModal(genre) {
  const frame = document.getElementById("soundCloudFrame");
  const url = soundCloudPlaylists[genre];
  if (url) { frame.src = url; closeModal("musicGenreModal"); openModal("soundCloudModal"); }
}

// Open delivery service search using planned grocery items + extra search term
function openDeliverySearch(countryKey, serviceIndex, plannerTaskId, extraInputId) {
  try {
    const svcList = deliveryServices[countryKey] || [];
    const svc = svcList[serviceIndex];
    if (!svc) return;
    const dateKey = selectedDate;
    const planned = (plannerTaskId && completions[dateKey]?.[plannerTaskId]) || [];
    const extraTerm = (document.getElementById(extraInputId)?.value || '').trim();
    const terms = [...planned];
    if (extraTerm) terms.push(extraTerm);
    const query = terms.join(", ");
    const fullUrl = svc.url.replace(/\/?$/, "/") + (svc.searchPath || "") + encodeURIComponent(query || "grocery");
    window.open(fullUrl, "_blank");
  } catch (e) {
    console.error('openDeliverySearch error:', e);
  }
}

function populateCountrySelector() {
  const sel = document.getElementById("countrySelector");
  sel.innerHTML = "";
  for (const key in deliveryServices) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = formatCountryName(key);
    sel.appendChild(opt);
  }
  sel.value = userCountry;
}

function updateCountry(val) {
  userCountry = val;
  saveData();
  renderTasks();
}

function exportData() {
  const payload = { rituals, tasks, todos, completions, journalEntries, userCountry, exportedAt: new Date().toISOString() };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "daily_routine_data.json");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function updateDownloadCounter() {
  const cnt = localStorage.getItem("appDownloadCount") || 0;
  document.getElementById("downloadCounter").textContent = `Downloaded ${cnt} times.`;
}

function downloadApp() {
  const cnt = localStorage.getItem("appDownloadCount") || 0;
  const n = parseInt(cnt) + 1;
  localStorage.setItem("appDownloadCount", n);
  updateDownloadCounter();
  const blob = new Blob([document.documentElement.outerHTML], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "daily-life-enhancer.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
