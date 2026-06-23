import { Input } from '@src'

export function InputStates() {
  return (
    <div class="gap-3 grid sm:grid-cols-2">
      <Input loading placeholder="Loading..." />
      <Input disabled placeholder="Disabled" value="Cannot edit" />
      <Input type="file" />
      <Input type="datetime-local" />
    </div>
  )
}
