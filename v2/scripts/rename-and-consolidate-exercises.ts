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

interface RenameMapping {
  oldName: string
  newName: string
  thumbnailUrl?: string // Programme.app URL to fetch thumbnail from
}

interface ConsolidationMapping {
  keepName: string
  removeNames: string[]
  thumbnailUrl?: string
}

// Exercises to rename
const renames: RenameMapping[] = [
  { 
    oldName: 'Standing Banded Face Pull Video Exercise Guide',
    newName: 'Face Pulls',
    thumbnailUrl: 'https://programme.app/exercises/banded-facepulls/76'
  },
  { 
    oldName: 'Kettlebell Wood Chopper Exercise Guide',
    newName: 'Kettlebell Wood Chopper',
    thumbnailUrl: 'https://programme.app/exercises/half-kneeling-kb-cross-chops/391'
  },
  { 
    oldName: 'Flutter Kick - Olympic Weightlifting Exercise Library: Demo Videos, Information & More - Catalyst Athletics',
    newName: 'Flutter Kicks',
    thumbnailUrl: 'https://programme.app/exercises/hollow-body-flutters/450'
  },
  { 
    oldName: 'Dead Hang - Unilateral - [P]rehab',
    newName: 'Dead Hang',
    thumbnailUrl: 'https://programme.app/exercises/active-hang/19'
  },
  { 
    oldName: 'Band Pull Apart - [P]rehab',
    newName: 'Band Pull Apart',
    thumbnailUrl: 'https://programme.app/exercises/banded-pull-aparts/87'
  },
  { 
    oldName: 'Lever Landmine One Arm Press (plate loaded)',
    newName: 'Landmine Press'
  },
  { 
    oldName: 'supine dead bug',
    newName: 'Dead Bug'
  }
]

// Exercises to consolidate (keep one, remove others)
const consolidations: ConsolidationMapping[] = [
  {
    keepName: 'Bosu Balance',
    removeNames: ['BOSU Ball Single Leg Balance']
  },
  {
    keepName: 'Glute Bridge',
    removeNames: ['Glute Bridges']
  },
  {
    keepName: 'Side Plank',
    removeNames: ['Side Planks']
  },
  {
    keepName: 'Ankle Alphabet',
    removeNames: ['Ankle Circles']
  }
]

async function renameExercise(oldName: string, newName: string): Promise<boolean> {
  try {
    // Check if new name already exists
    const { data: existing } = await supabase
      .from('exercise_library')
      .select('id, name')
      .eq('name', newName)
      .maybeSingle()

    if (existing) {
      console.log(`  ⚠️  Exercise "${newName}" already exists. Skipping rename.`)
      return false
    }

    // Check if old name exists
    const { data: oldExercise } = await supabase
      .from('exercise_library')
      .select('id, name, thumbnail_path')
      .eq('name', oldName)
      .maybeSingle()

    if (!oldExercise) {
      console.log(`  ⚠️  Exercise "${oldName}" not found. Skipping.`)
      return false
    }

    // Update the name
    const { error } = await supabase
      .from('exercise_library')
      .update({ name: newName })
      .eq('id', oldExercise.id)

    if (error) {
      console.error(`  ❌ Error renaming: ${error.message}`)
      return false
    }

    console.log(`  ✅ Renamed: "${oldName}" → "${newName}"`)
    return true
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`)
    return false
  }
}

async function consolidateExercises(keepName: string, removeNames: string[]): Promise<boolean> {
  try {
    // Get the exercise to keep
    const { data: keepExercise } = await supabase
      .from('exercise_library')
      .select('id, name, thumbnail_path, description, injury_areas, body_parts, equipment, demo_file_path, external_video_url, difficulty, notes')
      .eq('name', keepName)
      .maybeSingle()

    if (!keepExercise) {
      console.log(`  ⚠️  Exercise "${keepName}" not found. Skipping consolidation.`)
      return false
    }

    // Get exercises to remove
    const { data: removeExercises } = await supabase
      .from('exercise_library')
      .select('id, name, thumbnail_path, description, injury_areas, body_parts, equipment, demo_file_path, external_video_url, difficulty, notes')
      .in('name', removeNames)

    if (!removeExercises || removeExercises.length === 0) {
      console.log(`  ℹ️  No exercises to remove found.`)
      return true
    }

    // Merge data from removed exercises into kept exercise if needed
    let needsUpdate = false
    const updateData: any = {}

    for (const removeExercise of removeExercises) {
      // If kept exercise doesn't have thumbnail but removed one does, use it
      if (!keepExercise.thumbnail_path && removeExercise.thumbnail_path) {
        updateData.thumbnail_path = removeExercise.thumbnail_path
        needsUpdate = true
      }

      // Merge other fields if kept exercise is missing them
      if (!keepExercise.description && removeExercise.description) {
        updateData.description = removeExercise.description
        needsUpdate = true
      }

      if (!keepExercise.demo_file_path && removeExercise.demo_file_path) {
        updateData.demo_file_path = removeExercise.demo_file_path
        needsUpdate = true
      }

      if (!keepExercise.external_video_url && removeExercise.external_video_url) {
        updateData.external_video_url = removeExercise.external_video_url
        needsUpdate = true
      }

      // Merge arrays (injury_areas, body_parts, equipment)
      if (removeExercise.injury_areas && removeExercise.injury_areas.length > 0) {
        const current = keepExercise.injury_areas || []
        const merged = [...new Set([...current, ...removeExercise.injury_areas])]
        if (merged.length > current.length) {
          updateData.injury_areas = merged
          needsUpdate = true
        }
      }

      if (removeExercise.body_parts && removeExercise.body_parts.length > 0) {
        const current = keepExercise.body_parts || []
        const merged = [...new Set([...current, ...removeExercise.body_parts])]
        if (merged.length > current.length) {
          updateData.body_parts = merged
          needsUpdate = true
        }
      }

      if (removeExercise.equipment && removeExercise.equipment.length > 0) {
        const current = keepExercise.equipment || []
        const merged = [...new Set([...current, ...removeExercise.equipment])]
        if (merged.length > current.length) {
          updateData.equipment = merged
          needsUpdate = true
        }
      }
    }

    // Update kept exercise if needed
    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('exercise_library')
        .update(updateData)
        .eq('id', keepExercise.id)

      if (updateError) {
        console.error(`  ❌ Error updating kept exercise: ${updateError.message}`)
      } else {
        console.log(`  ✅ Merged data into "${keepName}"`)
      }
    }

    // Delete removed exercises
    const removeIds = removeExercises.map(e => e.id)
    const { error: deleteError } = await supabase
      .from('exercise_library')
      .delete()
      .in('id', removeIds)

    if (deleteError) {
      console.error(`  ❌ Error deleting exercises: ${deleteError.message}`)
      return false
    }

    console.log(`  ✅ Removed ${removeExercises.length} duplicate exercise(s)`)
    return true
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`)
    return false
  }
}

async function updateThumbnailFromProgramme(exerciseName: string, programmeUrl: string): Promise<boolean> {
  try {
    // Import the scraping function from the download script
    // For now, we'll just update the database with the Programme.app URL pattern
    // The actual thumbnail will be downloaded separately
    
    // Get the exercise
    const { data: exercise } = await supabase
      .from('exercise_library')
      .select('id, name')
      .eq('name', exerciseName)
      .maybeSingle()

    if (!exercise) {
      console.log(`  ⚠️  Exercise "${exerciseName}" not found.`)
      return false
    }

    // Extract slug from Programme.app URL
    const slugMatch = programmeUrl.match(/\/exercises\/([^\/]+)\/\d+/)
    if (!slugMatch) {
      console.log(`  ⚠️  Could not extract slug from URL: ${programmeUrl}`)
      return false
    }

    const slug = slugMatch[1]
    const thumbnailPath = `youtube/${slug}/thumbnail.jpg`

    // Update thumbnail path
    const { error } = await supabase
      .from('exercise_library')
      .update({ thumbnail_path: thumbnailPath })
      .eq('id', exercise.id)

    if (error) {
      console.error(`  ❌ Error updating thumbnail: ${error.message}`)
      return false
    }

    console.log(`  ✅ Updated thumbnail path for "${exerciseName}"`)
    return true
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting exercise rename and consolidation...\n')
  console.log('='.repeat(60))

  // Process renames
  console.log('\n📝 Processing renames...\n')
  for (const rename of renames) {
    console.log(`Renaming: "${rename.oldName}" → "${rename.newName}"`)
    const success = await renameExercise(rename.oldName, rename.newName)
    
    // Update thumbnail if URL provided
    if (success && rename.thumbnailUrl) {
      await updateThumbnailFromProgramme(rename.newName, rename.thumbnailUrl)
    }
    console.log('')
  }

  // Process consolidations
  console.log('\n🔄 Processing consolidations...\n')
  for (const consolidation of consolidations) {
    console.log(`Consolidating: Keeping "${consolidation.keepName}", removing: ${consolidation.removeNames.join(', ')}`)
    await consolidateExercises(consolidation.keepName, consolidation.removeNames)
    console.log('')
  }

  console.log('\n✅ Done!')
  console.log('\n📋 Next steps:')
  console.log('  1. Run the download script to fetch thumbnails for renamed exercises')
  console.log('  2. Verify the changes in the database')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

