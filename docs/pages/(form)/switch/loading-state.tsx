import { Switch } from '@src'
import { createSignal } from 'solid-js'

export function LoadingState() {
  const [loading, setLoading] = createSignal(false)
  const [checked, setChecked] = createSignal(false)

  const handleToggle = (next: boolean) => {
    setLoading(true)
    setTimeout(() => {
      setChecked(next)
      setLoading(false)
    }, 1000)
  }

  return (
    <div class="max-w-md w-full">
      <Switch
        checked={checked()}
        onChange={handleToggle}
        loading={loading()}
        label="Auto-deploy changes"
        description="Trigger production build on git push."
      />
    </div>
  )
}
