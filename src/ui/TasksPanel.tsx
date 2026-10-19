import React from 'react';
import { Box, Text } from 'ink';
import type { SortKey } from '../core/NavigationManager';

export interface TaskRow {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

interface Props {
  tasks: TaskRow[];
  selected: number;
  active: boolean;
  width: number;
  height: number;
  sortKey: SortKey;
  confirmKill: boolean;
}

const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));

export default function TasksPanel({ tasks, selected, active, width, height, sortKey, confirmKill }: Props) {
  const inner = Math.max(20, width - 4);
  const nameW = Math.max(8, inner - 6 - 8 - 8 - 3);
  const visible = Math.max(3, height - 5);
  const start = Math.max(0, Math.min(selected - Math.floor(visible / 2), tasks.length - visible));
  const slice = tasks.slice(Math.max(0, start), Math.max(0, start) + visible);
  const sel = tasks[selected];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={active ? 'cyan' : 'gray'}
      width={width}
      height={height}
      paddingX={1}
    >
      <Text bold color={active ? 'cyan' : 'white'}>
        System Tasks <Text dimColor>({tasks.length}) sort: {sortKey}</Text>
      </Text>
      <Text bold dimColor>
        {pad('PID', 6)} {pad('NAME', nameW)} {pad('CPU%', 7)} {pad('MEM%', 7)}
      </Text>
      {slice.map((t, i) => {
        const idx = Math.max(0, start) + i;
        const isSel = idx === selected;
        return (
          <Text key={t.pid} inverse={isSel && active} color={isSel ? 'cyan' : undefined}>
            {pad(String(t.pid), 6)} {pad(t.name, nameW)} {pad(t.cpu.toFixed(1), 7)} {pad(t.mem.toFixed(1), 7)}
          </Text>
        );
      })}
      {confirmKill && sel ? (
        <Text color="yellow">Kill {sel.name} ({sel.pid})? press y to confirm, n to cancel</Text>
      ) : null}
    </Box>
  );
}