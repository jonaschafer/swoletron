import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('='.repeat(60));
  console.log('🗄️  DATABASE VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log();

  try {
    // Get all workouts
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    if (!workouts || workouts.length === 0) {
      console.log('❌ NO WORKOUTS FOUND IN DATABASE');
      console.log('Run the import script: npm run import');
      return;
    }

    console.log('📈 BASIC STATS:');
    console.log(`Total workouts in database: ${workouts.length}`);
    console.log(`Expected: ~84 workouts`);
    console.log();

    // Count by week
    const weekCounts = workouts.reduce((acc: any, w: any) => {
      acc[w.week] = (acc[w.week] || 0) + 1;
      return acc;
    }, {});

    console.log('📅 WORKOUTS PER WEEK:');
    Object.keys(weekCounts).sort((a, b) => Number(a) - Number(b)).forEach(week => {
      console.log(`Week ${week}: ${weekCounts[week]} workouts`);
    });
    console.log();

    // Strength sessions
    const strengthWorkouts = workouts.filter((w: any) => 
      w.workout_type?.toLowerCase().includes('strength') || w.exercises
    );

    console.log('💪 STRENGTH SESSIONS:');
    console.log(`Total strength sessions: ${strengthWorkouts.length}`);
    console.log(`Expected: 24 sessions (2 per week × 12 weeks)`);
    console.log();

    // Strength by day
    const strengthByDay = strengthWorkouts.reduce((acc: any, w: any) => {
      const day = w.day_of_week;
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    console.log('📆 STRENGTH SESSIONS BY DAY:');
    Object.entries(strengthByDay).forEach(([day, count]) => {
      const emoji = (day === 'Tuesday' || day === 'Thursday') ? '✅' : '❌';
      console.log(`${emoji} ${day}: ${count} sessions`);
    });
    console.log();

    // Check for wrong days
    const wrongDays = strengthWorkouts.filter((w: any) => 
      w.day_of_week !== 'Tuesday' && w.day_of_week !== 'Thursday'
    );

    if (wrongDays.length > 0) {
      console.log('⚠️  WARNING: Strength on wrong days in database:');
      wrongDays.forEach((w: any) => {
        console.log(`  Week ${w.week}, ${w.day_of_week} (${w.date})`);
      });
      console.log();
    } else {
      console.log('✅ All strength sessions on Tuesday/Thursday!');
      console.log();
    }

    // Sample weeks
    console.log('📋 SAMPLE WEEK SCHEDULES FROM DATABASE:');
    for (const weekNum of [1, 5, 9]) {
      console.log(`\n--- WEEK ${weekNum} ---`);
      const weekWorkouts = workouts.filter((w: any) => w.week === weekNum);
      weekWorkouts.forEach((w: any) => {
        const strengthFlag = w.exercises ? ' 💪' : '';
        console.log(`${w.day_of_week}: ${w.workout_type}${strengthFlag}`);
      });
    }
    console.log();

    // Date range
    console.log('📅 DATE RANGE:');
    console.log(`First workout: ${workouts[0].date} (${workouts[0].day_of_week})`);
    console.log(`Last workout: ${workouts[workouts.length - 1].date} (${workouts[workouts.length - 1].day_of_week})`);
    console.log();

    // Final verdict
    console.log('='.repeat(60));
    const allGood = 
      wrongDays.length === 0 && 
      strengthWorkouts.length === 24 &&
      workouts.length >= 80;

    if (allGood) {
      console.log('✅ DATABASE LOOKS GOOD - DATA CORRECTLY IMPORTED');
    } else {
      console.log('❌ ISSUES FOUND - CHECK DATA AND RE-IMPORT IF NEEDED');
    }
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

verifyDatabase();
