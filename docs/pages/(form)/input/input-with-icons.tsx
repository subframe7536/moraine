import { Button, Icon, Input } from '@src'
import { createSignal } from 'solid-js'

export function InputWithIcons() {
  const [showPassword, setShowPassword] = createSignal(false)
  const [query, setQuery] = createSignal('SolidJS reactive components')

  return (
    <div class="gap-4 grid max-w-2xl sm:grid-cols-2">
      <Input
        type={showPassword() ? 'text' : 'password'}
        defaultValue="my_super_secret_token_123"
        leading="i-lucide:lock"
        trailing={
          <Button
            variant="ghost"
            size="sm"
            class="p-0 h-6 w-6 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword() ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword() ? 'i-lucide:eye-off' : 'i-lucide:eye'} class="size-3.5" />
          </Button>
        }
        placeholder="Enter password"
      />

      <Input
        value={query()}
        onInput={(e) => setQuery(e.currentTarget.value)}
        leading="i-lucide:search"
        trailing={
          query() ? (
            <Button
              variant="ghost"
              size="sm"
              class="p-0 h-6 w-6 hover:bg-transparent"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <Icon name="i-lucide:x" class="size-3.5" />
            </Button>
          ) : undefined
        }
        placeholder="Search documents..."
      />

      <Input
        leading={
          <div class="text-xs text-muted-foreground font-mono flex gap-1 items-center">
            <Icon name="i-lucide:globe" class="size-3.5" />
            https://
          </div>
        }
        trailing={<span class="text-xs text-muted-foreground font-mono">.moraine.dev</span>}
        placeholder="project-slug"
      />

      <Input
        leading={<span class="text-xs text-muted-foreground font-semibold">$</span>}
        trailing={<span class="text-xs text-muted-foreground">USD / mo</span>}
        defaultValue="49.00"
        placeholder="0.00"
      />
    </div>
  )
}
