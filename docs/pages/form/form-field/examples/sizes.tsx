import { FormField, Input } from '@src'
import type { FormFieldT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES: FormFieldSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type FormFieldSizeName = Exclude<FormFieldT.Variant['size'], undefined>

  return (
    <div class="gap-4 grid sm:grid-cols-2">
      <For each={SIZES}>
        {(size) => (
          <FormField
            size={size}
            label={`Workspace Name (${size})`}
            description="Name used in URLs and workspace-level permissions."
            help="Use lowercase letters, numbers, and dashes."
          >
            <Input size={size} placeholder={`acme-platform-${size}`} />
          </FormField>
        )}
      </For>
    </div>
  )
}
