import { Button, Icon, Input } from '@src'
import { createSignal } from 'solid-js'

export function InputStates() {
  const [copied, setCopied] = createSignal(false)
  const token = 'moraine_sec_9f823a10bc47e'

  const copyToken = () => {
    navigator.clipboard?.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="gap-4 grid max-w-2xl sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Checking availability...</label>
        <Input loading placeholder="Checking domain..." defaultValue="moraine-ui.dev" />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Read-only API token</label>
        <div class="flex gap-2">
          <Input readOnly value={token} class="text-xs font-mono" />
          <Button variant="outline" size="md" onClick={copyToken} aria-label="Copy token">
            <Icon name={copied() ? 'i-lucide:check' : 'i-lucide:copy'} class="size-4" />
          </Button>
        </div>
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Disabled enterprise field</label>
        <Input disabled value="Single Sign-On (SAML 2.0)" placeholder="Disabled" />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Validated username</label>
        <Input
          defaultValue="subframe7536"
          trailing={<Icon name="i-lucide:circle-check" class="text-primary size-4" />}
        />
      </div>
    </div>
  )
}
