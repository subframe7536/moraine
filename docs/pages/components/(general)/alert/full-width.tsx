import { Alert } from '@src'

export function FullWidthExample() {
  return (
    <div class="flex flex-col gap-3 w-full">
      <Alert
        fullWidth
        type="warning"
        title="Scheduled maintenance notice"
        description="The platform will undergo scheduled maintenance tonight between 02:00 and 04:00 UTC."
        close
      />
    </div>
  )
}
