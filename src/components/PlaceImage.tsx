"use client";

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
}: {
  src: string;
  alt: string;
  category?: string;
  className?: string;
}) {
  const fallback = placeholderByCategory[category ?? ""] ?? "/placeholders/default.svg";
  const [imgSrc, setImgSrc] = useState(src || fallback);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}
