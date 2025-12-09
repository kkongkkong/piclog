import { useState } from "react";
import Transformable from "./Transformable";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { Photo } from "@/lib/types";

interface TimelinePhotoProps {
  photo: Photo;
  baseY: number;
  photoIndex?: number;
  onUpdate: (photoId: string, updates: any) => void;
  onDelete: (photoId: string, fileUrl: string) => void;
  onRemoveBg: (photoId: string, fileUrl: string) => void;
  onRestore: (photoId: string) => void;
}

export default function TimelinePhoto({ photo, baseY, photoIndex = 0, onUpdate, onDelete, onRemoveBg, onRestore }: TimelinePhotoProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // X 위치는 사진 인덱스에 따라 간격을 둠 (모바일 친화적으로 간격 축소)
  // 사진 크기 150px + 여백 10px = 160px 간격
  const baseX = photo.position?.x || (10 + photoIndex * 160);

  return (
    <>
    <Transformable
      id={photo.id}
      isTimeline={false}
      defaultX={baseX}
      defaultY={photo.position?.y || baseY}
      defaultScale={photo.scale || 1}
      defaultRotation={photo.rotation || 0}
      onChange={(updates) => {
        onUpdate(photo.id, updates);
      }}
    >
      {(selected) => (
        <div className="timeline-photo-sticker">
          {selected && (
            <div className="timeline-photo-actions">
              {photo.is_bg_removed ? (
                // 배경제거된 사진: 원복 버튼 표시
                <button
                  className="timeline-action-btn restore"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(photo.id);
                  }}
                >
                  원복
                </button>
              ) : (
                // 일반 사진: 배경제거 버튼 표시
                <button
                  className="timeline-action-btn bg-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBg(photo.id, photo.file_url);
                  }}
                >
                  배경제거
                </button>
              )}
              <button
                className="timeline-action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                삭제
              </button>
            </div>
          )}
          <img src={photo.file_url} alt="" style={{ maxWidth: '150px' }} />
        </div>
      )}
    </Transformable>

    {showDeleteConfirm && (
      <DeleteConfirmModal
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(photo.id, photo.file_url);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
  </>
  );
}
