import { Button } from '@src/elements/button/button'

export function LoadingPlacement() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Button loading>Loading (default leading)</Button>
      <Button loading trailing="i-lucide:timer">
        Loading replaces trailing
      </Button>
      <Button loading leading="i-lucide:download" trailing="i-lucide:arrow-right">
        Loading replaces leading
      </Button>
    </div>
  )
}
