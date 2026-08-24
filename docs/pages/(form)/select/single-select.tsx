import { Select } from '@src'
import type { SelectT } from '@src'
import { createSignal } from 'solid-js'

export function SingleSelect() {
  const ENV_OPTIONS: SelectT.Item[] = [
    { label: 'Production (us-east-1)', value: 'production', icon: 'i-lucide:shield-check' },
    { label: 'Staging (eu-central-1)', value: 'staging', icon: 'i-lucide:server' },
    { label: 'Preview (pr-branch-42)', value: 'preview', icon: 'i-lucide:git-branch' },
    { label: 'Local Dev (localhost:3000)', value: 'local', icon: 'i-lucide:laptop' },
    {
      label: 'Legacy Cluster (Deprecated)',
      value: 'legacy',
      disabled: true,
      icon: 'i-lucide:archive',
    },
  ]

  const [env, setEnv] = createSignal<SelectT.Value | null>('production')

  return (
    <div class="w-80 space-y-3">
      <label class="text-xs text-muted-foreground font-medium block">
        Select Active Environment
      </label>
      <Select
        options={ENV_OPTIONS}
        value={env()}
        onChange={setEnv}
        placeholder="Choose environment..."
        allowClear
      />
      <p class="text-xs text-muted-foreground">
        Active target: <span class="text-foreground font-medium font-mono">{env() ?? 'none'}</span>
      </p>
    </div>
  )
}
