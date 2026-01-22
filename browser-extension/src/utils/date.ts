export const getCurrentPeriod = (): { startDate: Date; endDate: Date; periodLabel: string } => {
  const today = new Date()
  const dayOfWeek = today.getDay()

  const daysToThursday = dayOfWeek - 4
  const thisThursday = new Date(today)
  thisThursday.setDate(today.getDate() - daysToThursday)

  const startDate = new Date(thisThursday)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(thisThursday)
  endDate.setDate(thisThursday.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const lastThursday = new Date(startDate)

  return {
    startDate,
    endDate,
    periodLabel: `${formatDate(lastThursday)} ~ ${formatDate(endDate)}`
  }
}

export const getPeriodForDate = (date: Date): { startDate: Date; endDate: Date; periodLabel: string } => {
  const dayOfWeek = date.getDay()

  const daysToThursday = dayOfWeek - 4
  const thisThursday = new Date(date)
  thisThursday.setDate(date.getDate() - daysToThursday)

  const startDate = new Date(thisThursday)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(thisThursday)
  endDate.setDate(thisThursday.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    startDate,
    endDate,
    periodLabel: `${formatDate(startDate)} ~ ${formatDate(endDate)}`
  }
}

export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
