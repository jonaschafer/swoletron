import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'

export function getWeekDates(date: Date) {
  // Use the date as-is (should be a Monday)
  const start = date
  const end = addDays(date, 6) // Add 6 days to get Sunday
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  }
}

export function getWeekDays(date: Date) {
  // Use the date as-is (should be a Monday)
  const start = date
  
  return Array.from({ length: 7 }, (_, i) => {
    const dayDate = addDays(start, i)
    return {
      date: format(dayDate, 'yyyy-MM-dd'),
      dayName: format(dayDate, 'EEE'),
      dayNumber: format(dayDate, 'd')
    }
  })
}

export function formatDate(date: Date, formatString: string = 'yyyy-MM-dd') {
  return format(date, formatString)
}
