import { Button, Toast } from '@src'
import { createSignal, onCleanup } from 'solid-js'

export function UploadProgress() {
  const upload = () => {
    Toast.custom(
      (props) => {
        const [progress, setProgress] = createSignal(8)
        const timer = setInterval(() => {
          setProgress((value) => {
            const next = Math.min(100, value + 12)
            if (next === 100) {
              clearInterval(timer)
              props.update({ title: 'report.pdf uploaded' })
            }
            return next
          })
        }, 180)
        onCleanup(() => clearInterval(timer))

        return (
          <div class="flex flex-col gap-2 w-full">
            <div class="flex gap-3 items-center justify-between">
              <span class="text-sm font-medium">{props.options.title}</span>
              <span class="text-xs text-muted-foreground">{progress()}%</span>
            </div>
            <div class="rounded-full bg-muted h-1.5 overflow-hidden">
              <div class="rounded-full bg-primary h-full" style={{ width: `${progress()}%` }} />
            </div>
          </div>
        )
      },
      { title: 'Uploading report.pdf', duration: Infinity },
    )
  }

  return (
    <Button variant="outline" leading="i-lucide:upload" onClick={upload}>
      Upload report
    </Button>
  )
}
