import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { AuthService } from '../services/AuthService';
import { TaskService } from '../services/TaskService';
import { SensorService } from '../services/SensorService';
import { NavigationManager } from '../core/NavigationManager';
import { useTerminalSize } from './hooks/useTerminalSize';
import SignUpScreen from './SignUpScreen';
import TasksPanel, { TaskRow } from './TasksPanel';
import SensorsPanel, { SensorData } from './SensorsPanel';

const EMPTY_SENSORS: SensorData = {
  cpuTemp: null,
  cpuMax: null,
  batteryPercent: null,
  charging: false,
  fans: [],
};

export default function App() {
  const { exit } = useApp();
  const { columns, rows } = useTerminalSize();

  const auth = useRef(new AuthService()).current;
  const taskSvc = useRef(new TaskService()).current;
  const sensorSvc = useRef(new SensorService()).current;
  const nav = useRef(new NavigationManager()).current;

  const [user, setUser] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [sensors, setSensors] = useState<SensorData>(EMPTY_SENSORS);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const refresh = useCallback(async () => {
    try {
      const list = await taskSvc.getTasks();
      setTasks(taskSvc.sort(list, nav.sortKey));
      const [t, b, f] = await Promise.all([
        sensorSvc.getTemps(),
        sensorSvc.getBattery(),
        sensorSvc.getFans(),
      ]);
      setSensors({
        cpuTemp: t.main ?? null,
        cpuMax: t.max ?? null,
        batteryPercent: b.hasBattery ? b.percent : null,
        charging: !!b.isCharging,
        fans: f ?? [],
      });
      nav.clamp(list.length);
    } catch {
      /* keep last good data */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [user, refresh]);

  useInput(
    async (input, key) => {
      if (nav.confirmKill) {
        if (input === 'y') {
          const t = tasks[nav.selected];
          if (t) await taskSvc.kill(t.pid);
          nav.cancelKill();
          await refresh();
        } else if (input === 'n' || key.escape) nav.cancelKill();
        return rerender();
      }
      if (input === 'q') return exit();
      if (key.tab) nav.nextPanel();
      else if (key.upArrow) nav.move(-1, tasks.length);
      else if (key.downArrow) nav.move(1, tasks.length);
      else if (key.pageUp) nav.move(-10, tasks.length);
      else if (key.pageDown) nav.move(10, tasks.length);
      else if (input === 's') {
        nav.cycleSort();
        setTasks((t) => taskSvc.sort([...t], nav.sortKey));
      } else if (input === 'k' && nav.panel === 'tasks') nav.askKill();
      else if (input === 'r') await refresh();
      rerender();
    },
    { isActive: !!user }
  );

  if (!user) {
    return <SignUpScreen auth={auth} columns={columns} onAuthenticated={setUser} />;
  }

  const stacked = columns < 100;
  const bodyH = Math.max(8, rows - 3);
  const tasksW = stacked ? columns : Math.floor(columns * 0.62);
  const sensorsW = stacked ? columns : columns - tasksW;
  const tasksH = stacked ? Math.floor(bodyH * 0.6) : bodyH;
  const sensorsH = stacked ? bodyH - tasksH : bodyH;

  if (columns < 40 || rows < 12) {
    return <Text color="yellow">Terminal too small ({columns}x{rows}). Please enlarge.</Text>;
  }

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box justifyContent="space-between" paddingX={1}>
        <Text bold color="cyan">System Monitor</Text>
        <Text dimColor>{user}</Text>
      </Box>
      <Box flexDirection={stacked ? 'column' : 'row'}>
        <TasksPanel
          tasks={tasks}
          selected={nav.selected}
          active={nav.panel === 'tasks'}
          width={tasksW}
          height={tasksH}
          sortKey={nav.sortKey}
          confirmKill={nav.confirmKill}
        />
        <SensorsPanel data={sensors} active={nav.panel === 'sensors'} width={sensorsW} height={sensorsH} />
      </Box>
      <Box paddingX={1}>
        <Text dimColor>Tab panel · ↑↓ select · s sort · k kill · r refresh · q quit</Text>
      </Box>
    </Box>
  );
}