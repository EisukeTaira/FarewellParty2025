/**
 * CONFIGURATION
 * Paste your Google Sheets CSV URL here.
 * To get this URL: File > Share > Publish to web > Select Sheet > CSV > Copy Link
 */
const SHEET_CSV_URL = 'https://script.google.com/macros/s/AKfycbxBZMaZ136vVtYcpyKsg2SN2yDeJcDd1jsev7_RNsAYFM6QAgk7Q3f0DnZ831E-lxRoWA/exec'; // Leave empty to use mock data
const USE_MOCK_DATA = false; // Set to false when you have a real URL

// Mock data matching the NEW structure (Team, Content1, Status1, Content2, Status2...)
const MOCK_DATA = `Team Name,M1 Content,M1 Status,M2 Content,M2 Status,M3 Content,M3 Status,M4 Content,M4 Status,M5 Content,M5 Status,M6 Content,M6 Status,M7 Content,M7 Status,M8 Content,M8 Status,M9 Content,M9 Status
Team A,Find Red Obect,TRUE,Take Selfie,FALSE,High Five,FALSE,Quiz 1,FALSE,Quiz 2,FALSE,Sign,FALSE,Dance,FALSE,Sing,FALSE,Jump,FALSE
Team B,Find Blue Object,TRUE,Group Photo,TRUE,Handshake,TRUE,Quiz A,TRUE,Quiz B,TRUE,Sketch,TRUE,Run,TRUE,Clap,TRUE,Sit,TRUE
Team Test,Task 1,TRUE,Task 2,TRUE,Task 3,FALSE,Task 4,FALSE,Task 5,TRUE,Task 6,FALSE,Task 7,FALSE,Task 8,FALSE,Task 9,FALSE`;

async function fetchData() {
    if (USE_MOCK_DATA || !SHEET_CSV_URL) {
        console.log("Using Mock Data");
        return MOCK_DATA;
    }

    try {
        // Append timestamp to bypass browser/proxy cache
        const separator = SHEET_CSV_URL.includes('?') ? '&' : '?';
        const cacheBuster = `${separator}t=${Date.now()}`;
        const response = await fetch(SHEET_CSV_URL + cacheBuster);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.text();
    } catch (error) {
        console.error('Error fetching data:', error);
        return `ERROR: ${error.message}`;
    }
}

function parseCSV(csvText) {
    if (csvText.startsWith('ERROR:')) {
        throw new Error(csvText);
    }
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Parse CSV into array of arrays to rely on index (safer for interleaved columns)
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const currentLine = lines[i].split(','); // Note: This assumes no commas in content. 
        data.push(currentLine.map(item => item.trim()));
    }
    return data;
}

async function init() {
    const container = document.getElementById('status-container');
    const teamDetailContainer = document.getElementById('team-detail-container');
    const lastUpdateSpan = document.getElementById('last-update');

    const csvData = await fetchData();
    if (!csvData || csvData.startsWith('ERROR:')) {
        const errorMsg = csvData || 'Unknown Error';
        const msgHtml = `<div class="loading" style="color:red;">Data Load Failed.<br><small>${errorMsg}</small></div>`;
        if (container) container.innerHTML = msgHtml;
        if (teamDetailContainer) teamDetailContainer.innerHTML = msgHtml;
        return;
    }

    const teamsRaw = parseCSV(csvData);

    // Clear loading/previous content
    if (container) container.innerHTML = '';
    if (teamDetailContainer) teamDetailContainer.innerHTML = '';

    // Process Data
    const formattedTeams = teamsRaw.map(row => {
        // Col 0: Team Name
        // Col 1,2: M1 Content, Status
        // Col 3,4: M2 Content, Status ...
        const name = row[0] || 'No Name';
        const missions = [];

        for (let i = 0; i < 9; i++) {
            const contentIdx = 1 + (i * 2);
            const statusIdx = 2 + (i * 2);

            if (row[contentIdx] !== undefined) {
                const content = row[contentIdx];
                const statusStr = (row[statusIdx] || '').toUpperCase();
                const isComplete = statusStr === 'TRUE';
                missions.push({ content, isComplete });
            }
        }
        return { name, missions };
    });

    // --- DASHBOARD VIEW (index.html) ---
    if (container) {
        formattedTeams.forEach((team, index) => {
            const cardHTML = createCardHTML(team, index, false);
            const link = document.createElement('a');
            link.href = `team.html?id=${index}`;
            link.innerHTML = cardHTML;
            container.appendChild(link);
        });
    }

    // --- DETAIL VIEW (team.html) ---
    if (teamDetailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const teamId = urlParams.get('id');

        if (teamId !== null && formattedTeams[teamId]) {
            const team = formattedTeams[teamId];
            const cardHTML = createCardHTML(team, teamId, true);
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
    const { name, missions } = team;
    const totalMissions = 9; // Fixed to 9 as per design
    let completedCount = 0;

    missions.forEach(m => {
        if (m.isComplete) completedCount++;
    });

    const statusClass = completedCount === totalMissions ? 'complete' : (completedCount > 0 ? 'progress' : 'pending');
    const statusLabel = completedCount === totalMissions ? 'All Clear!' : (completedCount > 0 ? 'In Progress' : 'Start');

    // Generate Mission View
    let missionsHtml = '';

    if (isDetail) {
        // Detail View: List style
        missionsHtml = '<div class="mission-list">';
        for (let i = 0; i < totalMissions; i++) {
            const m = missions[i] || { content: '-', isComplete: false };
            missionsHtml += `
                <div class="mission-list-item ${m.isComplete ? 'done' : ''}">
                    <div class="mission-icon">${i + 1}</div>
                    <div class="mission-content">${m.content}</div>
                    <div class="mission-status-text">${m.isComplete ? 'COMPLETED' : ''}</div>
                </div>
            `;
        }
        missionsHtml += '</div>';
    } else {
        // Dashboard View: Grid circles
        missionsHtml = '<div class="mission-grid">';
        for (let i = 0; i < totalMissions; i++) {
            const m = missions[i] || { content: '-', isComplete: false };
            missionsHtml += `<div class="mission-item ${m.isComplete ? 'done' : ''}" title="${m.content}">${i + 1}</div>`;
        }
        missionsHtml += '</div>';
    }

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
