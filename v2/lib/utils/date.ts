import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'

export function getWeekDates(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
  const end = endOfWeek(date, { weekStartsOn: 0 })
  
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd')
  }
}

export function getWeekDays(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  
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
