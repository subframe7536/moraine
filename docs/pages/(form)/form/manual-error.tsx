import { Button, createForm, Input } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function ManualError() {
  const [error, setError] = createSignal<string | undefined>('Personal access token has expired.')
  const form = createForm({
    schema: v.object({ token: v.string() }),
    initialInput: { token: 'ghp_9f823a10bc47e' },
  })

  return (
    <div class="max-w-md w-full space-y-4">
      <form.Field
        name="token"
        label="Personal Access Token"
        hint="Fine-grained permissions"
        description="Required to synchronize remote repositories."
        error={error()}
        required
      >
        <Input
          type="password"
          onInput={() => {
            if (error()) {
              setError(undefined)
            }
          }}
          placeholder="Enter new token..."
        />
      </form.Field>

      <div class="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setError('Invalid API token checksum. Please regenerate in settings.')}
        >
          Simulate Server Error
        </Button>
      </div>
    </div>
  )
}
