import { Icon } from '@src'

export function Sources() {
  return (
    <div class="text-sm flex flex-wrap gap-4 items-center">
      <span class="flex gap-1.5 items-center">
        <Icon name="icon-success" />
        Ready
      </span>
      <span class="flex gap-1.5 items-center">
        <Icon name="i-lucide:git-branch" />
        main
      </span>
      <span class="text-muted-foreground flex gap-1.5 items-center">
        <Icon name="i-lucide:clock" />
        Queued
      </span>
    </div>
  )
}
