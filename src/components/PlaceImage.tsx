"use client";

import Image from "next/image";
import { useState } from "react";

const placeholderByCategory: Record<string, string> = {
  food: "/placeholders/food.svg",
  music: "/placeholders/music.svg",
  finds: "/placeholders/finds.svg",
  events: "/placeholders/events.svg",
  outdoors: "/placeholders/outdoors.svg",
  shopping: "/placeholders/shopping.svg",
};

export function PlaceImage({
  src,
  alt,
  category,
  className,
  sizes = "100vw",
}: {
  src: string;
  alt: string;
  category?: string;
  className?: string;
  sizes?: string;
}) {
  const fallback = placeholderByCategory[category ?? ""] ?? "/placeholders/default.svg";
  const [imgSrc, setImgSrc] = useState(src || fallback);

  return (
    <div className={`relative ${className ?? ""}`}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => setImgSrc(fallback)}
      />
    </div>
  );
}
