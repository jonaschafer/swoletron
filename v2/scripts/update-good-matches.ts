import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function updateGoodMatches() {
  const data = JSON.parse(fs.readFileSync('programme-filtered-matches.json', 'utf-8'))
  const goodMatches = data.goodMatches

  console.log(`🔄 Updating ${goodMatches.length} exercises with Programme.app URLs...\n`)

  let successCount = 0
  let errorCount = 0

  for (const match of goodMatches) {
    try {
      const { data: exercise, error } = await supabase
        .from('exercise_library')
        .update({ external_video_url: match.programmeUrl })
        .eq('name', match.exercise)
        .select()

      if (error) {
        console.error(`❌ Error updating "${match.exercise}":`, error.message)
        errorCount++
      } else if (exercise && exercise.length > 0) {
        console.log(`✅ Updated: ${match.exercise} → ${match.programmeUrl}`)
        successCount++
      } else {
        console.warn(`⚠️  Exercise not found: "${match.exercise}"`)
        errorCount++
      }
    } catch (err: any) {
      console.error(`❌ Error updating "${match.exercise}":`, err.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Errors/Not found: ${errorCount}`)
  console.log(`📊 Total: ${goodMatches.length}`)
}

updateGoodMatches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

