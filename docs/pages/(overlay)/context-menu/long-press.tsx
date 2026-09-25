import { ContextMenu } from '@src'

export function LongPress() {
  return (
    <ContextMenu>
      <ContextMenu.Trigger
        as="div"
        class="text-muted-foreground text-center border border-border border-dashed flex h-32 max-w-sm select-none items-center justify-center touch-none text-sm rounded-lg"
      >
        Touch and hold for about 700 ms, or right click
      </ContextMenu.Trigger>
      <ContextMenu.Content
        items={[
          { label: 'Copy note', icon: 'i-lucide:copy' },
          { label: 'Delete note', variant: 'destructive', icon: 'i-lucide:trash-2' },
        ]}
      />
    </ContextMenu>
  )
}
