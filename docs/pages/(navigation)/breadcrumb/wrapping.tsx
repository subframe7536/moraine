import { Breadcrumb, Button } from '@src'
import { createSignal } from 'solid-js'

export function Wrapping() {
  const [wrap, setWrap] = createSignal(true)

  return (
    <div class="min-w-0 w-full space-y-3">
      <Button onClick={() => setWrap((value) => !value)}>
        Wrap: {wrap() ? 'enabled' : 'disabled'}
      </Button>

      <div class="p-3 border border-border rounded-lg max-w-xs overflow-x-auto">
        <Breadcrumb
          wrap={wrap()}
          items={[
            { label: 'Component documentation', href: '/' },
            { label: 'Navigation and page organization', href: '/breadcrumb' },
            { label: 'Responsive breadcrumb trails' },
          ]}
        />
      </div>
    </div>
  )
}
