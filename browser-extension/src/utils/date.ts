export const getCurrentPeriod = (): { startDate: Date; endDate: Date; periodLabel: string } => {
  const today = new Date()
  const dayOfWeek = today.getDay()

  const daysToWednesday = dayOfWeek - 3
  const thisWednesday = new Date(today)
  thisWednesday.setDate(today.getDate() - daysToWednesday)

  const endDate = new Date(thisWednesday)
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date(thisWednesday)
  startDate.setDate(thisWednesday.getDate() - 6)
  startDate.setHours(0, 0, 0, 0)

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

  const daysToWednesday = dayOfWeek - 3
  const thisWednesday = new Date(date)
  thisWednesday.setDate(date.getDate() - daysToWednesday)

  const endDate = new Date(thisWednesday)
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date(thisWednesday)
  startDate.setDate(thisWednesday.getDate() - 6)
  startDate.setHours(0, 0, 0, 0)

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
