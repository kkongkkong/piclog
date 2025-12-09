import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { photoId } = req.body

    if (!photoId) {
      return res.status(400).json({ success: false, message: 'Missing photoId' })
    }

    console.log('Restoring original image for:', photoId)

    // 원본 URL 가져오기
    const { data: photoData, error: fetchError } = await supabase
      .from('photos')
      .select('original_url, is_bg_removed')
      .eq('id', photoId)
      .single()

    if (fetchError) {
      console.error('Error fetching photo:', fetchError)
      return res.status(500).json({ success: false, message: 'Failed to fetch photo data' })
    }

    if (!photoData?.original_url) {
      return res.status(400).json({
        success: false,
        message: '원본 이미지가 없습니다. 배경제거를 한 적이 없는 사진입니다.'
      })
    }

    if (!photoData?.is_bg_removed) {
      return res.status(400).json({
        success: false,
        message: '이미 원본 상태입니다.'
      })
    }

    // DB 업데이트: 원본 URL로 복원
    const { data, error } = await supabase
      .from('photos')
      .update({
        file_url: photoData.original_url,  // 원본 URL로 복원
        is_bg_removed: false,
        // original_url은 그대로 유지 (재배경제거 가능)
      })
      .eq('id', photoId)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      return res.status(500).json({ success: false, message: 'Database update failed' })
    }

    console.log('Successfully restored original image')
    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    console.error('Restore original error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    })
  }
}
