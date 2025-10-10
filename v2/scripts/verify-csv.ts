import * as fs from 'fs';
import Papa from 'papaparse';

interface Workout {
  week: number;
  day: number;
  date: string;
  day_of_week: string;
  workout_type: string;
  description: string;
  distance?: number;
  duration?: number;
  exercises?: string;
}

// Read and parse CSV
const csvFile = fs.readFileSync('./workouts.csv', 'utf8');
const parsed = Papa.parse<Workout>(csvFile, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true
});

const workouts = parsed.data;

console.log('='.repeat(60));
console.log('📊 CSV VERIFICATION REPORT');
console.log('='.repeat(60));
console.log();

// Basic stats
console.log('📈 BASIC STATS:');
console.log(`Total workouts: ${workouts.length}`);
console.log(`Expected: ~84 workouts (12 weeks × 7 days)`);
console.log();

// Count by week
const weekCounts = workouts.reduce((acc, w) => {
  acc[w.week] = (acc[w.week] || 0) + 1;
  return acc;
}, {} as Record<number, number>);

console.log('📅 WORKOUTS PER WEEK:');
Object.keys(weekCounts).sort((a, b) => Number(a) - Number(b)).forEach(week => {
  console.log(`Week ${week}: ${weekCounts[week]} workouts`);
});
console.log();

// Strength session analysis
const strengthWorkouts = workouts.filter(w => 
  w.workout_type?.toLowerCase().includes('strength') || 
  w.exercises
);

console.log('💪 STRENGTH SESSIONS:');
console.log(`Total strength sessions: ${strengthWorkouts.length}`);
console.log(`Expected: 24 sessions (2 per week × 12 weeks)`);
console.log();

// Strength by day of week
const strengthByDay = strengthWorkouts.reduce((acc, w) => {
  const day = w.day_of_week;
  acc[day] = (acc[day] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('📆 STRENGTH SESSIONS BY DAY:');
Object.entries(strengthByDay).forEach(([day, count]) => {
  const emoji = (day === 'Tuesday' || day === 'Thursday') ? '✅' : '❌';
  console.log(`${emoji} ${day}: ${count} sessions`);
});
console.log();

// Check for wrong days
const wrongDays = strengthWorkouts.filter(w => 
  w.day_of_week !== 'Tuesday' && w.day_of_week !== 'Thursday'
);

if (wrongDays.length > 0) {
  console.log('⚠️  WARNING: Strength on wrong days:');
  wrongDays.forEach(w => {
    console.log(`  Week ${w.week}, ${w.day_of_week} (${w.date})`);
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
  const weekWorkouts = workouts.filter(w => w.week === weekNum);
  weekWorkouts.forEach(w => {
    const strengthFlag = w.exercises ? ' 💪' : '';
    console.log(`${w.day_of_week}: ${w.workout_type}${strengthFlag}`);
  });
});
console.log();

// Date verification
console.log('📅 DATE VERIFICATION:');
const firstWorkout = workouts[0];
const lastWorkout = workouts[workouts.length - 1];
console.log(`Start date: ${firstWorkout.date} (${firstWorkout.day_of_week})`);
console.log(`End date: ${lastWorkout.date} (${lastWorkout.day_of_week})`);
console.log(`Expected start: Monday, October 13, 2025`);
console.log();

// Final verdict
console.log('='.repeat(60));
const allGood = 
  wrongDays.length === 0 && 
  strengthWorkouts.length === 24 &&
  workouts.length >= 80;

if (allGood) {
  console.log('✅ CSV LOOKS GOOD - READY TO IMPORT');
} else {
  console.log('❌ ISSUES FOUND - DO NOT IMPORT YET');
}
console.log('='.repeat(60));
