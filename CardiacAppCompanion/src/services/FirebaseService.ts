/**
 * FirebaseService.ts
 * ─────────────────────────────────────────────────────────────────
 * Listens to the CorAssist Bridge Firebase Realtime Database.
 * Endpoint: https://corassist-bridge-default-rtdb.firebaseio.com/data/status
 *
 * Strategy: REST API polling (every 2 s) — works on both iOS & Android
 * without any API-key configuration, as long as RTDB rules allow
 * unauthenticated reads (the default for test-mode databases).
 *
 * Alert mapping (case-insensitive, value trimmed):
 *   "CARDIAC ALERT"  →  full-screen SOS overlay
 *   "FALL DETECTED"  →  full-screen SOS overlay
 *   "STABLE"         →  auto-reset to normal dashboard
 * ─────────────────────────────────────────────────────────────────
 */

const RTDB_BASE_URL =
  'https://corassist-bridge-default-rtdb.firebaseio.com';

const STATUS_ENDPOINT = `${RTDB_BASE_URL}/data/status.json`;

/** How often to poll Firebase (ms) */
const POLL_INTERVAL_MS = 2000;

// ── Alert status constants ────────────────────────────────────────
export const ALERT_STATUSES = ['CARDIAC ALERT', 'FALL DETECTED'] as const;
export const STABLE_STATUS  = 'STABLE';

export type HardwareStatus =
  | typeof ALERT_STATUSES[number]
  | typeof STABLE_STATUS
  | string;

// ── Internal helpers ──────────────────────────────────────────────
async function fetchStatus(): Promise<HardwareStatus | null> {
  const response = await fetch(STATUS_ENDPOINT, {
    method : 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const raw = await response.json();

  // Firebase REST returns the value directly (could be string or null)
  if (raw === null || raw === undefined) return null;

  // Normalize: uppercase + trim so comparisons are case-insensitive
  return String(raw).trim().toUpperCase() as HardwareStatus;
}

// ── Public API ────────────────────────────────────────────────────
/**
 * Starts a polling loop against /data/status.json.
 *
 * @param onStatusChange  Fired on every poll that returns a non-null value.
 * @param onError         Optional error callback (polling continues after errors).
 * @returns               Stop function — call it to cancel the poll loop.
 */
export function subscribeToHardwareStatus(
  onStatusChange : (status: HardwareStatus) => void,
  onError?       : (error: Error) => void
): () => void {
  let active       = true;
  let lastStatus   = '';          // Suppress duplicate callbacks
  let errorBackoff = POLL_INTERVAL_MS;

  const poll = async () => {
    if (!active) return;

    try {
      const status = await fetchStatus();

      if (status !== null) {
        if (status !== lastStatus) {
          lastStatus   = status;
          errorBackoff = POLL_INTERVAL_MS; // Reset backoff on success
          onStatusChange(status);
        }
      }

      // Schedule next poll
      if (active) setTimeout(poll, POLL_INTERVAL_MS);

    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn('[FirebaseService] Poll error:', error.message);
      onError?.(error);

      // Exponential back-off on repeated errors (max 30 s)
      errorBackoff = Math.min(errorBackoff * 2, 30_000);
      if (active) setTimeout(poll, errorBackoff);
    }
  };

  // Kick off immediately
  poll();

  // Return cleanup / stop function
  return () => {
    active = false;
  };
}

/**
 * One-shot read of the current status value.
 * Useful for initialising state on mount.
 */
export async function readStatusOnce(): Promise<HardwareStatus | null> {
  try {
    return await fetchStatus();
  } catch {
    return null;
  }
}
