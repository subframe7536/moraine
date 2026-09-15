import { BaseSelect, Button } from '@src'

import { FrameworkListbox, frameworks } from './frameworks'

export default function Example() {
  return (
    <BaseSelect items={frameworks} multiple defaultValue={['solid']} name="frameworks">
      <BaseSelect.Control>
        <BaseSelect.Trigger as={Button} variant="outline" class="min-w-52">
          {(state) => <span>{state.value.length} framework(s) selected</span>}
        </BaseSelect.Trigger>
      </BaseSelect.Control>
      <BaseSelect.Content>
        <FrameworkListbox items={() => frameworks} />
        <BaseSelect.Empty>No frameworks found.</BaseSelect.Empty>
      </BaseSelect.Content>
    </BaseSelect>
  )
}
