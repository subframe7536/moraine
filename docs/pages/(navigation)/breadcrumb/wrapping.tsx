import { Breadcrumb, Switch } from '@src'
import { createSignal } from 'solid-js'

export function Wrapping() {
  const [wrap, setWrap] = createSignal(true)

  return (
    <div class="min-w-0 w-full space-y-4">
      <Switch checked={wrap()} onChange={setWrap} label="Wrap items" />

      <div
        class="p-4 border border-border rounded-lg"
        classList={{ 'w-full max-w-sm': wrap(), 'w-max': !wrap() }}
      >
        <Breadcrumb
          wrap={wrap()}
          classes={{
            list: wrap() ? undefined : 'overflow-visible',
            item: wrap() ? undefined : 'shrink-0',
          }}
          items={[
            { label: 'Home', href: '#' },
            { label: 'Workspace', href: '#' },
            { label: 'Projects', href: '#' },
            { label: 'Design system', href: '#' },
            { label: 'Components', href: '#' },
            { label: 'Breadcrumb' },
          ]}
        />
      </div>

      <p class="text-sm text-muted-foreground">
        Turn wrapping off to show the full trail on a single line.
      </p>
    </div>
  )
}
