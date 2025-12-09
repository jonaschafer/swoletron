#!/usr/bin/env ts-node

/**
 * Helper script to get the weekly_summary view definition from Supabase
 * Run this to get the SELECT statement needed for the migration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getWeeklySummaryDefinition() {
  console.log('🔍 Fetching weekly_summary view definition...\n');

  try {
    // Query the view definition using pg_get_viewdef
    const { data, error } = await supabase.rpc('exec_sql', {
      query: "SELECT pg_get_viewdef('weekly_summary', true) as definition;"
    });

    if (error) {
      // Try alternative approach - direct query
      const { data: directData, error: directError } = await supabase
        .from('_realtime')
        .select('*')
        .limit(0); // This is just to test connection

      if (directError) {
        console.error('❌ Error connecting to Supabase:', directError.message);
        console.log('\n📝 Manual approach:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Run this query:');
        console.log("   SELECT pg_get_viewdef('weekly_summary', true);");
        console.log('3. Copy the result and paste it into the migration file');
        return;
      }

      // If connection works but RPC doesn't, provide manual instructions
      console.log('⚠️  Could not execute RPC function. Use manual approach:\n');
      console.log('📝 Manual Steps:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Run this query:');
      console.log("   SELECT pg_get_viewdef('weekly_summary', true);");
      console.log('3. Copy the SELECT statement from the result');
      console.log('4. Replace the placeholder in: supabase/migrations/20251204_cleanup_rls_policies.sql');
      console.log('5. Uncomment the CREATE VIEW statement and paste the SELECT');
      return;
    }

    if (data && data.length > 0 && data[0].definition) {
      console.log('✅ Found view definition:\n');
      console.log('='.repeat(60));
      console.log(data[0].definition);
      console.log('='.repeat(60));
      console.log('\n📋 Next steps:');
      console.log('1. Copy the SELECT statement above');
      console.log('2. Open: supabase/migrations/20251204_cleanup_rls_policies.sql');
      console.log('3. Find the CREATE VIEW section (around line 80)');
      console.log('4. Uncomment the CREATE VIEW statement');
      console.log('5. Paste the SELECT statement after "AS"');
    } else {
      console.log('⚠️  View definition not found. The view might not exist.');
      console.log('   If the view is not needed, you can skip step 3 in the migration.');
    }
  } catch (err) {
    console.error('❌ Error:', err);
    console.log('\n📝 Manual approach:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run this query:');
    console.log("   SELECT pg_get_viewdef('weekly_summary', true);");
    console.log('3. Copy the result and paste it into the migration file');
  }
}

if (require.main === module) {
  getWeeklySummaryDefinition();
}

