import { Button } from '@src/elements/button/button'

export function LoadingPlacement() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button loading>Creating project</Button>
      <Button loading trailing="i-lucide:timer">
        Scheduling publish
      </Button>
      <Button loading leading="i-lucide:download" trailing="i-lucide:arrow-right">
        Preparing download
      </Button>
    </div>
  )
}
