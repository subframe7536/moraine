import { Button } from '@src'
import { createSignal } from 'solid-js'

export function LoadingUsage() {
  const [loading, setLoading] = createSignal(false)

  const handleManual = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1200)
  }

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button loading={loading()} onClick={handleManual}>
        Controlled Loading
      </Button>
      <Button
        loadingAuto
        variant="outline"
        onClick={() => new Promise((resolve) => setTimeout(resolve, 1500))}
      >
        Auto Promise Loading
      </Button>
    </div>
  )
}
