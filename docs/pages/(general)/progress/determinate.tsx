import { Button, Progress } from '@src'
import { createSignal } from 'solid-js'

export function Determinate() {
  const [value, setValue] = createSignal(65)

  const uploadFile = () => {
    setValue((current) => Math.min(current + 10, 100))
  }

  const clearStorage = () => {
    setValue(15)
  }

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-xl space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-medium">Cloud Storage Quota</h4>
          <p class="text-xs text-muted-foreground">{value()} GB of 100 GB used</p>
        </div>
        <span class="text-xs text-primary font-mono font-semibold">{value()}%</span>
      </div>

      <Progress value={value()} status statusRender={(props) => <>{props.percent}% Full</>} />

      <div class="pt-2 flex gap-2">
        <Button size="sm" variant="outline" leading="i-lucide:upload" onClick={uploadFile}>
          Upload Asset (+10GB)
        </Button>
        <Button size="sm" variant="ghost" onClick={clearStorage}>
          Clear Cache
        </Button>
      </div>
    </div>
  )
}
