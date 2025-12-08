// components/Timeline.tsx
import { useState, useEffect, useRef } from "react";
import TimelineItem from "./TimelineItem";
import TimelinePhoto from "./TimelinePhoto";
import TimelineText from "./TimelineText";
import TextInputModal from "./TextInputModal";
import LoadingModal from "./LoadingModal";
import { Photo } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { getGuestId } from "@/utils/guestId";

interface TimelineProps {
  refreshTrigger?: number;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  externalShowTextModal?: boolean;
  onTextModalClose?: () => void;
}

interface GroupedPhotos {
  hour: number;
  photos: Photo[];
}

interface TextObject {
  id: string;
  hour: number;
  text: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

export default function Timeline({ refreshTrigger, currentDate, onDateChange, externalShowTextModal, onTextModalClose }: TimelineProps) {
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos[]>([]);
  const [textObjects, setTextObjects] = useState<TextObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [contextMenuHour, setContextMenuHour] = useState<number | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // 외부에서 텍스트 모달 열기
  useEffect(() => {
    if (externalShowTextModal) {
      // 첫 번째 사진이 있는 시간대 또는 현재 시간
      const hour = groupedPhotos.length > 0 ? groupedPhotos[0].hour : new Date().getHours();
      setContextMenuHour(hour);
      setShowTextModal(true);
    }
  }, [externalShowTextModal, groupedPhotos]);

  /** -------------------------------
   * 📌 1. Load Timeline
   * ------------------------------- */
  useEffect(() => {
    loadTimeline();
  }, [refreshTrigger, currentDate]);

  const loadTimeline = async () => {
    setLoading(true);
    const guestId = getGuestId();

    // 선택된 날짜의 시작과 끝 계산
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", guestId)
      .gte("timestamp", startOfDay.toISOString())
      .lte("timestamp", endOfDay.toISOString())
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error loading timeline:", error);
      setLoading(false);
      return;
    }

    const grouped: Record<number, Photo[]> = {};

    (data || []).forEach((p: Photo) => {
      if (!grouped[p.hour]) grouped[p.hour] = [];
      grouped[p.hour].push(p);
    });

    setGroupedPhotos(
      Object.entries(grouped)
        .map(([hour, photos]) => ({
          hour: Number(hour),
          photos,
        }))
        .sort((a, b) => a.hour - b.hour)
    );

    // 텍스트 객체 로드
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const { data: textData, error: textError } = await supabase
      .from("text_objects")
      .select("*")
      .eq("user_id", guestId)
      .eq("date", dateStr);

    if (!textError && textData) {
      setTextObjects(textData.map((t: any) => ({
        id: t.id,
        hour: t.hour,
        text: t.text,
        position: t.position || { x: 100, y: 50 },
        scale: t.scale || 1,
        rotation: t.rotation || 0,
      })));
    }

    setLoading(false);
  };

  /** -------------------------------
   * 📌 2. Text Handling
   * ------------------------------- */
  const handleContextMenu = (e: React.MouseEvent, hour: number) => {
    e.preventDefault();
    setContextMenuHour(hour);
    setShowTextModal(true);
  };

  const handleAddText = async (text: string) => {
    if (!text.trim() || contextMenuHour === null) return;

    const guestId = getGuestId();
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from("text_objects")
      .insert({
        user_id: guestId,
        hour: contextMenuHour,
        text: text.trim(),
        position: { x: 100, y: 50 },
        scale: 1,
        rotation: 0,
        date: dateStr,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding text:', error);
      alert('텍스트 추가 실패');
      return;
    }

    if (data) {
      const newText: TextObject = {
        id: data.id,
        hour: data.hour,
        text: data.text,
        position: data.position || { x: 100, y: 50 },
        scale: data.scale || 1,
        rotation: data.rotation || 0,
      };
      setTextObjects((prev) => [...prev, newText]);
    }

    setShowTextModal(false);
    setContextMenuHour(null);
  };

  const handleTextUpdate = async (id: string, updates: Partial<TextObject>) => {
    // DB 업데이트
    const { error } = await supabase
      .from("text_objects")
      .update({
        position: updates.position,
        scale: updates.scale,
        rotation: updates.rotation,
      })
      .eq("id", id);

    if (error) {
      console.error('Error updating text:', error);
      return;
    }

    // 로컬 상태 업데이트
    setTextObjects((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleTextDelete = async (id: string) => {
    const { error } = await supabase
      .from("text_objects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Error deleting text:', error);
      return;
    }

    setTextObjects((prev) => prev.filter((t) => t.id !== id));
  };

  /** -------------------------------
   * 📌 3. Photo Update, Delete & Remove BG
   * ------------------------------- */
  const handlePhotoUpdate = async (photoId: string, updates: any) => {
    // DB에 위치 저장
    const { error } = await supabase
      .from("photos")
      .update({
        position: updates.x !== undefined && updates.y !== undefined ? { x: updates.x, y: updates.y } : undefined,
        scale: updates.scale,
        rotation: updates.rotation,
      })
      .eq("id", photoId);

    if (error) {
      console.error("Error updating photo:", error);
    }
  };

  const handlePhotoDelete = async (photoId: string, fileUrl: string) => {
    const res = await fetch("/api/photos/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, fileUrl }),
    });
    const json = await res.json();
    if (json.success) loadTimeline();
  };

  const handlePhotoRemoveBg = async (photoId: string, url: string) => {
    try {
      setIsRemovingBg(true);
      console.log("Removing background for:", photoId, url);
      const res = await fetch("/api/photos/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, imageUrl: url }),
      });
      const json = await res.json();
      console.log("Remove BG response:", json);
      setIsRemovingBg(false);
      if (json.success) {
        loadTimeline();
      } else {
        alert(`배경 제거 실패: ${json.message}`);
      }
    } catch (error) {
      console.error("Remove BG error:", error);
      setIsRemovingBg(false);
      alert("배경 제거 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="timeline-loading">Loading...</div>;

  // 사진이 없을 때
  if (groupedPhotos.length === 0) {
    return (
      <div className="timeline">
        {/* ---------------- HEADER ---------------- */}
        <div className="timeline-header mb-6">
          <button
            className="date-nav-btn"
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() - 1);
              onDateChange(d);
            }}
          >
            ←
          </button>

          <div className="timeline-date-info">
            <p className="timeline-date">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{" "}
              {currentDate.getDate()}일
            </p>
          </div>

          <button
            className="date-nav-btn"
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 1);
              onDateChange(d);
            }}
          >
            →
          </button>
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-lg">이 날의 사진이 없습니다</p>
          <p className="text-sm mt-2">사진을 업로드해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {/* ---------------- HEADER ---------------- */}
      <div className="timeline-header mb-6">
        <button
          className="date-nav-btn"
          onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            onDateChange(d);
          }}
        >
          ←
        </button>

        <div className="timeline-date-info">
          <p className="timeline-date">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월{" "}
            {currentDate.getDate()}일
          </p>
        </div>

        <button
          className="date-nav-btn"
          onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            onDateChange(d);
          }}
        >
          →
        </button>
      </div>

      {/* ---------------- TIMELINE CONTAINER ---------------- */}
      <div
        className="timeline-container"
        style={{
          minHeight: groupedPhotos.length > 0
            ? `${groupedPhotos.length * 150 + 100}px`
            : '600px'
        }}
        onContextMenu={(e) => handleContextMenu(e, 0)}
      >
        {/* Timeline with hour markers */}
        <div className="timeline-hours">
          {groupedPhotos.map(({ hour }, index) => (
            <TimelineItem key={hour} hour={hour} index={index} />
          ))}
        </div>

        {/* Photos layer - absolute positioned */}
        <div
          className="timeline-photos-layer"
          onContextMenu={(e) => {
            e.preventDefault();
            const minHour = groupedPhotos.length > 0 ? Math.min(...groupedPhotos.map(g => g.hour)) : 0;

            // 클릭 위치 기반 hour 계산
            const rect = e.currentTarget.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const hourIndex = Math.floor(clickY / 150);
            const targetHour = minHour + hourIndex;

            setContextMenuHour(targetHour);
            setShowTextModal(true);
          }}
        >
          {groupedPhotos.flatMap(({ hour, photos }, groupIndex) =>
            photos.map((p, photoIndex) => (
              <TimelinePhoto
                key={p.id}
                photo={p}
                hourGroupIndex={groupIndex}
                photoIndex={photoIndex}
                onUpdate={handlePhotoUpdate}
                onDelete={handlePhotoDelete}
                onRemoveBg={handlePhotoRemoveBg}
              />
            ))
          )}

          {/* text objects */}
          {textObjects.map((t) => {
            // 텍스트가 속한 시간대의 그룹 인덱스 찾기
            const groupIndex = groupedPhotos.findIndex(g => g.hour === t.hour);
            return (
              <TimelineText
                key={t.id}
                textObject={t}
                hourGroupIndex={groupIndex >= 0 ? groupIndex : 0}
                onUpdate={handleTextUpdate}
                onDelete={handleTextDelete}
              />
            );
          })}
        </div>
      </div>

      {/* text modal */}
      {showTextModal && (
        <TextInputModal
          onSubmit={handleAddText}
          onClose={() => {
            setShowTextModal(false);
            setContextMenuHour(null);
            onTextModalClose?.();
          }}
        />
      )}

      {/* loading modal */}
      {isRemovingBg && <LoadingModal message="배경을 제거하고 있습니다..." />}
    </div>
  );
}
