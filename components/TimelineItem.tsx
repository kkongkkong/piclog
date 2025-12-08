// components/TimelineItem.tsx
export default function TimelineItem({ hour, startHour = 0 }: { hour: number; startHour?: number }) {
  const topPosition = (hour - startHour) * 150;

  return (
    <div className="timeline-hour-item" style={{ top: `${topPosition}px` }}>
      <span className="timeline-hour-label">
        {hour.toString().padStart(2, "0")}:00
      </span>
      <div className="timeline-hour-line" />
    </div>
  );
}
