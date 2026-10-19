import React from 'react';
import { Box, Text } from 'ink';

export interface SensorData {
  cpuTemp: number | null;
  cpuMax: number | null;
  batteryPercent: number | null;
  charging: boolean;
  fans: number[];
}

interface Props {
  data: SensorData;
  active: boolean;
  width: number;
  height: number;
}

function bar(value: number | null, width: number): string {
  if (value == null) return '░'.repeat(width);
  const filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

const colorFor = (v: number | null) => (v == null ? 'gray' : v > 80 ? 'red' : v > 60 ? 'yellow' : 'green');

export default function SensorsPanel({ data, active, width, height }: Props) {
  const barW = Math.max(10, width - 24);
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={active ? 'cyan' : 'gray'}
      width={width}
      height={height}
      paddingX={1}
    >
      <Text bold color={active ? 'cyan' : 'white'}>Sensors</Text>

      <Box marginTop={1} flexDirection="column">
        <Text>CPU Temp: {data.cpuTemp != null ? `${data.cpuTemp.toFixed(1)}°C` : 'N/A'}</Text>
        <Text color={colorFor(data.cpuTemp)}>{bar(data.cpuTemp, barW)}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>
          Battery: {data.batteryPercent != null ? `${data.batteryPercent}%` : 'N/A'}
          {data.charging ? ' ⚡' : ''}
        </Text>
        <Text color={data.batteryPercent != null && data.batteryPercent < 20 ? 'red' : 'green'}>
          {bar(data.batteryPercent, barW)}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>Fans: {data.fans.length ? data.fans.map((f) => `${f} RPM`).join(', ') : 'N/A'}</Text>
      </Box>
    </Box>
  );
}