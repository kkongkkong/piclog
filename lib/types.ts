export interface Photo {
  id: string
  file_url: string
  timestamp: string
  hour: number
  user_id: string
  is_bg_removed?: boolean
  original_url?: string  // 배경제거 전 원본 URL (원복용)
  position?: {
    x: number
    y: number
  }
  scale?: number
  rotation?: number
}

export interface TextSticker {
  id: string
  content: string
  position: {
    x: number
    y: number
  }
  scale: number
  rotation: number
  user_id: string
}

export interface TimelineSlotData {
  hour: number
  photos: Photo[]
}
