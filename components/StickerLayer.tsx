// components/StickerLayer.tsx
import { useState } from "react";
import Transformable from "./Transformable";

interface StickerItem {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface StickerLayerProps {
  stickers: StickerItem[];
  onUpdate: (id: string, updates: Partial<StickerItem>) => void;
  onDelete: (id: string) => void;
}

export default function StickerLayer({
  stickers,
  onUpdate,
  onDelete,
}: StickerLayerProps) {
  return (
    <div className="sticker-layer">
      {stickers.map((item) => (
        <Transformable
          key={item.id}
          id={item.id}
          defaultX={item.x}
          defaultY={item.y}
          defaultScale={item.scale}
          defaultRotation={item.rotation}
          onChange={(u) => onUpdate(item.id, u)}
          onDelete={() => onDelete(item.id)}
        >
          <img src={item.url} className="sticker-img" />
        </Transformable>
      ))}
    </div>
  );
}
