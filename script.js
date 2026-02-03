/**
 * CONFIGURATION
 * Paste your Google Sheets CSV URL here.
 * To get this URL: File > Share > Publish to web > Select Sheet > CSV > Copy Link
 */
const SHEET_CSV_URL = 'https://script.google.com/macros/s/AKfycbyBpQqL5ULzKsLpebUR8jeYlE9tXZx2hsvOR923RnMTWMHf0b_e7gTmp2rnPybUufhyYQ/exec'; // Leave empty to use mock data
const USE_MOCK_DATA = false; // Set to false when you have a real URL

// Mock data matching the Sheet structure (for testing)
const MOCK_DATA = `チーム名,ミッション①,ミッション②,ミッション③,ミッション④,ミッション⑤,ミッション⑥,ミッション⑦,ミッション⑧,ミッション⑨
Team A,TRUE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE
Team B,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE
Team C,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE
Team Test,TRUE,TRUE,FALSE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE`;

async function fetchData() {
    if (USE_MOCK_DATA || !SHEET_CSV_URL) {
        console.log("Using Mock Data");
        return MOCK_DATA;
    }

    try {
        // Append timestamp to bypass browser/proxy cache
        const cacheBuster = `&t=${Date.now()}`;
        const response = await fetch(SHEET_CSV_URL + cacheBuster);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.text();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Remove BOM if present from the first header
    let firstHeader = lines[0].split(',')[0].trim();
    if (firstHeader.charCodeAt(0) === 0xFEFF) {
        firstHeader = firstHeader.slice(1);
    }

    const headers = lines[0].split(',').map((h, index) => index === 0 ? firstHeader : h.trim());

    // Simple CSV parser
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // Handle empty lines
        if (!lines[i].trim()) continue;

        const currentLine = lines[i].split(',');
        // Basic length check - allow flexible length if headers match
        if (currentLine.length >= headers.length) {
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentLine[j].trim();
            }
            data.push(obj);
        }
    }
    return data;
}

async function init() {
    const container = document.getElementById('status-container');
    const lastUpdateSpan = document.getElementById('last-update');

    const csvData = await fetchData();
    if (!csvData) {
        if (container) container.innerHTML = '<div class="loading">Error loading data.</div>';
        return;
    }

    const teams = parseCSV(csvData);

    // Check which page we are on
    const statusContainer = document.getElementById('status-container');
    const teamDetailContainer = document.getElementById('team-detail-container');

    // Clear loading/previous content
    if (statusContainer) statusContainer.innerHTML = '';
    if (teamDetailContainer) teamDetailContainer.innerHTML = '';

    // --- DASHBOARD VIEW (index.html) ---
    if (statusContainer) {
        teams.forEach((team, index) => {
            const cardHTML = createCardHTML(team, index, false); // false = not detail view

            // Wrap in anchor tag for linking
            const link = document.createElement('a');
            link.href = `team.html?id=${index}`; // Using index as simple ID
            link.innerHTML = cardHTML;
            statusContainer.appendChild(link);
        });
    }

    // --- DETAIL VIEW (team.html) ---
    if (teamDetailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('id');

        if (teamId !== null && teams[teamId]) {
            const team = teams[teamId];
            const cardHTML = createCardHTML(team, teamId, true); // true = detail view
            teamDetailContainer.innerHTML = cardHTML;
        } else {
            teamDetailContainer.innerHTML = '<div class="loading">Team not found. <br><a href="index.html">Back to Dashboard</a></div>';
        }
    }

    const now = new Date();
    if (lastUpdateSpan) lastUpdateSpan.textContent = now.toLocaleTimeString();
}

/**
 * Helper to generate Card HTML
 * @param {Object} team - Team data object
 * @param {Number} id - Team index/ID
 * @param {Boolean} isDetail - True if large detail view
 */
function createCardHTML(team, id, isDetail) {
    // Headers: チーム名, ミッション①..⑨
    const name = team['チーム名'] || team['Team Name'] || 'No Name';

    let completedCount = 0;
    const totalMissions = 9;
    const missionStatuses = [];

    // Check each mission column
    const missionKeys = [
        'ミッション①', 'ミッション②', 'ミッション③',
        'ミッション④', 'ミッション⑤', 'ミッション⑥',
        'ミッション⑦', 'ミッション⑧', 'ミッション⑨'
    ];

    missionKeys.forEach((key, index) => {
        const val = (team[key] || '').toUpperCase();
        const isComplete = val === 'TRUE';
        if (isComplete) completedCount++;
        missionStatuses.push(isComplete);
    });

    const statusClass = completedCount === totalMissions ? 'complete' : (completedCount > 0 ? 'progress' : 'pending');
    const statusLabel = completedCount === totalMissions ? 'All Clear!' : (completedCount > 0 ? 'In Progress' : 'Start');

    // Generate mission circles HTML
    let missionsHtml = '<div class="mission-grid">';
    missionStatuses.forEach((isDone, idx) => {
        missionsHtml += `<div class="mission-item ${isDone ? 'done' : ''}" title="Mission ${idx + 1}">${idx + 1}</div>`;
    });
    missionsHtml += '</div>';

    return `
        <div class="team-card ${isDetail ? 'detail-view' : ''}">
            <div class="team-name">${name}</div>
            <div class="team-status ${statusClass}">${statusLabel}</div>
            <div class="stamps-count">${completedCount} <span style="font-size:1rem; color:#666;">/ ${totalMissions}</span></div>
            ${missionsHtml}
        </div>
    `;
}

// Initialize
init();

// Auto-refresh every 30 seconds
setInterval(init, 30000);
