/**
 * CONFIGURATION
 * Paste your Google Sheets CSV URL here.
 * To get this URL: File > Share > Publish to web > Select Sheet > CSV > Copy Link
 */
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-92-V-KJYFhy_xLpm4Yz879qfyLaxR6cRmW-jOT2Tvg5Xv58x_fs0h87xRst3nE5ThiQzslQZ8opr/pub?output=csv'; // Leave empty to use mock data
const USE_MOCK_DATA = false; // Set to false when you have a real URL

// Mock data for initial testing
const MOCK_DATA = `ID,Team Name,Stamps,Status
1,Team A,5,InProgress
2,Team B,10,Complete
3,Team C,2,InProgress
4,Team D,0,NotStarted
5,Team E,8,InProgress
6,Team F,10,Complete
7,Team G,3,InProgress
8,Team H,0,NotStarted
9,Team I,6,InProgress
10,Team J,9,InProgress
11,Team K,1,InProgress
12,Team L,10,Complete
13,Team M,4,InProgress
14,Team N,7,InProgress
15,Team O,2,InProgress
16,Team P,0,NotStarted
17,Team Q,10,Complete
18,Team R,5,InProgress
19,Team S,8,InProgress
20,Team T,3,InProgress
21,Team U,1,InProgress
22,Team V,6,InProgress
23,Team W,9,InProgress`;

async function fetchData() {
    if (USE_MOCK_DATA || !SHEET_CSV_URL) {
        console.log("Using Mock Data");
        return MOCK_DATA;
    }

    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.text();
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('データを取得できませんでした。コンソールを確認してください。');
        return null;
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // Simple CSV parser (assuming no commas in values for simplicity)
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length === headers.length) {
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentLine[j].trim();
            }
            data.push(obj);
        }
    }
    return data;
}

function getStatusClass(status, stamps) {
    // Logic to determine color class
    // You can customize this logic based on your Sheet's status values
    const s = status ? status.toLowerCase() : '';
    const count = parseInt(stamps, 10);

    if (s.includes('complete') || s === '完了' || count >= 10) return 'complete'; // Example threshold
    if (count > 0 || s.includes('progress') || s === '進行中') return 'progress';
    return 'pending';
}

function getStatusLabel(status, stamps) {
    if (status) return status;
    const count = parseInt(stamps, 10);
    if (count >= 10) return 'Complete';
    if (count > 0) return 'In Progress';
    return 'Not Started';
}

async function init() {
    const container = document.getElementById('status-container');
    const lastUpdateSpan = document.getElementById('last-update');

    const csvData = await fetchData();
    if (!csvData) {
        container.innerHTML = '<div class="loading">Error loading data.</div>';
        return;
    }

    const teams = parseCSV(csvData);

    container.innerHTML = ''; // Clear loading

    teams.forEach(team => {
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

        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <div class="team-name">${name}</div>
            <div class="team-status ${statusClass}">${statusLabel}</div>
            <div class="stamps-count">${completedCount} <span style="font-size:1rem; color:#666;">/ ${totalMissions}</span></div>
            ${missionsHtml}
        `;
        container.appendChild(card);
    });

    const now = new Date();
    lastUpdateSpan.textContent = now.toLocaleTimeString();
}

// Initialize
init();

// Auto-refresh every 30 seconds
setInterval(init, 30000);
