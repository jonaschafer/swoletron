'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopNavigationBar } from '@/app/components/TopNavigationBar'
import { ContentTabs } from '@/app/components/ContentTabs'
import { ProgrammeExerciseEmbed } from '@/app/components/ProgrammeExerciseEmbed'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { getAllProgrammeExercises, BODY_REGION_GROUPS } from '@/lib/supabase'

type FilterType = 'injury' | 'body' | 'equipment'
type ProgrammeFilterType = 'equipment'

type ProgrammeExercise = {
  name: string
  url: string
  slug: string
  id: number
}

export default function ProgrammeLibPage() {
  const router = useRouter()
  const [allExercises, setAllExercises] = useState<ProgrammeExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProgrammeMode, setIsProgrammeMode] = useState(true) // Start in programme mode
  const [activeFilterType, setActiveFilterType] = useState<FilterType>('injury')
  const [activeProgrammeFilterType, setActiveProgrammeFilterType] = useState<ProgrammeFilterType>('equipment')
  const [selectedInjuryArea, setSelectedInjuryArea] = useState<string | null>(null)
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProgrammeEquipment, setSelectedProgrammeEquipment] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50 // Performance: show 50 at a time

  useEffect(() => {
    async function loadExercises() {
      try {
        setLoading(true)
        const startTime = performance.now()
        
        const data = await getAllProgrammeExercises()
        
        const loadTime = performance.now() - startTime
        console.log(`[Performance] Loaded ${data.length} exercises in ${loadTime.toFixed(2)}ms`)
        console.log(`[Performance] Data size: ~${(JSON.stringify(data).length / 1024).toFixed(2)}KB`)
        
        setAllExercises(data)
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

  // Extract unique equipment from slugs/names (simple heuristic)
  const uniqueEquipment = useMemo(() => {
    const equip = new Set<string>()
    allExercises.forEach(ex => {
      // Extract equipment keywords from slug/name
      const slug = ex.slug.toLowerCase()
      const name = ex.name.toLowerCase()
      const equipmentKeywords = ['barbell', 'dumbbell', 'kettlebell', 'band', 'cable', 'machine', 'bodyweight', 'plate', 'trx', 'ring', 'box', 'bench', 'ball']
      equipmentKeywords.forEach(keyword => {
        if (slug.includes(keyword) || name.includes(keyword)) {
          equip.add(keyword)
        }
      })
    })
    return Array.from(equip).sort()
  }, [allExercises])

  // Empty arrays for regular filters (not used in programme mode)
  const uniqueInjuryAreas: string[] = []

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    const filterStartTime = performance.now()
    let filtered = [...allExercises]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.slug.toLowerCase().includes(query)
      )
    }

    // Apply equipment filter if in programme mode
    if (isProgrammeMode && activeProgrammeFilterType === 'equipment' && selectedProgrammeEquipment) {
      filtered = filtered.filter(ex => {
        const slug = ex.slug.toLowerCase()
        const name = ex.name.toLowerCase()
        return slug.includes(selectedProgrammeEquipment.toLowerCase()) || 
               name.includes(selectedProgrammeEquipment.toLowerCase())
      })
    }

    const filterTime = performance.now() - filterStartTime
    if (filterTime > 10) {
      console.log(`[Performance] Filtered ${allExercises.length} → ${filtered.length} exercises in ${filterTime.toFixed(2)}ms`)
    }

    return filtered
  }, [allExercises, searchQuery, isProgrammeMode, activeProgrammeFilterType, selectedProgrammeEquipment])

  // Pagination
  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExercises = filteredExercises.slice(startIndex, endIndex)

  // Performance monitoring: Log render info
  useEffect(() => {
    if (paginatedExercises.length > 0) {
      console.log(`[Performance] Rendering ${paginatedExercises.length} exercises (page ${currentPage}/${totalPages})`)
      console.log(`[Performance] Total filtered: ${filteredExercises.length}, Total loaded: ${allExercises.length}`)
    }
  }, [paginatedExercises.length, currentPage, totalPages, filteredExercises.length, allExercises.length])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, isProgrammeMode, activeProgrammeFilterType, selectedProgrammeEquipment])

  const handleFilterTypeChange = (type: FilterType) => {
    setIsProgrammeMode(false)
    setActiveFilterType(type)
    // Clear selections when switching filter types
    setSelectedInjuryArea(null)
    setSelectedBodyRegion(null)
    setSelectedEquipment(null)
    setSelectedCategory(null)
    setSelectedProgrammeEquipment(null)
  }

  const handleProgrammeMode = () => {
    setIsProgrammeMode(true)
    setActiveFilterType('injury') // Reset to default, but won't be active
    setActiveProgrammeFilterType('equipment')
    // Clear all selections
    setSelectedInjuryArea(null)
    setSelectedBodyRegion(null)
    setSelectedEquipment(null)
    setSelectedCategory(null)
    setSelectedProgrammeEquipment(null)
  }

  const handleProgrammeFilterTypeChange = (type: ProgrammeFilterType) => {
    setActiveProgrammeFilterType(type)
    setSelectedCategory(null)
    setSelectedProgrammeEquipment(null)
    setCurrentPage(1) // Reset to first page
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
                !isProgrammeMode && activeFilterType === 'injury'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Injury Area
            </button>
            <button
              onClick={() => handleFilterTypeChange('body')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                !isProgrammeMode && activeFilterType === 'body'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Body Region
            </button>
            <button
              onClick={() => handleFilterTypeChange('equipment')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                !isProgrammeMode && activeFilterType === 'equipment'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Equipment
            </button>
            <button
              onClick={handleProgrammeMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isProgrammeMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              By Programme
            </button>
          </div>

          {/* Filter Options */}
          <div className="mt-4 flex flex-wrap gap-2">
            {isProgrammeMode ? (
              <>
                {/* Programme Mode Filters */}
                {activeProgrammeFilterType === 'equipment' && (
                  <>
                    <button
                      onClick={() => setSelectedProgrammeEquipment(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedProgrammeEquipment === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                    {uniqueEquipment.map((equip) => (
                      <button
                        key={equip}
                        onClick={() => setSelectedProgrammeEquipment(equip)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          selectedProgrammeEquipment === equip
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {equip.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Regular Filters */}
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
              </>
            )}
          </div>
        </div>

        {/* Exercise Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading exercises...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No exercises found matching your search.' : 'No exercises found for the selected filter.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredExercises.length)} of {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'}
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedExercises.map((exercise) => (
                <ProgrammeExerciseEmbed
                  key={exercise.id}
                  exercise={exercise}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

