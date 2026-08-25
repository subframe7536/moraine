import { ContextMenu } from '@src'

export function LongPress() {
  return (
    <ContextMenu
      items={[
        { label: 'Copy note', icon: 'i-lucide:copy' },
        { label: 'Delete note', color: 'destructive', icon: 'i-lucide:trash-2' },
      ]}
    >
      {(triggerProps) => (
        <div
          {...triggerProps}
          class="text-sm text-muted-foreground text-center border border-border rounded-lg border-dashed flex h-32 max-w-sm select-none items-center justify-center touch-none"
        >
          Touch and hold for about 700 ms, or right click
        </div>
      )}
    </ContextMenu>
  )
}
