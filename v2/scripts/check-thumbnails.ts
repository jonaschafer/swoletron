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

async function checkThumbnails() {
  // Get all exercises with Programme.app URLs
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url, thumbnail_path')
    .like('external_video_url', '%programme.app%')
    .order('name')

  if (!exercises) {
    console.error('❌ Failed to fetch exercises')
    return
  }

  console.log(`📊 Checking ${exercises.length} exercises with Programme.app URLs...\n`)

  const issues: Array<{ name: string; url: string; thumbnail: string | null; issue: string }> = []

  for (const ex of exercises) {
    const url = ex.external_video_url || ''
    const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
    
    if (match) {
      const slug = match[1]
      const expectedThumbnail = `youtube/${slug}/thumbnail.jpg`
      
      if (!ex.thumbnail_path || ex.thumbnail_path !== expectedThumbnail) {
        issues.push({
          name: ex.name,
          url: url,
          thumbnail: ex.thumbnail_path,
          issue: `Expected: ${expectedThumbnail}, Got: ${ex.thumbnail_path || 'null'}`
        })
      }
    }
  }

  if (issues.length > 0) {
    console.log(`⚠️  Found ${issues.length} exercises with thumbnail issues:\n`)
    issues.forEach(issue => {
      console.log(`❌ ${issue.name}`)
      console.log(`   URL: ${issue.url}`)
      console.log(`   ${issue.issue}\n`)
    })
  } else {
    console.log('✅ All thumbnails are correctly set!')
  }

  // Check Wall Sit specifically
  const wallSit = exercises.find(ex => 
    ex.name.toLowerCase().includes('wall') && ex.name.toLowerCase().includes('sit')
  )

  if (wallSit) {
    console.log('\n' + '='.repeat(80))
    console.log('🔍 Wall Sit Details:')
    console.log(`   Name: ${wallSit.name}`)
    console.log(`   URL: ${wallSit.external_video_url}`)
    console.log(`   Thumbnail: ${wallSit.thumbnail_path || 'null'}`)
    
    const match = (wallSit.external_video_url || '').match(/\/exercises\/([^\/]+)\/(\d+)$/)
    if (match) {
      const slug = match[1]
      const expectedThumbnail = `youtube/${slug}/thumbnail.jpg`
      console.log(`   Expected Thumbnail: ${expectedThumbnail}`)
      
      if (wallSit.thumbnail_path !== expectedThumbnail) {
        console.log(`   ⚠️  Thumbnail path needs updating!`)
      }
    }
  }
}

checkThumbnails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

