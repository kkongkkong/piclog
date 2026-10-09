import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { supabase } from '@/lib/supabase'
import {
  extractTimestampFromExif,
  extractTimestampFromFilename,
  extractTimestampFromLastModified,
  getHourFromTimestamp
} from '@/utils/extractTimestamp'

export const config = {
  api: {
    bodyParser: false,
  },
}

// 허용 확장자 (HEIC, WEBP 포함)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.webp']
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
    })
    const [fields, files] = await form.parse(req)

    console.log('Received files:', files)
    console.log('Received fields:', fields)

    const file = files.file?.[0]
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const guestId = fields.guestId?.[0] || 'guest'
    const targetDateStr = fields.targetDate?.[0] // 선택된 날짜
    const lastModifiedStr = fields.lastModified?.[0] // 파일의 lastModified
    const filename = file.originalFilename || 'unknown.jpg'

    console.log('Processing file:', filename)
    console.log('Target date:', targetDateStr)
    console.log('Last modified:', lastModifiedStr)

    // 파일 확장자 검증
    const fileExtMatch = filename.match(/\.[^.]+$/)
    if (!fileExtMatch) {
      return res.status(400).json({
        success: false,
        message: '파일 확장자를 확인할 수 없습니다.'
      })
    }

    const fileExt = fileExtMatch[0].toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `허용되지 않는 파일 형식입니다. (${fileExt})\n허용 형식: JPG, PNG, HEIC, WEBP`
      })
    }

    // 파일 버퍼 읽기 (EXIF 추출 및 업로드에 사용)
    const fileBuffer = fs.readFileSync(file.filepath)

    /**
     * 통합 타임스탬프 추출 로직 (우선순위)
     * 1. EXIF DateTimeOriginal (최우선 - iPhone, Galaxy 모두)
     * 2. 파일명 패턴 (Galaxy: YYYYMMDD_HHMMSS)
     * 3. File lastModified (PC 업로드 이미지)
     * 4. targetDate (사용자 선택 날짜 + 현재 시간)
     * 5. 현재 시간 (최후 fallback)
     */
    let timestamp: Date | null = null

    // 1️⃣ EXIF DateTimeOriginal (최우선)
    timestamp = extractTimestampFromExif(fileBuffer)

    // 2️⃣ Galaxy 파일명 패턴 (YYYYMMDD_HHMMSS)
    if (!timestamp) {
      console.log('No EXIF data, trying filename pattern')
      timestamp = extractTimestampFromFilename(filename)
    }

    // 3️⃣ File lastModified (PC 업로드)
    if (!timestamp && lastModifiedStr) {
      console.log('No filename pattern, trying lastModified')
      timestamp = extractTimestampFromLastModified(parseInt(lastModifiedStr))
    }

    // 4️⃣ targetDate (사용자 선택 날짜)
    if (!timestamp && targetDateStr) {
      try {
        console.log('Using target date from user selection')
        const targetDate = new Date(targetDateStr)

        // 현재 UTC 시간을 KST로 변환 (UTC + 9시간)
        const nowUtc = new Date()
        const nowKst = new Date(nowUtc.getTime() + (9 * 60 * 60 * 1000))

        // targetDate의 날짜 + 현재 KST 시간
        const year = targetDate.getFullYear()
        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0')
        const day = targetDate.getDate().toString().padStart(2, '0')
        const hour = nowKst.getUTCHours().toString().padStart(2, '0')
        const minute = nowKst.getUTCMinutes().toString().padStart(2, '0')
        const second = nowKst.getUTCSeconds().toString().padStart(2, '0')

        const kstIsoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`
        timestamp = new Date(kstIsoString)

        if (isNaN(timestamp.getTime())) {
          console.error('Invalid date generated from targetDate:', kstIsoString)
          timestamp = null
        } else {
          console.log('📅 Generated timestamp from target date (KST):', kstIsoString, '→ UTC:', timestamp.toISOString())
        }
      } catch (error) {
        console.error('Error generating timestamp from targetDate:', error)
        timestamp = null
      }
    }

    // 5️⃣ 현재 시간 (최후 fallback)
    if (!timestamp) {
      try {
        console.log('⚠️ Using current time as final fallback (KST)')
        // 현재 UTC 시간을 KST로 변환 (UTC + 9시간)
        const nowUtc = new Date()
        const nowKst = new Date(nowUtc.getTime() + (9 * 60 * 60 * 1000))

        const year = nowKst.getUTCFullYear()
        const month = (nowKst.getUTCMonth() + 1).toString().padStart(2, '0')
        const day = nowKst.getUTCDate().toString().padStart(2, '0')
        const hour = nowKst.getUTCHours().toString().padStart(2, '0')
        const minute = nowKst.getUTCMinutes().toString().padStart(2, '0')
        const second = nowKst.getUTCSeconds().toString().padStart(2, '0')

        const kstIsoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`
        timestamp = new Date(kstIsoString)

        if (isNaN(timestamp.getTime())) {
          console.error('Invalid date generated from current time:', kstIsoString)
          return res.status(500).json({ success: false, message: 'Failed to generate timestamp' })
        }

        console.log('🕐 Generated KST timestamp:', kstIsoString, '→ UTC:', timestamp.toISOString())
      } catch (error: any) {
        console.error('Error generating current timestamp:', error)
        return res.status(500).json({ success: false, message: error.message || 'Timestamp generation failed' })
      }
    }

    const hour = getHourFromTimestamp(timestamp)
    console.log('Extracted hour:', hour, 'from timestamp:', timestamp.toISOString())

    // 시간대별 3장 초과 체크 (같은 날짜 내에서만)
    // timestamp의 날짜 범위 계산 (KST 기준)
    const kstTimestamp = new Date(timestamp.getTime() + (9 * 60 * 60 * 1000))
    const year = kstTimestamp.getUTCFullYear()
    const month = kstTimestamp.getUTCMonth()
    const day = kstTimestamp.getUTCDate()

    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
    startOfDay.setHours(startOfDay.getHours() - 9) // KST → UTC

    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
    endOfDay.setHours(endOfDay.getHours() - 9) // KST → UTC

    console.log(`📊 Checking photo count for hour ${hour} on date range:`, {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      kstDate: `${year}-${month+1}-${day}`
    })

    const { data: existingPhotos, error: countError } = await supabase
      .from('photos')
      .select('id, timestamp')
      .eq('user_id', guestId)
      .eq('hour', hour)
      .gte('timestamp', startOfDay.toISOString())
      .lte('timestamp', endOfDay.toISOString())

    console.log(`📊 Found ${existingPhotos?.length || 0} existing photos:`, existingPhotos)

    if (countError) {
      console.error('Count error:', countError)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (existingPhotos && existingPhotos.length >= 3) {
      return res.status(400).json({
        success: false,
        message: `Maximum 3 photos per hour slot (hour ${hour}) on ${year}-${month+1}-${day}`
      })
    }

    // Supabase Storage에 업로드
    const storagePath = `${guestId}/${randomUUID()}${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return res.status(500).json({ success: false, message: `Upload failed: ${uploadError.message}` })
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath)

    const fileUrl = urlData.publicUrl

    // DB에 저장
    // timestamp는 이미 로컬 시간(KST) 기준 Date 객체
    // toISOString()은 자동으로 UTC로 변환하므로 그대로 사용
    const isoTimestamp = timestamp.toISOString()
    console.log('Saving to DB - Local time:', timestamp.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), 'ISO (UTC):', isoTimestamp)

    const { data: photoData, error: insertError } = await supabase
      .from('photos')
      .insert({
        file_url: fileUrl,
        timestamp: isoTimestamp,
        hour,
        user_id: guestId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return res.status(500).json({ success: false, message: `Database insert failed: ${insertError.message}` })
    }

    console.log('Upload success:', photoData)
    return res.status(200).json({ success: true, data: photoData })
  } catch (error: any) {
    console.error('Upload error:', error)
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
}
