"use client";

const STAR_COUNT = 8;

function makeMeteor(idx: number) {
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  return {
    id: idx,
    posX: `${x}%`,
    posY: `${y}%`,
    animDelay: `${Math.random() * 8}s`,
    animSpeed: `${2 + Math.random() * 3}s`,
  };
}

export default function MeteorBackground() {
  const items = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    items.push(makeMeteor(i));
  }

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
