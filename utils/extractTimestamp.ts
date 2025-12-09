import exifParser from 'exif-parser'

/**
 * 통합 사진 타임스탬프 추출 함수
 * 우선순위:
 * 1. EXIF DateTimeOriginal (최우선 - iPhone, Galaxy 모두 지원)
 * 2. 파일명 패턴 (Galaxy: YYYYMMDD_HHMMSS)
 * 3. File lastModified (PC 업로드 이미지)
 * 4. 현재 시간 (최후 fallback)
 */

// 1. EXIF 데이터에서 타임스탬프 추출 (최우선)
export function extractTimestampFromExif(buffer: Buffer): Date | null {
  try {
    const parser = exifParser.create(buffer)
    const result = parser.parse()

    // EXIF에서 촬영 시간 가져오기 (iPhone, Galaxy 모두 지원)
    if (result.tags?.DateTimeOriginal) {
      // DateTimeOriginal은 Unix timestamp (초 단위)
      const timestamp = new Date(result.tags.DateTimeOriginal * 1000)
      console.log('✅ EXIF DateTimeOriginal found:', timestamp.toISOString())
      return timestamp
    }

    // CreateDate도 확인
    if (result.tags?.CreateDate) {
      const timestamp = new Date(result.tags.CreateDate * 1000)
      console.log('✅ EXIF CreateDate found:', timestamp.toISOString())
      return timestamp
    }

    return null
  } catch (error) {
    console.error('Failed to extract EXIF data:', error)
    return null
  }
}

// 2. 파일명에서 타임스탬프 추출 (Galaxy fallback)
export function extractTimestampFromFilename(filename: string): Date | null {
  // 갤럭시 파일명 패턴: 20250101_124530.jpg
  const match = filename.match(/^(\d{8})_(\d{6})/)

  if (!match) {
    return null
  }

  const [, dateStr, timeStr] = match

  // 20250101 → 2025, 01, 01
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6))
  const day = parseInt(dateStr.substring(6, 8))

  // 124530 → 12, 45, 30
  const hour = parseInt(timeStr.substring(0, 2))
  const minute = parseInt(timeStr.substring(2, 4))
  const second = parseInt(timeStr.substring(4, 6))

  // 파일명의 시간은 KST 기준이므로 UTC로 변환
  // ISO 문자열로 만들어서 Date 객체 생성 (UTC 기준으로 해석됨)
  const kstIsoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}+09:00`
  const timestamp = new Date(kstIsoString)
  console.log('✅ Galaxy filename pattern found (KST):', kstIsoString, '→ UTC:', timestamp.toISOString())
  return timestamp
}

// 3. File lastModified에서 타임스탬프 추출 (PC 업로드 이미지 fallback)
export function extractTimestampFromLastModified(lastModified: number): Date {
  // lastModified는 이미 Unix timestamp (UTC 기준)
  const timestamp = new Date(lastModified)
  console.log('⚠️ Using file lastModified:', timestamp.toISOString())
  return timestamp
}

export function getHourFromTimestamp(timestamp: Date): number {
  // KST 기준 시간을 반환 (서버가 어느 시간대든 상관없이)
  // timestamp는 UTC 기준이므로 +9시간 하여 KST로 변환
  const kstTime = new Date(timestamp.getTime() + (9 * 60 * 60 * 1000))
  return kstTime.getUTCHours()
}
