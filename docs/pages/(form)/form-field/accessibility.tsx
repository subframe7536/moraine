import { Button, FormField, Input } from '@src'
import { createSignal } from 'solid-js'

export function Accessibility() {
  const [hasError, setHasError] = createSignal(true)

  return (
    <div class="max-w-md w-full space-y-4">
      <FormField
        label="Organization Handle"
        hint="Public identifier"
        description="Used for vanity subdomains and team invites."
        help="Allowed characters: lowercase letters, numbers, and dashes."
        error={hasError() ? 'Handle is already claimed by another team.' : undefined}
        required
      >
        <Input value="acme-corp" />
      </FormField>

      <div class="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setHasError((prev) => !prev)}>
          Toggle Error State (ARIA Alert)
        </Button>
      </div>
    </div>
  )
}
