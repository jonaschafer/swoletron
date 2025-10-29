import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth } from 'date-fns'

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

export function getMonthDates(date: Date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  }
}

export function getMonthCalendarGrid(date: Date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  // Start from the beginning of the week that contains the first day of the month
  const firstDayOfWeek = startOfWeek(start, { weekStartsOn: 0 }) // 0 = Sunday
  
  // Create array of dates for the calendar grid (usually 5-6 weeks)
  const days: Array<{ date: string; dayNumber: string; isCurrentMonth: boolean }> = []
  
  // Add 6 weeks of days (7 days * 6 weeks = 42 days, enough for any month)
  for (let i = 0; i < 42; i++) {
    const dayDate = addDays(firstDayOfWeek, i)
    const isCurrentMonth = dayDate >= start && dayDate <= end
    
    days.push({
      date: format(dayDate, 'yyyy-MM-dd'),
      dayNumber: format(dayDate, 'd'),
      isCurrentMonth
    })
  }
  
  return days
}

export function getMonthDays(date: Date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  
  const days: string[] = []
  
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    days.push(format(d, 'yyyy-MM-dd'))
  }
  
  return days
}

export function getMonthNameAndYear(date: Date) {
  return format(date, 'MMMM yyyy')
}
