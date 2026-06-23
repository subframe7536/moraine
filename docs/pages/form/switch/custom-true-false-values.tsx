import { Switch } from '@src'
import { createSignal } from 'solid-js'

export function CustomTrueFalseValues() {
  const [deploymentGuard, setDeploymentGuard] = createSignal<'enabled' | 'disabled'>('disabled')

  return (
    <div class="max-w-xl space-y-3">
      <Switch<'enabled', 'disabled'>
        label="Deployment gate"
        description="Domain value binding"
        trueValue="enabled"
        falseValue="disabled"
        checked={deploymentGuard()}
        onChange={setDeploymentGuard}
        checkedIcon="i-lucide-check-check"
        uncheckedIcon="i-lucide-x"
      />
      <p class="text-xs text-muted-foreground">Current value: {deploymentGuard()}</p>
    </div>
  )
}
