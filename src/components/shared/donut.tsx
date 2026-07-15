const PALETTE = ["#126a5a", "#f4c95d", "#3b82f6", "#a855f7", "#94a3b8"];

export function Donut({
  segments,
  size = 88,
}: {
  segments: Array<{ label: string; value: number }>;
  size?: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;

  const arcs: Array<{ label: string; dash: number; offset: number; color: string }> =
    [];
  let running = 0;
  for (let index = 0; index < segments.length; index += 1) {
    const dash = (segments[index].value / total) * circumference;
    arcs.push({
      label: segments[index].label,
      dash,
      offset: running,
      color: PALETTE[index % PALETTE.length],
    });
    running += dash;
  }

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={8}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </g>
      </svg>
      <ul className="space-y-1 text-xs">
        {segments.map((segment, index) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
