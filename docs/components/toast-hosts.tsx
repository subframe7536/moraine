import type { Component } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { For, createSignal, onMount } from 'solid-js'

const TOASTER_STYLE = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
}

type ToasterComponent = Component<Record<string, unknown>>

export const ToastHosts = () => {
  const [Toaster, setToaster] = createSignal<ToasterComponent>()

  onMount(async () => {
    await import('solid-toaster/style.css')
    const mod = await import('solid-toaster')
    setToaster(() => mod.Toaster as ToasterComponent)
  })

  return (
    <For each={Toaster() ? [Toaster()!] : []}>
      {(ToasterComponent) => (
        <>
          <Dynamic component={ToasterComponent} preventDuplicate style={TOASTER_STYLE} visibleToasts={4} />
          <Dynamic component={ToasterComponent} id="custom" position="bottom-left" style={TOASTER_STYLE} />
        </>
      )}
    </For>
  )
}
