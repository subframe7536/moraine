import { Checkbox } from '@src'
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
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setIndeterminate('indeterminate')}
        >
          Set indeterminate
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setIndeterminate(true)}
        >
          Set checked
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 b-(1 border) rounded-md hover:bg-muted"
          onClick={() => setIndeterminate(false)}
        >
          Set unchecked
        </button>
      </div>
    </div>
  )
}
