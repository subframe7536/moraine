import { Breadcrumb, Button } from '@src'
import { createSignal } from 'solid-js'

export function Wrapping() {
  const [wrap, setWrap] = createSignal(true)

  return (
    <div class="space-y-3">
      <Button onClick={() => setWrap((value) => !value)}>
        Wrap: {wrap() ? 'enabled' : 'disabled'}
      </Button>

      <div class="max-w-md">
        <Breadcrumb
          wrap={wrap()}
          items={[
            { label: 'Very long section name that can wrap', href: '#' },
            { label: 'Another long nested section title', href: '#' },
            { label: 'Current page with long title', href: '#', active: true },
          ]}
        />
      </div>
    </div>
  )
}
