import { Button } from '@src'

function waitForSave(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 700))
}

export function LoadingAuto() {
  return (
    <Button loadingAuto onClick={waitForSave} leading="i-lucide:save">
      Save changes
    </Button>
  )
}
