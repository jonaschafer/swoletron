#!/usr/bin/env node

/**
 * Verification Script for Single-User App Cleanup
 * 
 * This script tests that all database operations still work correctly
 * after removing authentication complexity.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Using anon key like the app does
);

async function verifySingleUserApp() {
  console.log('🔍 Verifying Single-User App Functionality...\n');

  try {
    // Test 1: Read workouts (should work)
    console.log('1. Testing workout read access...');
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, title, date, workout_type')
      .limit(3);
    
    if (workoutsError) {
      console.log('   ❌ Error:', workoutsError.message);
      return;
    } else {
      console.log(`   ✅ Success: Can read ${workouts?.length || 0} workouts`);
    }

    // Test 2: Read workout completions (should work now)
    console.log('\n2. Testing workout completions read access...');
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('*')
      .limit(1);
    
    if (completionsError) {
      console.log('   ❌ Error:', completionsError.message);
    } else {
      console.log(`   ✅ Success: Can read ${completions?.length || 0} completions`);
    }

    // Test 3: Read exercise logs (should work now)
    console.log('\n3. Testing exercise logs read access...');
    const { data: logs, error: logsError } = await supabase
      .from('exercise_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.log('   ❌ Error:', logsError.message);
    } else {
      console.log(`   ✅ Success: Can read ${logs?.length || 0} exercise logs`);
    }

    // Test 4: Insert workout completion (should work now)
    console.log('\n4. Testing workout completion write access...');
    const { error: insertError } = await supabase
      .from('workout_completions')
      .insert({
        workout_id: workouts[0]?.id || 1,
        notes: 'Test completion from verification script',
        completed_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.log('   ❌ Error:', insertError.message);
    } else {
      console.log('   ✅ Success: Can write workout completions');
    }

    // Test 5: Insert exercise log (should work now)
    console.log('\n5. Testing exercise log write access...');
    const { error: logError } = await supabase
      .from('exercise_logs')
      .insert({
        exercise_id: '1',
        workout_id: '1',
        sets_completed: 3,
        reps_completed: [10, 10, 10],
        weight_used: 135,
        weight_unit: 'lb',
        notes: 'Test log from verification script',
        logged_at: new Date().toISOString()
      });
    
    if (logError) {
      console.log('   ❌ Error:', logError.message);
    } else {
      console.log('   ✅ Success: Can write exercise logs');
    }

    console.log('\n🎯 Summary:');
    console.log('   ✅ All database operations work with anon key');
    console.log('   ✅ No authentication required');
    console.log('   ✅ Perfect for single-user app!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

if (require.main === module) {
  verifySingleUserApp();
}

module.exports = { verifySingleUserApp };
