"use client";

export default function MeteorBackground() {
  const meteors = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${2 + Math.random() * 3}s`,
  }));

  return (
    <div className="meteor-container">
      {meteors.map((m) => (
        <span
          key={m.id}
          className="meteor"
          style={{
            left: m.left,
            top: m.top,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </div>
  );
}
