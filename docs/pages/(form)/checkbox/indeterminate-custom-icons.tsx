import { Button, Checkbox } from '@src'
import { createSignal } from 'solid-js'

export function IndeterminateCustomIcons() {
  const [indeterminate, setIndeterminate] = createSignal<'indeterminate' | boolean>('indeterminate')

  return (
    <div class="max-w-xl space-y-3">
      <Checkbox
        label="Permissions"
        description={`Current: ${String(indeterminate())}`}
        checked={indeterminate()}
        onChange={setIndeterminate}
        checkedIcon="i-lucide:check-check"
        indeterminateIcon="i-lucide:ellipsis"
      />
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setIndeterminate('indeterminate')}>
          Set indeterminate
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIndeterminate(true)}>
          Set checked
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIndeterminate(false)}>
          Set unchecked
        </Button>
      </div>
    </div>
  )
}
