// components/TimelineItem.tsx
export default function TimelineItem({ hour, index }: { hour: number; index: number }) {
  const topPosition = index * 150;

  return (
    <div className="timeline-hour-item" style={{ top: `${topPosition}px` }}>
      <span className="timeline-hour-label">
        {hour.toString().padStart(2, "0")}:00
      </span>
      <div className="timeline-hour-line" />
    </div>
  );
}
