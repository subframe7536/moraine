import 'solid-toaster/style.css'

import { Toaster } from 'solid-toaster'

const TOASTER_STYLE = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
}

export const ToastHosts = () => {
  return (
    <>
      <Toaster preventDuplicate style={TOASTER_STYLE} visibleToasts={4} />
      <Toaster id="custom" position="bottom-left" style={TOASTER_STYLE} />
    </>
  )
}
