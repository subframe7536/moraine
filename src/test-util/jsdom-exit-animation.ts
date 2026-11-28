// jsdom reports `0s` for elements without a stylesheet animation, so exit presence
// completes immediately. Give closing elements a real animation, as CSS does in a browser,
// so tests can wait for `animationend` the same way consumers do.
import { resetErrorHalt } from 'solid-js'
import { afterEach, vi } from 'vitest'

// Solid 2 dev halts the global scheduler on an uncaught reactive error and mirrors it
// to `reportError`. Tests that intentionally render a throwing component must not leak
// the halt into later tests or surface as unhandled errors — revive scheduling after
// each test and swallow the side-channel report (the throw itself still propagates).
if (typeof globalThis.reportError === 'function') {
  vi.stubGlobal('reportError', () => {})
}
afterEach(() => resetErrorHalt())

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    [data-closed] {
      animation: mo-test-exit 100ms linear forwards;
    }
    @keyframes mo-test-exit {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `
  document.head.append(style)
}
