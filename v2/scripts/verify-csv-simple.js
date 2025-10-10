const fs = require('fs');

console.log('='.repeat(60));
console.log('📊 CSV VERIFICATION REPORT');
console.log('='.repeat(60));
console.log();

// Read CSV file
const csvContent = fs.readFileSync('./workouts.csv', 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Parse CSV manually
const headers = lines[0].split(',');
const rows = lines.slice(1).map(line => {
  // Handle commas in quoted fields
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return {
    week: parseInt(values[0]),
    day: parseInt(values[1]),
    date: values[2],
    day_of_week: values[3],
    workout_type: values[4],
    description: values[5],
    distance: values[6],
    duration: values[7],
    exercises: values[8]
  };
});

console.log('📈 BASIC STATS:');
console.log(`Total workouts: ${rows.length}`);
console.log(`Expected: 84 workouts (12 weeks × 7 days)`);
console.log();

// Count by week
const weekCounts = {};
rows.forEach(row => {
  weekCounts[row.week] = (weekCounts[row.week] || 0) + 1;
});

console.log('📅 WORKOUTS PER WEEK:');
Object.keys(weekCounts).sort((a, b) => a - b).forEach(week => {
  console.log(`Week ${week}: ${weekCounts[week]} workouts`);
});
console.log();

// Find strength workouts
const strengthWorkouts = rows.filter(row => 
  row.exercises && row.exercises.length > 0 && row.exercises !== '""'
);

console.log('💪 STRENGTH SESSIONS:');
console.log(`Total strength sessions: ${strengthWorkouts.length}`);
console.log(`Expected: 24 sessions (2 per week × 12 weeks)`);
console.log();

// Count strength by day
const strengthByDay = {};
strengthWorkouts.forEach(row => {
  const day = row.day_of_week;
  strengthByDay[day] = (strengthByDay[day] || 0) + 1;
});

console.log('📆 STRENGTH SESSIONS BY DAY:');
Object.entries(strengthByDay).forEach(([day, count]) => {
  const emoji = (day === 'Tuesday' || day === 'Thursday') ? '✅' : '❌';
  console.log(`${emoji} ${day}: ${count} sessions`);
});
console.log();

// Check for wrong days
const wrongDays = strengthWorkouts.filter(row => 
  row.day_of_week !== 'Tuesday' && row.day_of_week !== 'Thursday'
);

if (wrongDays.length > 0) {
  console.log('⚠️  WARNING: Strength on wrong days:');
  wrongDays.forEach(row => {
    console.log(`  Week ${row.week}, ${row.day_of_week} (${row.date})`);
  });
  console.log();
} else {
  console.log('✅ All strength sessions on Tuesday/Thursday!');
  console.log();
}

// Sample weeks
console.log('📋 SAMPLE WEEK SCHEDULES:');
[1, 5, 9].forEach(weekNum => {
  console.log(`\n--- WEEK ${weekNum} ---`);
  const weekWorkouts = rows.filter(row => row.week === weekNum);
  weekWorkouts.forEach(row => {
    const strengthFlag = (row.exercises && row.exercises.length > 2) ? ' 💪' : '';
    console.log(`${row.day_of_week}: ${row.workout_type}${strengthFlag}`);
  });
});
console.log();

// Date verification
console.log('📅 DATE VERIFICATION:');
const firstWorkout = rows[0];
const lastWorkout = rows[rows.length - 1];
console.log(`Start date: ${firstWorkout.date} (${firstWorkout.day_of_week})`);
console.log(`End date: ${lastWorkout.date} (${lastWorkout.day_of_week})`);
console.log(`Expected start: 2025-10-13 (Monday)`);
console.log();

// Final verdict
console.log('='.repeat(60));
const allGood = 
  wrongDays.length === 0 && 
  strengthWorkouts.length === 24 &&
  rows.length === 84;

if (allGood) {
  console.log('✅ CSV LOOKS GOOD - READY TO IMPORT');
} else {
  console.log('❌ ISSUES FOUND - DO NOT IMPORT YET');
  if (rows.length !== 84) console.log(`   - Expected 84 workouts, found ${rows.length}`);
  if (strengthWorkouts.length !== 24) console.log(`   - Expected 24 strength sessions, found ${strengthWorkouts.length}`);
  if (wrongDays.length > 0) console.log(`   - Found ${wrongDays.length} strength sessions on wrong days`);
}
console.log('='.repeat(60));
