// jsdom reports `0s` for elements without a stylesheet animation, so exit presence
// completes immediately. Give closing elements a real animation, as CSS does in a browser,
// so tests can wait for `animationend` the same way consumers do.
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
