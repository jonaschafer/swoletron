'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopNavigationBar } from '@/app/components/TopNavigationBar'
import { ContentTabs } from '@/app/components/ContentTabs'
import { ExerciseLibraryCard } from '@/app/components/ExerciseLibraryCard'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { getExerciseLibrary, ExerciseLibraryEntry, BODY_REGION_GROUPS } from '@/lib/supabase'

type FilterType = 'injury' | 'body' | 'equipment'

export default function ExercisesPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<ExerciseLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilterType, setActiveFilterType] = useState<FilterType>('injury')
  const [selectedInjuryArea, setSelectedInjuryArea] = useState<string | null>(null)
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)

  useEffect(() => {
    async function loadExercises() {
      try {
        setLoading(true)
        const data = await getExerciseLibrary()
        setExercises(data)
      } catch (error) {
        console.error('Failed to load exercises:', error)
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [])

  const handleViewChange = (view: 'week' | 'month') => {
    if (view === 'week') {
      router.push('/calendar')
    } else {
      router.push('/monthly')
    }
  }

  // Extract unique values for filters
  const uniqueInjuryAreas = useMemo(() => {
    const areas = new Set<string>()
    exercises.forEach(ex => {
      ex.injury_areas?.forEach(area => areas.add(area))
    })
    return Array.from(areas).sort()
  }, [exercises])

  const uniqueEquipment = useMemo(() => {
    const equip = new Set<string>()
    exercises.forEach(ex => {
      ex.equipment?.forEach(eq => equip.add(eq))
    })
    return Array.from(equip).sort()
  }, [exercises])

  // Filter exercises based on search and active filters
  const filteredExercises = useMemo(() => {
    let filtered = [...exercises]

    // Apply search filter (independent of other filters)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.description?.toLowerCase().includes(query)
      )
    } else {
      // Apply category filters only when not searching
      if (activeFilterType === 'injury' && selectedInjuryArea) {
        filtered = filtered.filter(ex =>
          ex.injury_areas?.includes(selectedInjuryArea)
        )
      } else if (activeFilterType === 'body' && selectedBodyRegion) {
        const bodyParts = BODY_REGION_GROUPS[selectedBodyRegion as keyof typeof BODY_REGION_GROUPS]
        filtered = filtered.filter(ex =>
          ex.body_parts?.some(part => bodyParts.includes(part))
        )
      } else if (activeFilterType === 'equipment' && selectedEquipment) {
        filtered = filtered.filter(ex =>
          ex.equipment?.includes(selectedEquipment)
        )
      }
    }

    return filtered
  }, [exercises, searchQuery, activeFilterType, selectedInjuryArea, selectedBodyRegion, selectedEquipment])

  const handleFilterTypeChange = (type: FilterType) => {
    setActiveFilterType(type)
    // Clear selections when switching filter types
    setSelectedInjuryArea(null)
    setSelectedBodyRegion(null)
    setSelectedEquipment(null)
  }

  // Reverse lookup: find which body region group contains a body part
  const getBodyRegionForBodyPart = (bodyPart: string): string | null => {
    for (const [region, parts] of Object.entries(BODY_REGION_GROUPS)) {
      if (parts.includes(bodyPart.toLowerCase())) {
        return region
      }
    }
    return null
  }

  // Filter handler functions for tag clicks
  const handleInjuryAreaClick = (area: string) => {
    setSearchQuery('') // Clear search to show filtered results
    setActiveFilterType('injury')
    setSelectedInjuryArea(area)
    setSelectedBodyRegion(null)
    setSelectedEquipment(null)
  }

  const handleBodyPartClick = (bodyPart: string) => {
    const region = getBodyRegionForBodyPart(bodyPart)
    if (region) {
      setSearchQuery('') // Clear search to show filtered results
      setActiveFilterType('body')
      setSelectedBodyRegion(region)
      setSelectedInjuryArea(null)
      setSelectedEquipment(null)
    }
  }

  const handleEquipmentClick = (equipment: string) => {
    setSearchQuery('') // Clear search to show filtered results
    setActiveFilterType('equipment')
    setSelectedEquipment(equipment)
    setSelectedInjuryArea(null)
    setSelectedBodyRegion(null)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <TopNavigationBar
          currentView="week"
          miles="0 miles"
          onViewChange={handleViewChange}
          hideMiles={true}
          hideDropdown={true}
        />

        {/* Content Tabs */}
        <ContentTabs />

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Exercise Library
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search exercises by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleFilterTypeChange('injury')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilterType === 'injury'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Injury Area
            </button>
            <button
              onClick={() => handleFilterTypeChange('body')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilterType === 'body'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Body Region
            </button>
            <button
              onClick={() => handleFilterTypeChange('equipment')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilterType === 'equipment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Equipment
            </button>
          </div>

          {/* Filter Options */}
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilterType === 'injury' && (
              <>
                <button
                  onClick={() => setSelectedInjuryArea(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedInjuryArea === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {uniqueInjuryAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedInjuryArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedInjuryArea === area
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </>
            )}

            {activeFilterType === 'body' && (
              <>
                <button
                  onClick={() => setSelectedBodyRegion(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedBodyRegion === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {Object.keys(BODY_REGION_GROUPS).map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedBodyRegion(region)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedBodyRegion === region
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </>
            )}

            {activeFilterType === 'equipment' && (
              <>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedEquipment === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {uniqueEquipment.map((equip) => (
                  <button
                    key={equip}
                    onClick={() => setSelectedEquipment(equip)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedEquipment === equip
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {equip.replace(/_/g, ' ')}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Exercise Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading exercises...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No exercises found matching your search.' : 'No exercises found for the selected filter.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <ExerciseLibraryCard
                  key={exercise.id}
                  exercise={exercise}
                  onInjuryAreaClick={handleInjuryAreaClick}
                  onBodyPartClick={handleBodyPartClick}
                  onEquipmentClick={handleEquipmentClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

