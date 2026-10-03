import { Field, Input } from '@src'

export function HiddenLabel() {
  return (
    <div class="flex flex-col gap-4">
      <Field hiddenLabel="Filter commands" help="Search by command name or keyboard shortcut.">
        <Input placeholder="Filter commands…" />
      </Field>
      <Field
        hiddenLabel="Command prefix"
        orientation="horizontal"
        error="Enter a prefix that starts with a letter and contains no spaces."
      >
        <Input placeholder="Command prefix…" />
      </Field>
    </div>
  )
}
