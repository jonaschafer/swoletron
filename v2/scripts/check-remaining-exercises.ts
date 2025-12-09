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

async function checkRemaining() {
  // Get all exercises
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  if (!exercises) {
    console.error('❌ Failed to fetch exercises')
    return
  }

  // Categorize exercises
  const withProgramme = exercises.filter(ex => 
    ex.external_video_url && ex.external_video_url.includes('programme.app')
  )
  
  const withoutProgramme = exercises.filter(ex => 
    !ex.external_video_url || !ex.external_video_url.includes('programme.app')
  )

  // Load the filtered matches to see what's pending
  let questionableMatches: any[] = []
  let notFound: string[] = []
  
  if (fs.existsSync('programme-filtered-matches.json')) {
    const data = JSON.parse(fs.readFileSync('programme-filtered-matches.json', 'utf-8'))
    questionableMatches = data.questionableMatches || []
    notFound = data.notFound || []
  }

  // Check which questionable matches have been reviewed
  let reviewedApproved: string[] = []
  if (fs.existsSync('programme-review-results.json')) {
    const reviewData = JSON.parse(fs.readFileSync('programme-review-results.json', 'utf-8'))
    reviewedApproved = (reviewData.approved || []).map((a: any) => a.exercise)
  }

  // Separate pending review vs truly not found
  const pendingReview = questionableMatches
    .filter(m => !reviewedApproved.includes(m.exercise))
    .map(m => m.exercise)
  
  const stillNotFound = notFound.filter(name => 
    withoutProgramme.some(ex => ex.name === name)
  )

  console.log('📊 Exercise Status Summary\n')
  console.log('='.repeat(80))
  console.log(`✅ With Programme.app URL: ${withProgramme.length}`)
  console.log(`❌ Without Programme.app URL: ${withoutProgramme.length}`)
  console.log(`\n📋 Breakdown:`)
  console.log(`   - Pending review (questionable matches): ${pendingReview.length}`)
  console.log(`   - Not found in Programme.app: ${stillNotFound.length}`)
  console.log(`   - Other (have different external URLs): ${withoutProgramme.length - pendingReview.length - stillNotFound.length}`)

  if (pendingReview.length > 0) {
    console.log(`\n⏳ Pending Review (${pendingReview.length}):`)
    pendingReview.forEach(name => {
      const match = questionableMatches.find(m => m.exercise === name)
      if (match) {
        console.log(`   - ${name}`)
        console.log(`     → Suggested: ${match.programmeName} (${match.confidence}%)`)
        console.log(`     → URL: ${match.programmeUrl}`)
      } else {
        console.log(`   - ${name}`)
      }
    })
  }

  if (stillNotFound.length > 0) {
    console.log(`\n❌ Not Found in Programme.app (${stillNotFound.length}):`)
    stillNotFound.forEach(name => {
      console.log(`   - ${name}`)
    })
  }

  // Show exercises with other external URLs
  const withOtherUrls = withoutProgramme.filter(ex => 
    ex.external_video_url && 
    !ex.external_video_url.includes('programme.app') &&
    !pendingReview.includes(ex.name) &&
    !stillNotFound.includes(ex.name)
  )

  if (withOtherUrls.length > 0) {
    console.log(`\n🔗 Have Other External URLs (${withOtherUrls.length}):`)
    withOtherUrls.slice(0, 10).forEach(ex => {
      console.log(`   - ${ex.name}`)
      console.log(`     → ${ex.external_video_url}`)
    })
    if (withOtherUrls.length > 10) {
      console.log(`   ... and ${withOtherUrls.length - 10} more`)
    }
  }

  // Save summary
  const summary = {
    total: exercises.length,
    withProgramme: withProgramme.length,
    withoutProgramme: withoutProgramme.length,
    pendingReview: pendingReview.length,
    notFound: stillNotFound.length,
    withOtherUrls: withOtherUrls.length,
    pendingReviewList: pendingReview,
    notFoundList: stillNotFound,
    timestamp: new Date().toISOString()
  }

  fs.writeFileSync('exercise-status-summary.json', JSON.stringify(summary, null, 2))
  console.log(`\n💾 Summary saved to exercise-status-summary.json`)
}

checkRemaining()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

