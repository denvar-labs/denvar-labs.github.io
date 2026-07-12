const fs = require('fs');
const files = [
  'index.html',
  'ka-esports/awards.html', 'ka-esports/community.html', 'ka-esports/faq.html',
  'ka-esports/global-leaderboard.html', 'ka-esports/h2h-details.html', 'ka-esports/hall-of-fame.html',
  'ka-esports/index.html', 'ka-esports/match-reports.html', 'ka-esports/matches.html',
  'ka-esports/monthly-leaderboard.html', 'ka-esports/penalties.html',
  'ka-esports/player-comparison.html', 'ka-esports/player-profile.html', 'ka-esports/players.html',
  'ka-esports/rage-quit-rules.html', 'ka-esports/rage-quit-stats.html', 'ka-esports/seasons-report.html',
  'ka-esports/simulator.html', 'ka-esports/streams.html', 'ka-esports/suspension-list.html',
  'ka-esports/tournaments.html', 'ka-esports/admin/penalty.html'
];
let count = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;
  content = content.replace(
    /  <meta http-equiv="Content-Security-Policy" content="[^"]*">\n?/,
    ''
  );
  if (content !== before) {
    fs.writeFileSync(f, content, 'utf8');
    count++;
  }
}
console.log('Removed CSP from ' + count + ' files');
