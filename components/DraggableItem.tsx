import { useState, useRef, useEffect } from 'react'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'

interface DraggableItemProps {
  id: string
  type: 'photo' | 'text'
  content: string
  initialPosition?: { x: number; y: number }
  initialScale?: number
  initialRotation?: number
  onUpdate?: (id: string, updates: {
    position?: { x: number; y: number }
    scale?: number
    rotation?: number
  }) => void
  onRemoveBg?: (id: string) => void
}

export default function DraggableItem({
  id,
  type,
  content,
  initialPosition = { x: 0, y: 0 },
  initialScale = 1,
  initialRotation = 0,
  onUpdate,
  onRemoveBg,
}: DraggableItemProps) {
  const [position, setPosition] = useState(initialPosition)
  const [scale, setScale] = useState(initialScale)
  const [rotation, setRotation] = useState(initialRotation)
  const [isSelected, setIsSelected] = useState(false)

  const nodeRef = useRef(null)

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    const newPosition = { x: data.x, y: data.y }
    setPosition(newPosition)
    onUpdate?.(id, { position: newPosition })
  }

  const handleScaleChange = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta))
    setScale(newScale)
    onUpdate?.(id, { scale: newScale })
  }

  const handleRotate = (delta: number) => {
    const newRotation = (rotation + delta) % 360
    setRotation(newRotation)
    onUpdate?.(id, { rotation: newRotation })
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onDrag={handleDrag}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className={`draggable-item ${type} ${isSelected ? 'selected' : ''}`}
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
        }}
        onClick={() => setIsSelected(!isSelected)}
      >
        {type === 'photo' ? (
          <div className="photo-wrapper">
            <img src={content} alt="Photo" />
            {isSelected && (
              <div className="controls">
                <button onClick={() => handleScaleChange(0.1)}>+</button>
                <button onClick={() => handleScaleChange(-0.1)}>-</button>
                <button onClick={() => handleRotate(15)}>↻</button>
                {onRemoveBg && (
                  <button onClick={() => onRemoveBg(id)}>누끼</button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-wrapper">
            <p>{content}</p>
            {isSelected && (
              <div className="controls">
                <button onClick={() => handleScaleChange(0.1)}>+</button>
                <button onClick={() => handleScaleChange(-0.1)}>-</button>
                <button onClick={() => handleRotate(15)}>↻</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  )
}
