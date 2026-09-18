import { Button, Icon, Input, InputGroup } from '@src'
import { createSignal, Show } from 'solid-js'

export function InputWithIcons() {
  const [showPassword, setShowPassword] = createSignal(false)
  const [query, setQuery] = createSignal('SolidJS reactive components')

  return (
    <div class="gap-4 grid max-w-2xl sm:grid-cols-2">
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:lock" />
        </InputGroup.Leading>
        <Input
          type={showPassword() ? 'text' : 'password'}
          defaultValue="my_super_secret_token_123"
          placeholder="Enter password"
        />
        <InputGroup.Trailing compact>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword() ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword() ? 'i-lucide:eye-off' : 'i-lucide:eye'} />
          </Button>
        </InputGroup.Trailing>
      </InputGroup>

      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:search" />
        </InputGroup.Leading>
        <Input
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder="Search documents..."
        />
        <InputGroup.Trailing compact>
          <Show when={query()}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <Icon name="i-lucide:x" />
            </Button>
          </Show>
        </InputGroup.Trailing>
      </InputGroup>

      <InputGroup>
        <InputGroup.Leading compact>
          <div class="text-xs text-muted-foreground font-mono flex gap-1 items-center">
            <Icon name="i-lucide:globe" class="size-3.5" />
            https://
          </div>
        </InputGroup.Leading>
        <Input placeholder="project-slug" />
        <InputGroup.Trailing compact>
          <span class="text-xs text-muted-foreground font-mono">.moraine.dev</span>
        </InputGroup.Trailing>
      </InputGroup>

      <InputGroup>
        <InputGroup.Leading>
          <span class="text-xs text-muted-foreground font-semibold">$</span>
        </InputGroup.Leading>
        <Input defaultValue="49.00" placeholder="0.00" />
        <InputGroup.Trailing>
          <span class="text-xs text-muted-foreground">USD / mo</span>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
