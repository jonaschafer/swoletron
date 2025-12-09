import * as fs from 'fs'

const data = JSON.parse(fs.readFileSync('programme-filtered-matches.json', 'utf-8'))
const questionableMatches = data.questionableMatches

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Questionable Programme.app Matches</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .match {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .exercise-name {
      font-size: 1.3em;
      font-weight: bold;
      color: #333;
    }
    .confidence {
      background: #ff9800;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
    }
    .matched-to {
      color: #666;
      margin: 10px 0;
      font-size: 1.1em;
    }
    .url {
      background: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      word-break: break-all;
    }
    .url a {
      color: #2196F3;
      text-decoration: none;
    }
    .url a:hover {
      text-decoration: underline;
    }
    .actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
    }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1em;
      font-weight: 500;
    }
    .approve {
      background: #4CAF50;
      color: white;
    }
    .approve:hover {
      background: #45a049;
    }
    .reject {
      background: #f44336;
      color: white;
    }
    .reject:hover {
      background: #da190b;
    }
    .summary {
      background: white;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .summary h2 {
      margin-top: 0;
      color: #4CAF50;
    }
    .stats {
      display: flex;
      gap: 30px;
      margin-top: 15px;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #4CAF50;
    }
    .stat-label {
      color: #666;
      margin-top: 5px;
    }
    .reviewed {
      opacity: 0.6;
      border-color: #ccc;
    }
    .reviewed.approved {
      border-color: #4CAF50;
      background: #e8f5e9;
    }
    .reviewed.rejected {
      border-color: #f44336;
      background: #ffebee;
    }
  </style>
</head>
<body>
  <h1>📋 Review Questionable Programme.app Matches</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-number" id="total">${questionableMatches.length}</div>
        <div class="stat-label">Total to Review</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="approved">0</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="rejected">0</div>
        <div class="stat-label">Rejected</div>
      </div>
    </div>
  </div>

  ${questionableMatches.map((match: any, index: number) => `
    <div class="match" data-index="${index}" data-exercise="${match.exercise}">
      <div class="match-header">
        <div class="exercise-name">${match.exercise}</div>
        <div class="confidence">${match.confidence}% confidence</div>
      </div>
      <div class="matched-to">
        → Matched to: <strong>${match.programmeName}</strong>
      </div>
      <div class="url">
        <a href="${match.programmeUrl}" target="_blank">${match.programmeUrl}</a>
      </div>
      <div class="actions">
        <button class="approve" onclick="reviewMatch(${index}, true)">✅ Approve</button>
        <button class="reject" onclick="reviewMatch(${index}, false)">❌ Reject</button>
      </div>
    </div>
  `).join('')}

  <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 8px;">
    <h2>Export Results</h2>
    <button onclick="exportResults()" style="background: #2196F3; color: white; padding: 15px 30px; font-size: 1.1em;">
      💾 Export Review Results
    </button>
    <div id="export-status" style="margin-top: 15px; color: #666;"></div>
  </div>

  <script>
    const reviews = {};
    const matches = ${JSON.stringify(questionableMatches)};

    function reviewMatch(index, approved) {
      const match = document.querySelector(\`[data-index="\${index}"]\`);
      const exercise = matches[index].exercise;
      
      reviews[exercise] = {
        approved: approved,
        programmeUrl: approved ? matches[index].programmeUrl : null
      };
      
      match.classList.add('reviewed');
      match.classList.add(approved ? 'approved' : 'rejected');
      
      match.querySelector('.actions').innerHTML = approved 
        ? '<strong style="color: #4CAF50;">✅ Approved</strong>' 
        : '<strong style="color: #f44336;">❌ Rejected</strong>';
      
      updateSummary();
    }

    function updateSummary() {
      const approved = Object.values(reviews).filter(r => r.approved).length;
      const rejected = Object.values(reviews).filter(r => !r.approved).length;
      
      document.getElementById('approved').textContent = approved;
      document.getElementById('rejected').textContent = rejected;
    }

    function exportResults() {
      const approved = [];
      const rejected = [];
      
      Object.entries(reviews).forEach(([exercise, review]) => {
        if (review.approved) {
          approved.push({
            exercise: exercise,
            programmeUrl: review.programmeUrl
          });
        } else {
          rejected.push(exercise);
        }
      });
      
      const output = {
        approved: approved,
        rejected: rejected,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'programme-review-results.json';
      a.click();
      URL.revokeObjectURL(url);
      
      document.getElementById('export-status').innerHTML = 
        \`<strong style="color: #4CAF50;">✅ Exported! Approved: \${approved.length}, Rejected: \${rejected.length}</strong><br>
        <small>Save the file and run: <code>npx tsx scripts/update-reviewed-matches.ts</code></small>\`;
    }
  </script>
</body>
</html>
`

fs.writeFileSync('review-questionable-matches.html', html)
console.log('✅ Generated review-questionable-matches.html')
console.log('   Open this file in your browser to review matches visually')
console.log('   Click "Approve" or "Reject" for each match, then export the results')

