import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { GameIcon } from "../../../shared/ui/icons/game-icons";
import type {
  CharacterAttributeDefinition,
  CharacterAttributeKey,
} from "../characterScreenModel";

export interface CharacterRadarDatum {
  key: CharacterAttributeKey;
  label: string;
  icon: CharacterAttributeDefinition["icon"];
  color: string;
  value: number;
}

const getChartCeiling = (values: number[]): number => {
  const highestValue = values.length > 0 ? Math.max(...values) : 0;
  return Math.max(6, Math.ceil(highestValue) + 1);
};

const RadarIconTick = ({
  x = 0,
  y = 0,
  payload,
  entries,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  entries: Map<string, CharacterRadarDatum>;
}) => {
  const entry = entries.get(String(payload?.value ?? ""));

  if (!entry) {
    return null;
  }

  const iconSize = 26;

  return (
    <g transform={`translate(${x - iconSize / 2}, ${y - iconSize / 2})`}>
      <title>{entry.label}</title>
      <circle
        cx={iconSize / 2}
        cy={iconSize / 2}
        r={17}
        fill="#100e0c"
        fillOpacity={0.88}
        stroke={entry.color}
        strokeOpacity={0.45}
      />
      <svg width={iconSize} height={iconSize}>
        <GameIcon
          name={entry.icon}
          size={iconSize}
          style={{ color: entry.color }}
        />
      </svg>
    </g>
  );
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
  const entries = useMemo(
    () => new Map(data.map((entry) => [entry.key, entry])),
    [data],
  );

  return (
    <div
      className="h-[320px] w-full sm:h-[360px]"
      data-testid="character-radar"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <defs>
            <linearGradient
              id="character-radar-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#d4a74f" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#8f6732" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 6" />
          <PolarAngleAxis
            dataKey="key"
            axisLine={false}
            tickLine={false}
            tick={<RadarIconTick entries={entries} />}
          />
          <PolarRadiusAxis
            angle={24}
            axisLine={false}
            domain={[0, chartCeiling]}
            tick={false}
            tickCount={chartCeiling}
          />
          <Radar
            dataKey="value"
            fill="url(#character-radar-fill)"
            fillOpacity={1}
            isAnimationActive
            stroke="#d4a74f"
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
