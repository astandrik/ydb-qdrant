let exitFn: (code: number) => void = (code: number) => {
  // Use process.exit in production; this will be overridden in tests.
  process.exit(code);
};

export function scheduleExit(code: number): void {
  // Schedule exit on the next tick so HTTP responses can be flushed first.
  setImmediate(() => exitFn(code));
}

// Test-only: allow overriding the underlying exit behavior.
export function __setExitFnForTests(fn: (code: number) => void): void {
  exitFn = fn;
}
