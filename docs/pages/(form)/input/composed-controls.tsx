import { Button, Input } from '@src'
import { createSignal } from 'solid-js'

export function ComposedControls() {
  const [showPassword, setShowPassword] = createSignal(false)

  return (
    <div class="max-w-md w-full space-y-4">
      <Input
        type={showPassword() ? 'text' : 'password'}
        placeholder="Enter secret token"
        leading="i-lucide:key-round"
        trailing={
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword() ? 'Hide token' : 'Show token'}
          >
            <span class={showPassword() ? 'i-lucide:eye-off' : 'i-lucide:eye'} />
          </Button>
        }
      />
    </div>
  )
}
