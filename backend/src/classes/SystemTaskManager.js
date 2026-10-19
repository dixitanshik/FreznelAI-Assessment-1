
import os from "node:os";
import si from "systeminformation";

export class SystemTaskManager {
  async getSummary() {
    const [load, memory, osInfo, processInfo] =
      await Promise.all([
        si.currentLoad().catch(() => null),
        si.mem().catch(() => null),
        si.osInfo().catch(() => null),
        si.processes().catch(() => null)
      ]);

    const processes = (processInfo?.list ?? [])
      .map((process) => ({
        pid: Number(process.pid),
        name: String(
          process.name || process.command || "Unknown"
        ),
        cpu: Number(process.cpu ?? 0),
        memory: Number(process.mem ?? 0),
        user: String(process.user || ""),
        state: String(process.state || "unknown")
      }))
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 100);

    const totalMemory = memory?.total ?? 0;
    const usedMemory = memory?.active ?? 0;

    return {
      hostname: os.hostname(),
      platform: osInfo?.platform || os.platform(),
      distro: osInfo?.distro || "",
      arch: os.arch(),
      uptimeSeconds: os.uptime(),

      cpuUsagePercent: Number(
        load?.currentLoad ?? 0
      ),

      memory: memory
        ? {
            totalBytes: totalMemory,
            usedBytes: usedMemory,
            freeBytes: memory.available,
            usedPercent: totalMemory
              ? (usedMemory / totalMemory) * 100
              : 0
          }
        : null,

      processCount: processInfo?.all ?? processes.length,
      processes,
      collectedAt: new Date().toISOString()
    };
  }
}
