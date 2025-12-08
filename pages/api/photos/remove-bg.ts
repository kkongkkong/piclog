import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY
const PYTHON_SERVER_URL = process.env.PYTHON_BG_REMOVAL_URL || 'http://localhost:5000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { photoId, imageUrl } = req.body

    if (!photoId || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    console.log('Starting background removal...')
    console.log('Image URL:', imageUrl)

    let buffer: Buffer

    // Remove.bg API 사용 (배포 환경)
    if (REMOVEBG_API_KEY) {
      console.log('Using Remove.bg API')

      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': REMOVEBG_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          size: 'auto',
        }),
      })

      if (!removeBgResponse.ok) {
        const errorText = await removeBgResponse.text()
        console.error('Remove.bg API error:', errorText)
        return res.status(500).json({
          success: false,
          message: `Background removal failed: ${errorText}`
        })
      }

      const arrayBuffer = await removeBgResponse.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    // Python 서버 사용 (로컬 환경)
    else {
      console.log('Using local Python server')

      const pythonResponse = await fetch(`${PYTHON_SERVER_URL}/remove-bg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: imageUrl }),
      })

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.json()
        console.error('Python server error:', errorData)
        return res.status(500).json({
          success: false,
          message: `Background removal failed: ${errorData.message || 'Unknown error'}`
        })
      }

      const pythonResult = await pythonResponse.json()

      if (!pythonResult.success) {
        return res.status(500).json({
          success: false,
          message: pythonResult.message || 'Background removal failed'
        })
      }

      // Base64 이미지를 Buffer로 변환
      const base64Data = pythonResult.image_base64.split(',')[1]
      buffer = Buffer.from(base64Data, 'base64')
    }

    const fileName = `removed-bg/${photoId}_${Date.now()}.png`

    // 원본 사진의 user_id 가져오기
    const { data: photoData } = await supabase
      .from('photos')
      .select('user_id')
      .eq('id', photoId)
      .single()

    const userId = photoData?.user_id || 'guest'

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(`${userId}/${fileName}`, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return res.status(500).json({
        success: false,
        message: `Upload failed: ${uploadError.message}`
      })
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(`${userId}/${fileName}`)

    const bgRemovedUrl = urlData.publicUrl

    console.log('Background removed image URL:', bgRemovedUrl)

    // DB 업데이트
    const { data, error } = await supabase
      .from('photos')
      .update({
        is_bg_removed: true,
        file_url: bgRemovedUrl
      })
      .eq('id', photoId)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      return res.status(500).json({ success: false, message: 'Database update failed' })
    }

    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    console.error('Remove background error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
}
