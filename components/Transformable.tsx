// components/Transformable.tsx
import { useRef, useState, useEffect } from "react";

interface TransformableProps {
  children: React.ReactNode | ((selected: boolean) => React.ReactNode);
  id: string;
  defaultX?: number;
  defaultY?: number;
  defaultScale?: number;
  defaultRotation?: number;
  onChange: (updates: any) => void;
  onDelete?: () => void;
  isTimeline?: boolean;
}

type HandlePosition = 'nw' | 'ne' | 'sw' | 'se';
type InteractionMode = 'none' | 'move' | 'resize' | 'rotate';

export default function Transformable({
  children,
  id,
  defaultX = 0,
  defaultY = 0,
  defaultScale = 1,
  defaultRotation = 0,
  onChange,
  onDelete,
  isTimeline = false,
}: TransformableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({
    x: defaultX,
    y: defaultY,
    scale: defaultScale,
    rotation: defaultRotation,
  });
  const [selected, setSelected] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  const dragStart = useRef({ x: 0, y: 0 });
  const initialTransform = useRef({ scale: 1, rotation: 0 });
  const centerPoint = useRef({ x: 0, y: 0 });
  const activeHandle = useRef<HandlePosition | null>(null);

  // 컨텐츠 크기 측정
  useEffect(() => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      setContentSize({ width: rect.width / transform.scale, height: rect.height / transform.scale });
    }
  }, [children, transform.scale]);

  const applyTransform = (data: Partial<typeof transform>) => {
    const newTransform = { ...transform, ...data };
    setTransform(newTransform);
    onChange(newTransform);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelected(false);
      }
    };

    if (selected) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selected]);

  // 핸들 위치 계산
  const getHandlePosition = (handle: HandlePosition) => {
    const offset = -8;
    const w = contentSize.width;
    const h = contentSize.height;

    switch (handle) {
      case 'nw': return { x: offset, y: offset };
      case 'ne': return { x: w + offset, y: offset };
      case 'sw': return { x: offset, y: h + offset };
      case 'se': return { x: w + offset, y: h + offset };
    }
  };

  // 커서가 회전 영역에 있는지 확인 (핸들에서 15~35px 거리)
  const isInRotateZone = (handle: HandlePosition, mouseX: number, mouseY: number, handleRect: DOMRect) => {
    const centerX = handleRect.left + handleRect.width / 2;
    const centerY = handleRect.top + handleRect.height / 2;
    const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
    return distance > 15 && distance < 35;
  };

  // 컨텐츠 클릭
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected) {
      setSelected(true);
    }
  };

  // 컨텐츠 드래그
  const handleContentMouseDown = (e: React.MouseEvent) => {
    if (!selected) return;
    if (e.target !== contentRef.current && !contentRef.current?.contains(e.target as Node)) return;

    e.preventDefault();
    e.stopPropagation();

    setInteractionMode('move');
    dragStart.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    };
  };

  // 핸들 마우스 다운
  const handleHandleMouseDown = (e: React.MouseEvent, handle: HandlePosition) => {
    e.stopPropagation();
    e.preventDefault();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    centerPoint.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const isRotate = isInRotateZone(handle, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());

    initialTransform.current = { scale: transform.scale, rotation: transform.rotation };
    dragStart.current = { x: e.clientX, y: e.clientY };
    activeHandle.current = handle;

    if (isRotate) {
      setInteractionMode('rotate');
    } else {
      setInteractionMode('resize');
    }
  };

  // 마우스 무브
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (interactionMode === 'none') return;

      if (interactionMode === 'move') {
        applyTransform({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      } else if (interactionMode === 'resize') {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let direction = 1;
        if (activeHandle.current === 'nw' || activeHandle.current === 'sw') {
          direction = dx < 0 ? 1 : -1;
        } else {
          direction = dx > 0 ? 1 : -1;
        }

        const scaleDelta = 1 + (distance * direction * 0.003);
        const newScale = Math.max(0.3, Math.min(3, initialTransform.current.scale * scaleDelta));
        applyTransform({ scale: newScale });
      } else if (interactionMode === 'rotate') {
        const angle = Math.atan2(
          e.clientY - centerPoint.current.y,
          e.clientX - centerPoint.current.x
        ) * (180 / Math.PI);
        const startAngle = Math.atan2(
          dragStart.current.y - centerPoint.current.y,
          dragStart.current.x - centerPoint.current.x
        ) * (180 / Math.PI);
        applyTransform({
          rotation: initialTransform.current.rotation + (angle - startAngle),
        });
      }
    };

    const handleMouseUp = () => {
      setInteractionMode('none');
      activeHandle.current = null;
    };

    if (interactionMode !== 'none') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactionMode, transform]);

  // 터치 제스처
  const lastTouchDistance = useRef(0);
  const lastTouchAngle = useRef(0);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touches: React.TouchList) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!selected) {
      setSelected(true);
      return;
    }

    if (e.touches.length === 2) {
      e.preventDefault();
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchAngle.current = getTouchAngle(e.touches);
      initialTransform.current = { scale: transform.scale, rotation: transform.rotation };
      setInteractionMode('resize');
    } else if (e.touches.length === 1) {
      dragStart.current = {
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      };
      setInteractionMode('move');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!selected) return;

    if (e.touches.length === 2) {
      e.preventDefault();

      // 핀치 줌
      const distance = getTouchDistance(e.touches);
      const scaleDelta = distance / lastTouchDistance.current;
      applyTransform({ scale: Math.max(0.3, Math.min(3, transform.scale * scaleDelta)) });
      lastTouchDistance.current = distance;

      // 회전
      const angle = getTouchAngle(e.touches);
      const angleDelta = angle - lastTouchAngle.current;
      applyTransform({ rotation: transform.rotation + angleDelta });
      lastTouchAngle.current = angle;
    } else if (e.touches.length === 1 && interactionMode === 'move') {
      applyTransform({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setInteractionMode('none');
    }
  };

  const handles: HandlePosition[] = ['nw', 'ne', 'sw', 'se'];

  // 타임라인 모드
  if (isTimeline) {
    return (
      <div
        ref={containerRef}
        className="timeline-transformable"
        style={{
          position: "relative",
          display: "inline-block",
          minHeight: "100px",
        }}
      >
        <div
          ref={contentRef}
          onClick={handleContentClick}
          onMouseDown={handleContentMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
            transformOrigin: "center",
            transition: interactionMode === 'none' ? "transform 0.1s ease-out" : "none",
            cursor: selected ? (interactionMode === 'move' ? 'move' : 'default') : 'pointer',
            outline: selected ? "2px solid #FFD700" : "none",
            outlineOffset: "4px",
            userSelect: "none",
            WebkitUserDrag: "none",
            background: "transparent",
          }}
        >
          {typeof children === 'function' ? children(selected) : children}
        </div>

        {/* 선택 박스 및 핸들 */}
        {selected && (
          <div
            className="selection-box"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: `${contentSize.width}px`,
              height: `${contentSize.height}px`,
              transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
              transformOrigin: "center",
              transition: interactionMode === 'none' ? "transform 0.1s ease-out" : "none",
              pointerEvents: "none",
            }}
          >
            {handles.map((handle) => {
              const pos = getHandlePosition(handle);

              return (
                <div
                  key={handle}
                  className={`resize-handle handle-${handle}`}
                  style={{
                    position: "absolute",
                    width: "16px",
                    height: "16px",
                    background: "white",
                    border: "2px solid #FFD700",
                    borderRadius: "50%",
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    pointerEvents: "auto",
                    cursor: "nwse-resize",
                    zIndex: 10,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                  onMouseDown={(e) => handleHandleMouseDown(e, handle)}
                  title="드래그: 크기 조절 | 핸들 밖 드래그: 회전"
                />
              );
            })}
          </div>
        )}

        {/* 삭제 버튼 */}
        {selected && onDelete && (
          <button
            onClick={onDelete}
            style={{
              position: "absolute",
              top: "-40px",
              right: "0",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "2px solid #ff3b30",
              background: "white",
              color: "#ff3b30",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 100,
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // 스티커 모드 (기존 absolute positioning)
  return (
    <div
      ref={containerRef}
      className="transformable-item"
      style={{
        position: "absolute",
        display: "inline-block",
      }}
    >
      <div
        ref={contentRef}
        onClick={handleContentClick}
        onMouseDown={handleContentMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          transformOrigin: "center",
          transition: interactionMode === 'none' ? "transform 0.1s ease-out" : "none",
          cursor: selected ? (interactionMode === 'move' ? 'move' : 'default') : 'pointer',
          outline: selected ? "2px solid #FFD700" : "none",
          outlineOffset: "4px",
          userSelect: "none",
          WebkitUserDrag: "none",
          background: "transparent",
        }}
      >
        {typeof children === 'function' ? children(selected) : children}
      </div>

      {/* 선택 박스 및 핸들 */}
      {selected && (
        <div
          className="selection-box"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${contentSize.width}px`,
            height: `${contentSize.height}px`,
            transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
            transformOrigin: "center",
            transition: interactionMode === 'none' ? "transform 0.1s ease-out" : "none",
            pointerEvents: "none",
          }}
        >
          {handles.map((handle) => {
            const pos = getHandlePosition(handle);

            return (
              <div
                key={handle}
                className={`resize-handle handle-${handle}`}
                style={{
                  position: "absolute",
                  width: "16px",
                  height: "16px",
                  background: "white",
                  border: "2px solid #FFD700",
                  borderRadius: "50%",
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  pointerEvents: "auto",
                  cursor: "nwse-resize",
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
                onMouseDown={(e) => handleHandleMouseDown(e, handle)}
                title="드래그: 크기 조절 | 핸들 밖 드래그: 회전"
              />
            );
          })}
        </div>
      )}

      {/* 삭제 버튼 */}
      {selected && onDelete && (
        <button
          onClick={onDelete}
          style={{
            position: "absolute",
            top: "-40px",
            right: "0",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid #ff3b30",
            background: "white",
            color: "#ff3b30",
            fontSize: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 100,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
