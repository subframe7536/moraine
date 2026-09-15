import { BaseSelect, Button } from '@src'

import { FrameworkListbox, frameworks } from './frameworks'
export default function Example() {
  return (
    <BaseSelect
      items={frameworks}
      itemToLabelString={(item) => `${item.value} ${item.description}`}
    >
      <BaseSelect.Trigger
        as={Button}
        variant="outline"
        class="min-w-52 justify-between"
        trailing="i-lucide:chevrons-up-down"
      >
        {(state) => (
          <span>
            {frameworks.find((item) => item.value === state.value[0])?.label ?? 'Select framework…'}
          </span>
        )}
      </BaseSelect.Trigger>
      <BaseSelect.Content>
        <FrameworkListbox items={() => frameworks} />
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
