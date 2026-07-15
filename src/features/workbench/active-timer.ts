export const IDLE_THRESHOLD_MS = 120_000;
export const MAX_SESSION_CAP_SECONDS = 14_400;

type ActiveTimerOptions = {
  idleThresholdMs?: number;
  maxSessionCapSeconds?: number;
  now?: () => number;
};

export class ActiveTimer {
  private accumulatedMs = 0;
  private lastActivityTs: number | null;
  private readonly idleThresholdMs: number;
  private readonly maxSessionCapMs: number;
  private readonly now: () => number;

  constructor(options: ActiveTimerOptions = {}) {
    this.idleThresholdMs = options.idleThresholdMs ?? IDLE_THRESHOLD_MS;
    this.maxSessionCapMs =
      (options.maxSessionCapSeconds ?? MAX_SESSION_CAP_SECONDS) * 1000;
    this.now = options.now ?? Date.now;
    this.lastActivityTs = this.now();
  }

  recordActivity(at = this.now()) {
    if (this.lastActivityTs !== null) {
      this.addActiveDelta(at - this.lastActivityTs);
    }
    this.lastActivityTs = at;
  }

  pause(at = this.now()) {
    if (this.lastActivityTs !== null) {
      this.addActiveDelta(at - this.lastActivityTs);
    }
    this.lastActivityTs = null;
  }

  resume(at = this.now()) {
    this.lastActivityTs = at;
  }

  reset(at = this.now()) {
    this.accumulatedMs = 0;
    this.lastActivityTs = at;
  }

  elapsedSeconds(at = this.now()) {
    const liveMs =
      this.lastActivityTs === null ? 0 : this.countableDelta(at - this.lastActivityTs);
    return Math.min(
      Math.floor(this.maxSessionCapMs / 1000),
      Math.floor((this.accumulatedMs + liveMs) / 1000),
    );
  }

  private addActiveDelta(deltaMs: number) {
    this.accumulatedMs = Math.min(
      this.maxSessionCapMs,
      this.accumulatedMs + this.countableDelta(deltaMs),
    );
  }

  private countableDelta(deltaMs: number) {
    if (deltaMs <= 0 || deltaMs > this.idleThresholdMs) {
      return 0;
    }
    return deltaMs;
  }
}
