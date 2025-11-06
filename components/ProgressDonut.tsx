"use client";

interface ProgressDonutProps {
  value: number; // 0-1
}

export default function ProgressDonut({ value }: ProgressDonutProps) {
  const percentage = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#dbe2ff"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0046FF" />
            <stop offset="100%" stopColor="#FF8040" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-xl font-bold text-secondary">{percentage}%</span>
    </div>
  );
}
