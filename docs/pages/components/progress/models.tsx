import { Progress } from '@src'

export function Models() {
  return (
    <div class="max-w-md w-full space-y-4">
      <Progress textLabel="Uploading design.fig" value={65} aria-label="Uploading design.fig" />
      <Progress textLabel="Scanning for malware" aria-label="Scanning for malware" />
    </div>
  )
}
