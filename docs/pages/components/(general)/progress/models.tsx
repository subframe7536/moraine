import { Progress } from '@src'

export function Models() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <span class="text-xs text-muted-foreground">Uploading design.fig</span>
        <Progress value={65} aria-label="Uploading design.fig" />
      </div>
      <div class="space-y-1.5">
        <span class="text-xs text-muted-foreground">Scanning for malware</span>
        <Progress aria-label="Scanning for malware" />
      </div>
    </div>
  )
}
