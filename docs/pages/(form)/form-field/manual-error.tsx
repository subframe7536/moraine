import { Button, FormField, Input } from '@src'
import { createSignal } from 'solid-js'

export function ManualError() {
  const [error, setError] = createSignal<string | undefined>('Personal access token has expired.')
  const [token, setToken] = createSignal('ghp_9f823a10bc47e')

  const handleInput = (val: string) => {
    setToken(val)
    if (error()) {
      setError(undefined)
    }
  }

  return (
    <div class="max-w-md w-full space-y-4">
      <FormField
        label="Personal Access Token"
        hint="Fine-grained permissions"
        description="Required to synchronize remote repositories."
        error={error()}
        required
      >
        <Input
          type="password"
          value={token()}
          onInput={(e) => handleInput(e.currentTarget.value)}
          placeholder="Enter new token..."
        />
      </FormField>

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
