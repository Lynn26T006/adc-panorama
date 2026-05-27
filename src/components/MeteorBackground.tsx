"use client";

import { useState } from "react";

const STAR_COUNT = 8;

interface Meteor {
  id: number;
  posX: string;
  posY: string;
  animDelay: string;
  animSpeed: string;
}

function makeMeteors(): Meteor[] {
  const items: Meteor[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    items.push({
      id: i,
      posX: `${Math.random() * 100}%`,
      posY: `${Math.random() * 100}%`,
      animDelay: `${Math.random() * 8}s`,
      animSpeed: `${2 + Math.random() * 3}s`,
    });
  }
  return items;
}

export default function MeteorBackground() {
  const [items] = useState(makeMeteors);

  return (
    <div className="meteor-container">
      {items.map((it) => (
        <span
          key={it.id}
          className="meteor"
          style={{
            left: it.posX,
            top: it.posY,
            animationDelay: it.animDelay,
            animationDuration: it.animSpeed,
          }}
        />
      ))}
    </div>
  );
}
