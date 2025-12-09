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

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  const nonProgramme = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []

  console.log(`Found ${nonProgramme.length} exercises to search for on Programme.app\n`)
  console.log('='.repeat(80))
  console.log('EXERCISES TO SEARCH ON https://programme.app/exercises')
  console.log('='.repeat(80))
  console.log('')

  const output: string[] = []
  
  nonProgramme.forEach((exercise, index) => {
    const slug = createSlug(exercise.name)
    const searchUrl = `https://programme.app/exercises?q=${encodeURIComponent(exercise.name)}`
    const tryUrl = `https://programme.app/exercises/${slug}`
    
    console.log(`${index + 1}. ${exercise.name}`)
    console.log(`   Search: ${searchUrl}`)
    console.log(`   Try: ${tryUrl}`)
    console.log('')
    
    output.push(`${exercise.name}|${searchUrl}|${tryUrl}`)
  })

  // Save to file
  fs.writeFileSync('programme-search-list.txt', output.join('\n'))
  console.log('='.repeat(80))
  console.log(`\n💾 List saved to programme-search-list.txt`)
  console.log(`\n📋 Total: ${nonProgramme.length} exercises`)
  console.log('\n💡 Tips:')
  console.log('   - Visit https://programme.app/exercises')
  console.log('   - Use the search function or browse by category')
  console.log('   - When you find a match, note the URL format: /exercises/{slug}/{id}')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

