import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/theme';

type Props = {
  data: number[];
  width: number;             // measured px width (path coords need a number)
  height?: number;
  color?: string;            // stroke + gradient base
  strokeWidth?: number;
  fillOpacity?: number;      // top stop opacity of the area fill
  min?: number;              // optional fixed y-domain
  max?: number;
  padding?: number;          // vertical breathing room in px
};

// Smooth (Catmull-Rom → bezier) SVG area chart with a fading LinearGradient
// fill. The "organic data, not chart-kit" moment from the redesign direction.
export function AreaChart({
  data,
  width,
  height = 72,
  color = Colors.accent,
  strokeWidth = 2.4,
  fillOpacity = 0.34,
  min,
  max,
  padding = 6,
}: Props) {
  const gid = React.useId();
  if (!data || data.length === 0 || width <= 0) return <Svg width={width} height={height} />;

  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const span = hi - lo || 1;
  const n = data.length;

  const pts = data.map((v, i) => ({
    x: n === 1 ? width / 2 : (i / (n - 1)) * width,
    y: padding + (1 - (v - lo) / span) * (height - padding * 2),
  }));

  // Catmull-Rom → cubic bezier for a natural curve
  let line = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  const area = `${line} L${pts[n - 1].x},${height} L${pts[0].x},${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={fillOpacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${gid})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
