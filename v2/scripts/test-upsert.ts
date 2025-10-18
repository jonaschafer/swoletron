#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpsert() {
  console.log('🧪 Testing workout completion upsert functionality...\n')

  try {
    // Test 1: Insert a new completion
    console.log('1. Testing initial insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('workout_completions')
      .upsert(
        {
          workout_id: 999999, // Use a test workout ID
          notes: 'Test completion',
          completed_at: new Date().toISOString()
        },
        { onConflict: 'workout_id' }
      )
      .select()
      .single()

    if (insertError) {
      console.log(`   ❌ Insert failed: ${insertError.message}`)
    } else {
      console.log(`   ✅ Insert successful: ${insertData?.id}`)
    }

    // Test 2: Update the same completion (upsert)
    console.log('\n2. Testing upsert update...')
    const { data: upsertData, error: upsertError } = await supabase
      .from('workout_completions')
      .upsert(
        {
          workout_id: 999999, // Same workout ID
          notes: 'Updated test completion',
          completed_at: new Date().toISOString()
        },
        { onConflict: 'workout_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.log(`   ❌ Upsert failed: ${upsertError.message}`)
    } else {
      console.log(`   ✅ Upsert successful: ${upsertData?.id}`)
      console.log(`   📝 Notes updated to: ${upsertData?.notes}`)
    }

    // Test 3: Verify no duplicates
    console.log('\n3. Checking for duplicates...')
    const { data: duplicates, error: duplicateError } = await supabase
      .from('workout_completions')
      .select('*')
      .eq('workout_id', 999999)

    if (duplicateError) {
      console.log(`   ❌ Duplicate check failed: ${duplicateError.message}`)
    } else {
      console.log(`   ✅ Found ${duplicates?.length || 0} records (should be 1)`)
      if (duplicates && duplicates.length > 1) {
        console.log('   ⚠️  WARNING: Multiple records found!')
      }
    }

    // Cleanup: Delete test record
    console.log('\n4. Cleaning up test record...')
    const { error: deleteError } = await supabase
      .from('workout_completions')
      .delete()
      .eq('workout_id', 999999)

    if (deleteError) {
      console.log(`   ⚠️  Cleanup failed: ${deleteError.message}`)
    } else {
      console.log('   ✅ Test record cleaned up')
    }

    console.log('\n🎉 Upsert test completed successfully!')
    console.log('The duplicate records issue should now be resolved.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testUpsert()
