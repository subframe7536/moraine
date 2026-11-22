import { Progress } from '@src'

export function Models() {
  return (
    <div class="max-w-md w-full space-y-4">
      <Progress label="Uploading design.fig" value={65} />
      <Progress label="Scanning for malware" />
    </div>
  )
}
