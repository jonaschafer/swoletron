import * as fs from 'fs'
import * as readline from 'readline'

const data = JSON.parse(fs.readFileSync('programme-filtered-matches.json', 'utf-8'))
const questionableMatches = data.questionableMatches

interface ReviewResult {
  exercise: string
  programmeUrl: string | null
  approved: boolean
}

async function reviewMatches() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve))
  }

  const results: ReviewResult[] = []

  console.log('📋 Review Questionable Matches\n')
  console.log('For each match, review the Programme.app URL and decide:')
  console.log('  - Type "y" or "yes" to approve the match')
  console.log('  - Type "n" or "no" to reject it')
  console.log('  - Type "s" or "skip" to skip for now')
  console.log('  - Type "q" or "quit" to save and exit\n')
  console.log('='.repeat(80) + '\n')

  for (let i = 0; i < questionableMatches.length; i++) {
    const match = questionableMatches[i]
    
    console.log(`\n[${i + 1}/${questionableMatches.length}]`)
    console.log(`Your Exercise: "${match.exercise}"`)
    console.log(`Matched To: "${match.programmeName}" (${match.confidence}% confidence)`)
    console.log(`URL: ${match.programmeUrl}`)
    console.log(`\n🔗 Open in browser: ${match.programmeUrl}`)
    
    const answer = await question('\nApprove this match? (y/n/s/q): ')
    const lowerAnswer = answer.toLowerCase().trim()

    if (lowerAnswer === 'q' || lowerAnswer === 'quit') {
      console.log('\n💾 Saving progress and exiting...')
      break
    }

    if (lowerAnswer === 's' || lowerAnswer === 'skip') {
      console.log('⏭️  Skipped')
      results.push({
        exercise: match.exercise,
        programmeUrl: null,
        approved: false
      })
      continue
    }

    if (lowerAnswer === 'y' || lowerAnswer === 'yes') {
      console.log('✅ Approved')
      results.push({
        exercise: match.exercise,
        programmeUrl: match.programmeUrl,
        approved: true
      })
    } else if (lowerAnswer === 'n' || lowerAnswer === 'no') {
      console.log('❌ Rejected')
      results.push({
        exercise: match.exercise,
        programmeUrl: null,
        approved: false
      })
    } else {
      console.log('⚠️  Invalid input, skipping...')
      results.push({
        exercise: match.exercise,
        programmeUrl: null,
        approved: false
      })
    }
  }

  rl.close()

  // Save results
  const approved = results.filter(r => r.approved)
  const rejected = results.filter(r => !r.approved && r.programmeUrl === null)

  const output = {
    approved: approved.map(r => ({
      exercise: r.exercise,
      programmeUrl: r.programmeUrl
    })),
    rejected: rejected.map(r => r.exercise),
    timestamp: new Date().toISOString()
  }

  fs.writeFileSync('programme-review-results.json', JSON.stringify(output, null, 2))

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Approved: ${approved.length}`)
  console.log(`❌ Rejected: ${rejected.length}`)
  console.log(`💾 Results saved to programme-review-results.json`)
  console.log('\n💡 Next step: Run `npx tsx scripts/update-reviewed-matches.ts` to apply approved matches')
}

reviewMatches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

