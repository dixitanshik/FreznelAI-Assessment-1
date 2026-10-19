
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Battery,
  CheckCircle2,
  Cpu,
  HardDrive,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Thermometer,
  Monitor,
  Zap,
  LockKeyhole,
  UserPlus,
  AlertCircle,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, firebaseConfigured } from "./firebase";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/+$/, "");

const views = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "processes", label: "Processes", icon: Activity },
  { id: "sensors", label: "Sensors", icon: Thermometer },
];

function formatBytes(bytes = 0) {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function formatUptime(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

async function fetchJson(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${endpoint} returned HTTP ${response.status}`
    );
  }

  return response.json();
}

function ProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!firebaseConfigured || !auth) {
      setError(
        "Firebase is not configured. Add your Firebase settings to Frontend/.env and restart the frontend."
      );
      return;
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const messages = {
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/email-already-in-use":
          "An account already exists for this email.",
        "auth/weak-password":
          "Choose a password with at least 6 characters.",
        "auth/too-many-requests":
          "Too many attempts. Please try again later.",
        "auth/operation-not-allowed":
          "Enable Email/Password sign-in in your Firebase console.",
      };

      setError(messages[err.code] || err.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration decoration-one" />
      <div className="auth-decoration decoration-two" />

      <section className="auth-card">
        <div className="brand-mark">
          <Activity size={25} />
        </div>

        <div className="auth-eyebrow">FREZNEL AI · SYSTEMS</div>
        <h1>
          {mode === "login" ? "Welcome back." : "Create your account."}
        </h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to monitor your system in real time."
            : "Create an account to access your system dashboard."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          {error && (
            <div className="error-message" role="alert">
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <button className="primary-button auth-submit" disabled={busy}>
            {busy ? (
              <RefreshCw size={17} className="spin" />
            ) : mode === "login" ? (
              <LockKeyhole size={17} />
            ) : (
              <UserPlus size={17} />
            )}
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login"
            ? "New to the console?"
            : "Already have an account?"}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setError("");
              setMode((current) =>
                current === "login" ? "signup" : "login"
              );
            }}
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </div>

        <div className="auth-security">
          <ShieldCheck size={16} />
          Secured with Firebase Authentication
        </div>
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, detail, progress }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-icon">
          <Icon size={20} />
        </span>
        <span className="metric-label">{label}</span>
        <ArrowUpRight size={16} className="muted-icon" />
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
      {progress !== undefined && <ProgressBar value={progress} />}
    </article>
  );
}

function EmptyState({ children }) {
  return (
    <div className="empty-state">
      <Monitor size={28} />
      <p>{children}</p>
    </div>
  );
}

function ProcessTable({ processes }) {
  if (!processes?.length) {
    return <EmptyState>No matching processes found.</EmptyState>;
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>PROCESS</th>
              <th>PID</th>
              <th>CPU</th>
              <th>MEMORY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process, index) => (
              <tr key={`${process.pid}-${index}`}>
                <td>
                  <div className="process-name">
                    <span className="process-icon">
                      <Monitor size={15} />
                    </span>
                    <span title={process.name}>{process.name}</span>
                  </div>
                </td>
                <td className="mono">{process.pid}</td>
                <td>
                  <div className="cpu-cell">
                    <span>{Number(process.cpu || 0).toFixed(1)}%</span>
                    <div className="mini-progress">
                      <span
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, Number(process.cpu) || 0)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>{Number(process.memory || 0).toFixed(1)}%</td>
                <td>
                  <span className="process-status">
                    {process.state || "Running"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const [view, setView] = useState("overview");
  const [tasks, setTasks] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState("");

  const refreshData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    try {
      const [taskData, sensorDataResult] = await Promise.all([
        fetchJson("/api/system/tasks"),
        fetchJson("/api/system/sensors"),
      ]);

      // Keep the returned backend payloads in React state.
      setTasks(taskData);
      setSensorData(sensorDataResult);
      setLastUpdated(new Date());
      setApiError("");

      // Useful for checking the API response in browser DevTools.
      console.log("System tasks API response:", taskData);
      console.log("System sensors API response:", sensorDataResult);
    } catch (error) {
      console.error("Failed to fetch system data:", error);
      setApiError(
        `Cannot reach the backend at ${API_BASE_URL}. Check that the backend is running and the API routes are available.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const intervalId = window.setInterval(() => {
      refreshData();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refreshData]);

  useEffect(() => {
    function handleKeyboard(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        refreshData(true);
      }

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();

        setView((current) => {
          const index = views.findIndex((item) => item.id === current);
          const step = event.key === "ArrowRight" ? 1 : -1;
          return views[(index + step + views.length) % views.length].id;
        });
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [refreshData]);

  const filteredProcesses = useMemo(() => {
    const processes = tasks?.processes || [];
    const term = search.trim().toLowerCase();

    return processes.filter(
      (process) =>
        !term ||
        String(process.name || "").toLowerCase().includes(term) ||
        String(process.pid ?? "").includes(term) ||
        String(process.user || "").toLowerCase().includes(term)
    );
  }, [tasks, search]);

  const memory = tasks?.memory;
  const currentView = views.find((item) => item.id === view);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">
            <Activity size={21} />
          </div>
          <div>
            <strong>FREZNEL AI</strong>
            <span>SYSTEM CONSOLE</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="side-nav" aria-label="Dashboard sections">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {view === id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="connection-card">
          <span className="status-dot" />
          <div>
            <strong>Local system</strong>
            <span>{apiError ? "Connection issue" : "Monitoring enabled"}</span>
          </div>
        </div>

        <button
          type="button"
          className="nav-item logout-button"
          onClick={() => auth && signOut(auth)}
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>

        <div className="sidebar-footer">SYSTEM MONITOR · v1.0.0</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Console</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{currentView?.label || "Overview"}</strong>
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <span className="status-dot" />
              LIVE
            </span>
            <div className="user-avatar">
              {(user.email?.[0] || "U").toUpperCase()}
            </div>
            <span className="user-email">{user.email}</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SYSTEM INTELLIGENCE</div>
              <h1>
                {view === "overview"
                  ? "System overview"
                  : view === "processes"
                    ? "Running processes"
                    : "Hardware sensors"}
              </h1>
              <p>
                Monitor your machine&apos;s health, activity, and resource usage.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => refreshData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "spin" : ""}
              />
              Refresh
            </button>
          </div>

          {apiError && (
            <div className="error-banner" role="alert">
              <AlertCircle size={19} />
              <span>{apiError}</span>
              <button type="button" onClick={() => refreshData(true)}>
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-panel">
              <RefreshCw size={25} className="spin" />
              <p>Collecting system information...</p>
            </div>
          ) : (
            <>
              {view === "overview" && (
                <>
                  <div className="system-summary">
                    <div className="summary-icon">
                      <Monitor size={24} />
                    </div>
                    <div className="summary-info">
                      <span>CONNECTED DEVICE</span>
                      <h2>{tasks?.hostname || "Unknown device"}</h2>
                      <p>
                        {tasks?.distro || tasks?.platform || "Operating system"}{" "}
                        · {tasks?.arch || "Architecture unavailable"}
                      </p>
                    </div>
                    <div className="summary-status">
                      <CheckCircle2 size={16} />
                      {apiError ? "Connection issue" : "Device detected"}
                    </div>
                  </div>

                  <div className="section-heading">
                    <div>
                      <h2>Resource utilization</h2>
                      <p>Live performance indicators</p>
                    </div>
                    <span className="update-time">
                      <Clock3 size={14} />
                      {lastUpdated
                        ? `Updated ${lastUpdated.toLocaleTimeString()}`
                        : "Waiting for data"}
                    </span>
                  </div>

                  <div className="metrics-grid">
                    <MetricCard
                      icon={Cpu}
                      label="CPU USAGE"
                      value={`${Number(tasks?.cpuUsagePercent || 0).toFixed(1)}%`}
                      detail="Current processor load"
                      progress={tasks?.cpuUsagePercent}
                    />
                    <MetricCard
                      icon={HardDrive}
                      label="MEMORY USAGE"
                      value={
                        memory
                          ? `${Number(memory.usedPercent || 0).toFixed(1)}%`
                          : "N/A"
                      }
                      detail={
                        memory
                          ? `${formatBytes(memory.usedBytes)} of ${formatBytes(memory.totalBytes)}`
                          : "Memory information unavailable"
                      }
                      progress={memory?.usedPercent}
                    />
                    <MetricCard
                      icon={Activity}
                      label="PROCESSES"
                      value={tasks?.processCount ?? "—"}
                      detail="Processes detected by the OS"
                    />
                    <MetricCard
                      icon={Clock3}
                      label="SYSTEM UPTIME"
                      value={formatUptime(tasks?.uptimeSeconds || 0)}
                      detail="Time since last system start"
                    />
                  </div>

                  <div className="section-heading process-heading">
                    <div>
                      <h2>Top processes</h2>
                      <p>Highest reported CPU usage</p>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setView("processes")}
                    >
                      View all →
                    </button>
                  </div>

                  <ProcessTable processes={(tasks?.processes || []).slice(0, 5)} />
                </>
              )}

              {view === "processes" && (
                <>
                  <div className="inline-stats">
                    <div>
                      <span>Total processes</span>
                      <strong>{tasks?.processCount ?? "—"}</strong>
                    </div>
                    <div>
                      <span>Displayed</span>
                      <strong>{filteredProcesses.length}</strong>
                    </div>
                  </div>

                  <div className="search-box">
                    <Search size={18} />
                    <input
                      aria-label="Search processes"
                      placeholder="Search by process name, PID, or user..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>

                  <ProcessTable processes={filteredProcesses} />
                </>
              )}

              {view === "sensors" && (
                <>
                  <div className="sensor-note">
                    <Zap size={18} />
                    Sensor availability depends on your hardware and operating
                    system. Unavailable readings are shown explicitly.
                  </div>

                  <div className="sensor-grid">
                    {(sensorData?.sensors || []).map((sensor) => {
                      const SensorIcon =
                        sensor.category === "Temperature"
                          ? Thermometer
                          : sensor.category === "Power"
                            ? Battery
                            : Activity;

                      return (
                        <article className="sensor-card" key={sensor.id}>
                          <div className="sensor-card-top">
                            <span className="metric-icon">
                              <SensorIcon size={20} />
                            </span>
                            <span
                              className={`availability ${
                                sensor.available ? "available" : ""
                              }`}
                            >
                              <span className="status-dot" />
                              {sensor.available ? "Available" : "Unavailable"}
                            </span>
                          </div>
                          <p className="sensor-category">{sensor.category}</p>
                          <h2>{sensor.name}</h2>
                          <div className="sensor-value">
                            {sensor.available
                              ? `${sensor.value}${sensor.unit || ""}`
                              : "—"}
                          </div>
                          <p className="sensor-detail">{sensor.detail}</p>
                        </article>
                      );
                    })}
                  </div>

                  {(!sensorData?.sensors ||
                    sensorData.sensors.length === 0) && (
                    <EmptyState>
                      No sensor data was returned by the backend.
                    </EmptyState>
                  )}
                </>
              )}
            </>
          )}

          <footer className="page-footer">
            <span>FREZNEL AI SYSTEM CONSOLE</span>
            <span>
              <span className="status-dot" />
              Auto-refresh every 5 seconds · Press R to refresh · Use ← / → to
              switch views
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return undefined;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
  }, []);

  if (user === undefined) {
    return (
      <div className="auth-loading">
        <RefreshCw size={24} className="spin" />
        <p>Loading your session...</p>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <Dashboard user={user} />;
}
