export function extractTimestamp(filename: string): Date | null {
  // 파일명 패턴: YYYYMMDD_HHMMSS.jpg
  const match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)

  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute, second] = match

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
}

export function getHourFromTimestamp(timestamp: Date): number {
  return timestamp.getHours()
}
