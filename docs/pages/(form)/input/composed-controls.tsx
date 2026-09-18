import { Button, Icon, Input, InputGroup } from '@src'
import { createSignal } from 'solid-js'

export function ComposedControls() {
  const [showPassword, setShowPassword] = createSignal(false)

  return (
    <div class="max-w-md w-full space-y-4">
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:key-round" />
        </InputGroup.Leading>
        <Input type={showPassword() ? 'text' : 'password'} placeholder="Enter secret token" />
        <InputGroup.Trailing compact>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword() ? 'Hide token' : 'Show token'}
          >
            <Icon name={showPassword() ? 'i-lucide:eye-off' : 'i-lucide:eye'} />
          </Button>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
