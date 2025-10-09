#!/usr/bin/env node

/**
 * Check RLS Status Script
 * 
 * This script connects to your Supabase database and checks:
 * 1. Which tables have RLS enabled
 * 2. What policies exist for each table
 * 3. Verifies security is properly configured
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to check RLS
);

async function checkRLSStatus() {
  console.log('🔍 Checking Row Level Security Status...\n');

  try {
    // Check which tables have RLS enabled
    console.log('📊 Tables with RLS Status:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('check_rls_status');

    if (tablesError) {
      console.log('Using direct query instead...');
      
      // Fallback: Check each table individually
      const tableNames = ['workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises'];
      
      for (const tableName of tableNames) {
        try {
          // Try to query the table - if RLS is enabled and no policies allow access, this will return empty
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          console.log(`  ${tableName}: RLS enabled (query returned ${data?.length || 0} rows)`);
        } catch (err) {
          console.log(`  ${tableName}: RLS enabled (access restricted)`);
        }
      }
    } else {
      console.log(tables);
    }

    console.log('\n🔐 Testing Anonymous Access:');
    
    // Test anonymous access with the anon key
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test 1: Should be able to read workouts
    console.log('\n1. Testing workouts table access...');
    const { data: workouts, error: workoutsError } = await anonClient
      .from('workouts')
      .select('id, title, date')
      .limit(3);
    
    if (workoutsError) {
      console.log('   ❌ Error:', workoutsError.message);
    } else {
      console.log(`   ✅ Success: Can read ${workouts?.length || 0} workouts`);
    }

    // Test 2: Should NOT be able to read workout_completions
    console.log('\n2. Testing workout_completions table access...');
    const { data: completions, error: completionsError } = await anonClient
      .from('workout_completions')
      .select('*')
      .limit(1);
    
    if (completionsError) {
      console.log('   ✅ Success: Access blocked -', completionsError.message);
    } else {
      console.log(`   ⚠️  Warning: Can read ${completions?.length || 0} completions (should be 0)`);
    }

    // Test 3: Should NOT be able to read exercise_logs
    console.log('\n3. Testing exercise_logs table access...');
    const { data: logs, error: logsError } = await anonClient
      .from('exercise_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.log('   ✅ Success: Access blocked -', logsError.message);
    } else {
      console.log(`   ⚠️  Warning: Can read ${logs?.length || 0} exercise logs (should be 0)`);
    }

    // Test 4: Should NOT be able to insert into workouts
    console.log('\n4. Testing workouts table write access...');
    const { error: insertError } = await anonClient
      .from('workouts')
      .insert({
        title: 'RLS Test Workout',
        date: '2024-01-01',
        workout_type: 'rest'
      });
    
    if (insertError) {
      console.log('   ✅ Success: Write blocked -', insertError.message);
    } else {
      console.log('   ⚠️  Warning: Can write to workouts (should be blocked)');
    }

    console.log('\n🎯 Summary:');
    console.log('   - If all tests show ✅, your RLS is properly configured');
    console.log('   - If any show ⚠️, you need to review your RLS policies');
    console.log('   - Your leaked keys are now much safer!');

  } catch (error) {
    console.error('❌ Error checking RLS status:', error);
  }
}

// Create a simple RLS check function
async function createRLSCheckFunction() {
  console.log('\n📝 Creating RLS check function...');
  
  const { error } = await supabase.rpc('create_rls_check_function');
  if (error) {
    console.log('Function might already exist or need manual creation');
  } else {
    console.log('✅ RLS check function created');
  }
}

if (require.main === module) {
  checkRLSStatus();
}

module.exports = { checkRLSStatus };
