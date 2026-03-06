const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your Google Client ID
const API_KEY = 'YOUR_GOOGLE_API_KEY';       // Replace with your Google API Key
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

const signInBtn = document.getElementById('googleSignInBtn');
const signOutBtn = document.getElementById('googleSignOutBtn');
const eventList = document.getElementById('eventList');
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const calendarFrame = document.getElementById('calendarFrame');
const iframeUrlInput = document.getElementById('iframeUrl');
const icsUrlInput = document.getElementById('icsUrl');
const icsFileInput = document.getElementById('icsFileInput');
const icsTextInput = document.getElementById('icsTextInput');
const inviteeInput = document.getElementById('meetingInvitee');
const addFormContainer = document.getElementById('addMeetingForm');

const STORAGE_KEYS = {
  iframeUrl: 'calendar_iframe_url',
  icsUrl: 'calendar_ics_url',
  localMeetings: 'localMeetings'
};

const isFileContext = location.protocol === 'file:';

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    // If gapi isn't present (e.g., file:// context without script), skip Google init
    if (typeof gapi === 'undefined' || isFileContext) {
        // Hide Google auth UI if present
        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'none';
        // Render local/ICS events only
        renderAllEvents();
        return;
    }
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    if (typeof gapi === 'undefined') return;
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        const auth = gapi.auth2 && gapi.auth2.getAuthInstance ? gapi.auth2.getAuthInstance() : null;
        if (auth && auth.isSignedIn) auth.isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(auth && auth.isSignedIn ? auth.isSignedIn.get() : false);
        // Initial render on load
        renderAllEvents();
    }, function(error) {
        console.error(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  and trigger fetching events.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'block';
        listUpcomingEvents();
    } else {
        if (signInBtn) signInBtn.style.display = isFileContext ? 'none' : 'block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        eventList.innerHTML = '<p>Sign in to see your upcoming meetings.</p>';
    }
}

/**
 * Sign in the user upon button click.
 */
function handleAuthClick(event) {
    if (typeof gapi === 'undefined' || isFileContext) return;
    const auth = gapi.auth2 && gapi.auth2.getAuthInstance ? gapi.auth2.getAuthInstance() : null;
    if (auth) auth.signIn();
}

/**
 * Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    if (typeof gapi === 'undefined' || isFileContext) return;
    const auth = gapi.auth2 && gapi.auth2.getAuthInstance ? gapi.auth2.getAuthInstance() : null;
    if (auth) auth.signOut();
}

/**
 * Print the summary and start datetime/date of the next 10 events in the
 * user's primary calendar. If no events are found, print a message.
 */
function listUpcomingEvents() {
    if (typeof gapi === 'undefined' || isFileContext) return;
    gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
    }).then(function(response) {
        const events = response.result.items;
        eventList.innerHTML = ''; // Clear list

        if (events.length > 0) {
            events.forEach(event => {
                const start = event.start.dateTime || event.start.date;
                const eventElement = document.createElement('li');
                eventElement.className = 'event-item';
                eventElement.innerHTML = `
                    <h3>${event.summary}</h3>
                    <div class="event-meta">
                        <i class="far fa-clock"></i> ${new Date(start).toLocaleString()}
                    </div>
                `;
                eventList.appendChild(eventElement);
            });
        } else {
            eventList.innerHTML = '<p>No upcoming events found.</p>';
        }
    });
}

let localMeetings = [];
let icsEvents = [];

/**
 * Adds a new local meeting from the form inputs.
 */
function addLocalMeeting() {
    const title = document.getElementById('meetingTitle').value;
    const time = document.getElementById('meetingTime').value;
    const url = document.getElementById('meetingUrl').value;
    const location = document.getElementById('meetingLocation').value;

    if (!title || !time) {
        alert('Please provide a title and time for the meeting.');
        return null;
    }

    const newMeeting = {
        summary: title,
        start: { dateTime: new Date(time).toISOString() },
        htmlLink: url,
        location: location,
        isLocal: true
    };

    localMeetings.push(newMeeting);
    saveLocalMeetings();
    renderAllEvents();

    // Clear form (container is a div, not a form)
    try {
        document.getElementById('meetingTitle').value = '';
        document.getElementById('meetingTime').value = '';
        document.getElementById('meetingUrl').value = '';
        document.getElementById('meetingLocation').value = '';
        if (inviteeInput) inviteeInput.value = '';
    } catch (e) {}

    return newMeeting;
}

function addLocalMeetingAndInvite() {
    const meeting = addLocalMeeting();
    if (!meeting) return;
    // Generate ICS content
    const ics = buildIcsForEvent(meeting);
    // Trigger ICS download
    downloadTextFile(ics, `${sanitizeFilename(meeting.summary)}.ics`, 'text/calendar');
    // Open mailto with prefilled subject/body
    const email = inviteeInput ? (inviteeInput.value || '').trim() : '';
    const subject = encodeURIComponent(`Invitation: ${meeting.summary}`);
    const startLocal = new Date(meeting.start.dateTime || meeting.start.date).toLocaleString();
    const bodyLines = [
        `You're invited to: ${meeting.summary}`,
        `When: ${startLocal}`,
        meeting.location ? `Where: ${meeting.location}` : '',
        meeting.htmlLink ? `Link: ${meeting.htmlLink}` : '',
        '',
        'An .ics file has been downloaded. Please attach it to this email to add the event to your calendar.'
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    try { window.location.href = mailto; } catch (e) { console.warn('Failed to open mail client', e); }
}

function sanitizeFilename(name) {
    return (name || 'event').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 50);
}

function downloadTextFile(text, filename, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

function buildIcsForEvent(event) {
    const dtstamp = toIcsDate(new Date());
    const dtstart = toIcsDate(new Date(event.start.dateTime || event.start.date));
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@local`; 
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Unified Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `SUMMARY:${escapeIcsText(event.summary)}`,
        event.location ? `LOCATION:${escapeIcsText(event.location)}` : '',
        event.htmlLink ? `URL:${escapeIcsText(event.htmlLink)}` : '',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean);
    return lines.join('\r\n');
}

function toIcsDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(t) {
    return String(t).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/**
 * Saves local meetings to localStorage.
 */
function saveLocalMeetings() {
    localStorage.setItem('localMeetings', JSON.stringify(localMeetings));
}

/**
 * Loads local meetings from localStorage.
 */
function loadLocalMeetings() {
    const storedMeetings = localStorage.getItem('localMeetings');
    if (storedMeetings) {
        localMeetings = JSON.parse(storedMeetings);
    }
}

/**
 * Fetches events from all sources and renders them.
 */
async function renderAllEvents() {
    const isSignedIn = (typeof gapi !== 'undefined' && !isFileContext && gapi.auth2 && gapi.auth2.getAuthInstance && gapi.auth2.getAuthInstance().isSignedIn) ? gapi.auth2.getAuthInstance().isSignedIn.get() : false;
    let googleEvents = [];

    if (isSignedIn && typeof gapi !== 'undefined') {
        try {
            const response = await gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 10,
                'orderBy': 'startTime',
                'timeZone': userTimezone
            });
            googleEvents = response.result.items;
        } catch (error) {
            console.error('Error fetching Google Calendar events:', error);
        }
    }

    const allEvents = [...googleEvents, ...icsEvents, ...localMeetings]
        .filter(event => new Date(event.start.dateTime || event.start.date) > new Date())
        .sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date));

    displayEvents(allEvents);
}

/**
 * Renders a list of events to the UI.
 */
function displayEvents(events) {
    eventList.innerHTML = ''; // Clear list

    if (events.length > 0) {
        events.forEach(event => {
            const start = event.start.dateTime || event.start.date;
            const eventElement = document.createElement('li');
            eventElement.className = 'event-item';
            if (event.isLocal) {
                eventElement.style.borderLeftColor = '#17a2b8'; // Differentiate local meetings
            }

            let metaHTML = `<div class="event-meta"><i class="far fa-clock"></i> ${new Date(start).toLocaleString()}</div>`;
            if (event.location) {
                metaHTML += `<div class="event-meta"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>`;
            }
            if (event.htmlLink && !event.isLocal) { // Google events have htmlLink
                 metaHTML += `<div class="event-meta"><a href="${event.htmlLink}" target="_blank">View on Google Calendar</a></div>`;
            } else if (event.htmlLink && event.isLocal) { // Local meetings use htmlLink for URL
                 metaHTML += `<div class="event-meta"><a href="${event.htmlLink}" target="_blank">Meeting Link</a></div>`;
            }

            eventElement.innerHTML = `<h3>${event.summary}</h3>${metaHTML}`;
            eventList.appendChild(eventElement);
        });
    } else {
        const signedIn = (typeof gapi !== 'undefined' && !isFileContext && gapi.auth2 && gapi.auth2.getAuthInstance && gapi.auth2.getAuthInstance().isSignedIn) ? gapi.auth2.getAuthInstance().isSignedIn.get() : false;
        if (signedIn) {
             eventList.innerHTML = '<p>No upcoming events found.</p>';
        } else {
             eventList.innerHTML = '<p>Sign in to see your upcoming meetings.</p>';
        }
    }
}

// ---- IFRAME and ICS helpers ----
function setCalendarIframe() {
    if (!iframeUrlInput) return;
    const url = iframeUrlInput.value.trim();
    if (!url) {
        alert('Please provide a valid iframe URL.');
        return;
    }
    try {
        calendarFrame.src = url;
        localStorage.setItem(STORAGE_KEYS.iframeUrl, url);
    } catch (e) {
        console.error('Failed to set iframe URL', e);
    }
}

function loadIcsFromInput() {
    if (!icsUrlInput) return;
    const url = icsUrlInput.value.trim();
    if (!url) {
        alert('Please provide a valid ICS URL.');
        return;
    }
    localStorage.setItem(STORAGE_KEYS.icsUrl, url);
    loadIcs(url);
}

async function loadIcs(url) {
    try {
        // Direct fetch (will succeed only if CORS allows it)
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
        const text = await res.text();
        icsEvents = parseICS(text);
        renderAllEvents();
    } catch (err) {
        console.error('Error loading ICS', err);
        alert('Failed to load ICS via URL (likely due to CORS). Try loading from file or paste the ICS text.');
    }
}

function loadIcsFromFile() {
    if (!icsFileInput || !icsFileInput.files || !icsFileInput.files[0]) {
        alert('Please choose an .ics file first.');
        return;
    }
    const file = icsFileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const text = reader.result;
            icsEvents = parseICS(text);
            renderAllEvents();
        } catch (e) {
            console.error('Failed to parse ICS file', e);
            alert('Failed to parse ICS file.');
        }
    };
    reader.onerror = () => alert('Failed to read file.');
    reader.readAsText(file);
}

function loadIcsFromText() {
    if (!icsTextInput) return;
    const text = icsTextInput.value.trim();
    if (!text) {
        alert('Please paste ICS text first.');
        return;
    }
    try {
        icsEvents = parseICS(text);
        renderAllEvents();
    } catch (e) {
        console.error('Failed to parse ICS text', e);
        alert('Failed to parse ICS text.');
    }
}

// Override the original listUpcomingEvents to use the new rendering function
function listUpcomingEvents() {
    renderAllEvents();
}

// Load local meetings on script start
loadLocalMeetings();

// Restore iframe and ICS from storage on start
try {
    const savedIframe = localStorage.getItem(STORAGE_KEYS.iframeUrl);
    if (savedIframe && calendarFrame) {
        calendarFrame.src = savedIframe;
        if (iframeUrlInput) iframeUrlInput.value = savedIframe;
    }
    const savedIcs = localStorage.getItem(STORAGE_KEYS.icsUrl);
    if (savedIcs) {
        if (icsUrlInput) icsUrlInput.value = savedIcs;
        loadIcs(savedIcs);
    }
} catch (e) {
    console.warn('Failed to restore iframe/ics URLs', e);
}

// Load the client library.
handleClientLoad();

// Expose UI handlers
window.setCalendarIframe = setCalendarIframe;
window.loadIcsFromInput = loadIcsFromInput;
window.loadIcsFromFile = loadIcsFromFile;
window.loadIcsFromText = loadIcsFromText;
window.addLocalMeetingAndInvite = addLocalMeetingAndInvite;
