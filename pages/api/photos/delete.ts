import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { photoId, fileUrl } = req.body

    if (!photoId) {
      return res.status(400).json({ success: false, message: 'Missing photoId' })
    }

    // Storage에서 파일 삭제
    if (fileUrl) {
      const urlParts = fileUrl.split('/storage/v1/object/public/photos/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([filePath])

        if (storageError) {
          console.error('Storage delete error:', storageError)
        }
      }
    }

    // DB에서 삭제
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return res.status(500).json({ success: false, message: `Delete failed: ${deleteError.message}` })
    }

    return res.status(200).json({ success: true, message: 'Photo deleted' })
  } catch (error: any) {
    console.error('Delete error:', error)
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
}
