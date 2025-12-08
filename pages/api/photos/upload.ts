import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { supabase } from '@/lib/supabase'
import { extractTimestamp, getHourFromTimestamp } from '@/utils/extractTimestamp'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    })
    const [fields, files] = await form.parse(req)

    console.log('Received files:', files)
    console.log('Received fields:', fields)

    const file = files.file?.[0]
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const guestId = fields.guestId?.[0] || 'guest'
    const filename = file.originalFilename || 'unknown.jpg'

    console.log('Processing file:', filename)

    // 파일명에서 timestamp 추출, 실패하면 현재 시간 사용 (한국 시간)
    let timestamp = extractTimestamp(filename)
    if (!timestamp) {
      console.log('Failed to extract timestamp from filename, using current time (KST)')
      // 한국 시간(UTC+9)으로 현재 시간 생성
      const now = new Date()
      const kstOffset = 9 * 60 * 60 * 1000 // 9시간을 밀리초로
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
      timestamp = new Date(utcTime + kstOffset)
    }

    const hour = getHourFromTimestamp(timestamp)

    // 시간대별 3장 초과 체크
    const { data: existingPhotos, error: countError } = await supabase
      .from('photos')
      .select('id')
      .eq('user_id', guestId)
      .eq('hour', hour)

    if (countError) {
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (existingPhotos && existingPhotos.length >= 3) {
      return res.status(400).json({
        success: false,
        message: `Maximum 3 photos per hour slot (hour ${hour})`
      })
    }

    // Supabase Storage에 업로드
    const fileBuffer = fs.readFileSync(file.filepath)
    const storagePath = `${guestId}/${Date.now()}_${filename}`

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
    const { data: photoData, error: insertError } = await supabase
      .from('photos')
      .insert({
        file_url: fileUrl,
        timestamp: timestamp.toISOString(),
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
