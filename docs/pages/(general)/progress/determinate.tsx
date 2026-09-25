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
    <div class="p-4 b-(1 border) max-w-xl space-y-3 rounded-xl">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-medium text-sm">Cloud Storage Quota</h4>
          <p class="text-muted-foreground text-xs">{value()} GB of 100 GB used</p>
        </div>
        <span class="text-primary font-mono font-semibold text-xs">{value()}%</span>
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
