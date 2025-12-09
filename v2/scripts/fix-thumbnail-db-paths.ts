import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function fixThumbnailPaths() {
  // Get all exercises with Programme.app URLs that have youtube/ prefix in thumbnail_path
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('id, name, external_video_url, thumbnail_path')
    .like('external_video_url', '%programme.app%')
    .like('thumbnail_path', 'youtube/%')
    .order('name')

  if (!exercises) {
    console.error('❌ Failed to fetch exercises')
    return
  }

  console.log(`🔄 Fixing ${exercises.length} thumbnail paths...\n`)

  let successCount = 0
  let errorCount = 0

  for (const ex of exercises) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (match) {
      const slug = match[1]
      // Current: youtube/{slug}/thumbnail.jpg
      // Should be: {slug}/thumbnail.jpg (app will prepend exercise-videos/)
      const newPath = `${slug}/thumbnail.jpg`
      
      const { error } = await supabase
        .from('exercise_library')
        .update({ thumbnail_path: newPath })
        .eq('id', ex.id)

      if (error) {
        console.error(`❌ Error updating "${ex.name}":`, error.message)
        errorCount++
      } else {
        console.log(`✅ ${ex.name}`)
        console.log(`   ${ex.thumbnail_path} → ${newPath}`)
        successCount++
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total: ${exercises.length}`)
}

fixThumbnailPaths()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

