
import si from "systeminformation";

export class SensorManager {
  async getSensors() {
    const [temperature, battery, graphics, osInfo] =
      await Promise.all([
        si.cpuTemperature().catch(() => null),
        si.battery().catch(() => null),
        si.graphics().catch(() => null),
        si.osInfo().catch(() => null)
      ]);

    const cpuTemperature =
      Number.isFinite(temperature?.main) &&
      temperature.main > 0
        ? temperature.main
        : null;

    const batteryPercent =
      Number.isFinite(battery?.percent)
        ? battery.percent
        : null;

    const sensors = [
      {
        id: "cpu-temperature",
        name: "CPU Temperature",
        category: "Temperature",
        value: cpuTemperature,
        unit: "°C",
        available: cpuTemperature !== null,
        detail:
          cpuTemperature === null
            ? "Not exposed by this device or OS"
            : "Reported CPU temperature"
      },
      {
        id: "battery",
        name: "Battery Level",
        category: "Power",
        value: batteryPercent,
        unit: "%",
        available: batteryPercent !== null,
        detail:
          batteryPercent === null
            ? "Battery information unavailable"
            : battery.isCharging
              ? "Battery is charging"
              : "Battery status reported by OS"
      },
      ...(graphics?.controllers ?? []).map(
        (gpu, index) => {
          const utilization =
            Number.isFinite(gpu.utilizationGpu)
              ? gpu.utilizationGpu
              : null;

          return {
            id: `gpu-${index}`,
            name: gpu.model || `GPU ${index + 1}`,
            category: "Graphics",
            value: utilization,
            unit: "%",
            available: utilization !== null,
            detail:
              utilization === null
                ? "GPU utilization is unavailable"
                : "Reported GPU utilization"
          };
        }
      )
    ];

    return {
      hostname: osInfo?.hostname || "",
      sensors,
      collectedAt: new Date().toISOString()
    };
  }
}
