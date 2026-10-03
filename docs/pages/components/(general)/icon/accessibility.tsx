import { Icon } from '@src'

export function Accessibility() {
  return (
    <div class="flex gap-5 items-center">
      <p class="text-sm flex gap-2 items-center">
        <Icon name="i-lucide:circle-check" aria-hidden="true" class="text-success" />
        Changes saved
      </p>
      <Icon name="i-lucide:triangle-alert" aria-label="Warning" class="text-warning size-5" />
    </div>
  )
}
