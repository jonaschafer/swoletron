import * as fs from 'fs'

const matches = JSON.parse(fs.readFileSync('programme-matched-exercises.json', 'utf-8'))

// Obviously wrong matches to exclude
const wrongMatches = new Set([
  'Calf Raise', // → Front Raises (wrong)
  'Chest Press', // → Strict Press (wrong)
  'Inverted Rows', // → Inverted Plank (wrong)
  'Kettlebell Swings', // → Kettlebell Arm Bar (wrong)
  'Push Press', // → Bench Press (wrong)
  'Romanian Deadlifts (RDL)', // → Deadlift (wrong, should be RDL)
  'Single-leg Romanian Deadlift', // → Deadlift (wrong, should be single leg RDL)
  'Single-Leg Hopping', // → Single Leg Ring Plank (wrong)
  'Medicine Ball Lateral Bound', // → Lateral Banded Walks (wrong)
  'Plank-ups', // → Plank (wrong, plank-ups is different)
  'Balance Pad Single Leg Stance', // → Single Leg Step Up (might be wrong)
  'Banded Active Dorsiflexion', // → Banded Adduction (wrong)
  'Box Step-Ups', // → Patrick Step Ups (might be wrong)
  'Step-Downs', // → Curtsy Step Down (might be wrong)
  'Step-Ups', // → Patrick Step Ups (might be wrong)
])

const goodMatches = matches.matches.filter((m: any) => {
  // Exclude wrong matches
  if (wrongMatches.has(m.exercise)) {
    return false
  }
  
  // Exclude low confidence matches (< 70%)
  if (m.confidence < 70) {
    return false
  }
  
  return true
})

const questionableMatches = matches.matches.filter((m: any) => {
  // Include wrong matches
  if (wrongMatches.has(m.exercise)) {
    return true
  }
  
  // Include low confidence matches
  if (m.confidence < 70) {
    return true
  }
  
  return false
})

const output = {
  goodMatches,
  questionableMatches,
  notFound: matches.notFound,
  summary: {
    total: matches.matches.length,
    good: goodMatches.length,
    questionable: questionableMatches.length,
    notFound: matches.notFound.length
  }
}

fs.writeFileSync('programme-filtered-matches.json', JSON.stringify(output, null, 2))

console.log('✅ Filtered matches:')
console.log(`   Good matches: ${goodMatches.length}`)
console.log(`   Questionable: ${questionableMatches.length}`)
console.log(`   Not found: ${matches.notFound.length}`)
console.log('\n💾 Saved to programme-filtered-matches.json')
console.log('\n📋 Good matches:')
goodMatches.forEach((m: any) => {
  console.log(`   ✅ ${m.exercise} → ${m.programmeName} (${m.confidence}%)`)
})
console.log('\n⚠️  Questionable matches (review needed):')
questionableMatches.forEach((m: any) => {
  console.log(`   ⚠️  ${m.exercise} → ${m.programmeName} (${m.confidence}%)`)
})

