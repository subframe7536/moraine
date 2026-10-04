import { Button, NavigationMenu } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [value, setValue] = createSignal<string | null>(null)
  const [disabled, setDisabled] = createSignal(false)
  return (
    <div class="min-h-56 space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setValue('account')}>
          Open account
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValue(null)}>
          Close
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDisabled((value) => !value)}>
          Toggle disabled
        </Button>
      </div>
      <NavigationMenu
        aria-label="Account navigation"
        value={value()}
        onValueChange={setValue}
        disabled={disabled()}
      >
        <NavigationMenu.List>
          <NavigationMenu.Item value="account">
            <NavigationMenu.Trigger>Account</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div class="w-48">
                <NavigationMenu.Link href="#profile" closeOnClick>
                  Profile
                </NavigationMenu.Link>
                <NavigationMenu.Link href="#settings" closeOnClick>
                  Settings
                </NavigationMenu.Link>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="billing" disabled>
            <NavigationMenu.Trigger>Billing</NavigationMenu.Trigger>
            <NavigationMenu.Content>Billing is unavailable.</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
      <p class="text-xs text-muted-foreground">Open item: {value() ?? 'none'}</p>
    </div>
  )
}
