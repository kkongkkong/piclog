export interface Photo {
  id: string
  file_url: string
  timestamp: string
  hour: number
  user_id: string
  is_bg_removed?: boolean
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
