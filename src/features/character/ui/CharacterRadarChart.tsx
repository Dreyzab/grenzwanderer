import { useMemo } from "react";
import { GameIcon } from "../../../shared/ui/icons/game-icons";
import type { VoiceOrDeptId } from "../../../shared/ui/icons/game-icons";

export interface CharacterRadarDatum {
  key: string;
  label: string;
  icon: VoiceOrDeptId;
  color: string;
  value: number;
}

const getChartCeiling = (values: number[]): number => {
  const highestValue = values.length > 0 ? Math.max(...values) : 0;
  return Math.max(6, Math.ceil(highestValue) + 1);
};

const VIEWBOX_SIZE = 320;
const CENTER = VIEWBOX_SIZE / 2;
const OUTER_RADIUS = 108;
const ICON_RADIUS = 132;
const ICON_SIZE = 26;
const RING_COUNT = 6;

const getAngle = (index: number, total: number): number =>
  -Math.PI / 2 + (index / total) * Math.PI * 2;

const polarPoint = (angle: number, radius: number) => ({
  x: CENTER + Math.cos(angle) * radius,
  y: CENTER + Math.sin(angle) * radius,
});

const formatPoint = ({ x, y }: { x: number; y: number }): string =>
  `${x.toFixed(2)},${y.toFixed(2)}`;

const buildPolygonPoints = (
  data: CharacterRadarDatum[],
  radiusForEntry: (entry: CharacterRadarDatum) => number,
): string =>
  data
    .map((entry, index) =>
      formatPoint(
        polarPoint(getAngle(index, data.length), radiusForEntry(entry)),
      ),
    )
    .join(" ");

const clampToRange = (value: number, max: number): number =>
  Math.max(0, Math.min(max, value));

interface RadarIconPoint {
  entry: CharacterRadarDatum;
  x: number;
  y: number;
}

const buildRadarGeometry = (
  data: CharacterRadarDatum[],
  chartCeiling: number,
) => {
  const ringPolygons =
    data.length > 0
      ? Array.from({ length: RING_COUNT }, (_, index) =>
          buildPolygonPoints(
            data,
            () => ((index + 1) / RING_COUNT) * OUTER_RADIUS,
          ),
        )
      : [];
  const axes = data.map((entry, index) => ({
    key: entry.key,
    end: polarPoint(getAngle(index, data.length), OUTER_RADIUS),
  }));
  const icons: RadarIconPoint[] = data.map((entry, index) => {
    const point = polarPoint(getAngle(index, data.length), ICON_RADIUS);
    return { entry, ...point };
  });
  const radarPolygon = buildPolygonPoints(
    data,
    (entry) =>
      (clampToRange(entry.value, chartCeiling) / chartCeiling) * OUTER_RADIUS,
  );

  return { axes, icons, radarPolygon, ringPolygons };
};

export const CharacterRadarChart = ({
  data,
}: {
  data: CharacterRadarDatum[];
}) => {
  const chartCeiling = useMemo(
    () => getChartCeiling(data.map((entry) => entry.value)),
    [data],
  );
  const geometry = useMemo(
    () => buildRadarGeometry(data, chartCeiling),
    [chartCeiling, data],
  );

  return (
    <div
      className="h-[320px] w-full sm:h-[360px]"
      data-testid="character-radar"
    >
      <svg
        aria-label="Patron voice radar chart"
        className="h-full w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        <defs>
          <linearGradient id="character-radar-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d4a74f" stopOpacity={0.38} />
            <stop offset="100%" stopColor="#8f6732" stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <g aria-hidden="true">
          {geometry.ringPolygons.map((points, index) => (
            <polygon
              key={points}
              fill="none"
              points={points}
              stroke="rgba(148, 163, 184, 0.25)"
              strokeDasharray={
                index === geometry.ringPolygons.length - 1 ? "0" : "3 6"
              }
              strokeWidth={1}
            />
          ))}
          {geometry.axes.map((axis) => (
            <line
              key={axis.key}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeWidth={1}
              x1={CENTER}
              x2={axis.end.x}
              y1={CENTER}
              y2={axis.end.y}
            />
          ))}
        </g>
        {geometry.radarPolygon ? (
          <polygon
            data-testid="character-radar-polygon"
            fill="url(#character-radar-fill)"
            points={geometry.radarPolygon}
            stroke="#d4a74f"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        ) : null}
        {geometry.icons.map(({ entry, x, y }) => (
          <g
            key={entry.key}
            transform={`translate(${x - ICON_SIZE / 2}, ${y - ICON_SIZE / 2})`}
          >
            <title>{entry.label}</title>
            <circle
              cx={ICON_SIZE / 2}
              cy={ICON_SIZE / 2}
              fill="#100e0c"
              fillOpacity={0.88}
              r={17}
              stroke={entry.color}
              strokeOpacity={0.45}
            />
            <GameIcon
              name={entry.icon}
              size={ICON_SIZE}
              style={{ color: entry.color }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
