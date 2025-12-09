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

async function checkStorage() {
  // Get a sample exercise with Programme.app URL
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url, thumbnail_path')
    .like('external_video_url', '%programme.app%')
    .limit(5)

  if (!exercises || exercises.length === 0) {
    console.log('No exercises found')
    return
  }

  console.log('Checking thumbnail storage...\n')

  for (const ex of exercises) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (match) {
      const slug = match[1]
      const dbPath = ex.thumbnail_path || 'null'
      
      // Check where file actually is
      const path1 = `${slug}/thumbnail.jpg` // Where we uploaded
      const path2 = `youtube/${slug}/thumbnail.jpg` // What app expects
      
      console.log(`\n${ex.name}:`)
      console.log(`  Database path: ${dbPath}`)
      console.log(`  URL slug: ${slug}`)
      
      // Try to list files
      try {
        const { data: files1 } = await supabase.storage
          .from('exercise-videos')
          .list(slug, { limit: 1 })
        
        const { data: files2 } = await supabase.storage
          .from('exercise-videos')
          .list(`youtube/${slug}`, { limit: 1 })
        
        console.log(`  Files at ${slug}/: ${files1?.length || 0}`)
        console.log(`  Files at youtube/${slug}/: ${files2?.length || 0}`)
        
        if (files1 && files1.length > 0) {
          console.log(`  ✅ File exists at: ${slug}/thumbnail.jpg`)
        } else if (files2 && files2.length > 0) {
          console.log(`  ✅ File exists at: youtube/${slug}/thumbnail.jpg`)
        } else {
          console.log(`  ❌ File not found at either location`)
        }
      } catch (err: any) {
        console.log(`  ⚠️  Error checking: ${err.message}`)
      }
    }
  }
}

checkStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

