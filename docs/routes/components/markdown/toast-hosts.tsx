import 'solid-toaster/style.css'

import { BaseToaster } from 'solid-toaster'

import { createMoraineToastIcons } from './toast-icons.tsx'

export const ToastHosts = () => {
  const TOASTER_STYLE = {
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    '--border-radius': 'var(--radius)',
  }
  return (
    <>
      <BaseToaster
        preventDuplicate
        style={TOASTER_STYLE}
        visibleToasts={4}
        icons={createMoraineToastIcons()}
      />
      <BaseToaster
        id="custom"
        position="bottom-left"
        style={TOASTER_STYLE}
        icons={createMoraineToastIcons()}
      />
    </>
  )
}
