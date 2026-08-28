import { FormField, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function NativeBehavior() {
  const [bio, setBio] = createSignal('Frontend developer passionate about accessible web UI.')

  return (
    <div class="max-w-md w-full space-y-3">
      <FormField label="Biography">
        <Textarea value={bio()} onValueChange={setBio} rows={3} />
      </FormField>
      <p class="text-xs text-muted-foreground">
        Length: <span class="text-foreground font-mono">{bio().length}</span> characters
      </p>
    </div>
  )
}
