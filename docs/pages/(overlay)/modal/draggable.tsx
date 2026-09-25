import { Button, Icon, Modal } from '@src'
import { createSignal } from 'solid-js'

export function Draggable() {
  const [position, setPosition] = createSignal({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = createSignal(false)

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest('button, a, input, [role="button"]')) {
      return
    }

    event.preventDefault()
    const currentTarget = event.currentTarget as HTMLElement
    currentTarget.setPointerCapture(event.pointerId)

    setIsDragging(true)
    const startX = event.clientX
    const startY = event.clientY
    const startPos = position()

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setPosition({
        x: Math.round(startPos.x + (moveEvent.clientX - startX)),
        y: Math.round(startPos.y + (moveEvent.clientY - startY)),
      })
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      currentTarget.removeEventListener('pointermove', handlePointerMove)
      currentTarget.removeEventListener('pointerup', handlePointerUp)
      currentTarget.removeEventListener('pointercancel', handlePointerUp)
      try {
        currentTarget.releasePointerCapture(upEvent.pointerId)
      } catch {}
      setIsDragging(false)
    }

    currentTarget.addEventListener('pointermove', handlePointerMove)
    currentTarget.addEventListener('pointerup', handlePointerUp)
    currentTarget.addEventListener('pointercancel', handlePointerUp)
  }

  const resetPosition = () => setPosition({ x: 0, y: 0 })

  return (
    <Modal
      onOpenChange={(open) => {
        if (!open) {
          resetPosition()
        }
      }}
    >
      <Modal.Trigger as={Button} variant="outline" leading="i-lucide:move">
        Open Draggable Modal
      </Modal.Trigger>
      <Modal.Overlay />
      <Modal.Content
        ariaLabel="Draggable Modal"
        style={{
          translate: `calc(-50% + ${position().x}px) calc(-50% + ${position().y}px)`,
          transition: isDragging() ? 'none' : 'translate 150ms ease-out',
        }}
      >
        {(context) => (
          <div class="b-(1 border) bg-card flex flex-col max-w-md w-full shadow-xl overflow-hidden rounded-xl">
            <div
              class="px-4 py-3 border-b border-border bg-muted/50 flex cursor-grab select-none items-center justify-between active:cursor-grabbing"
              onPointerDown={handlePointerDown}
            >
              <div class="flex gap-2 items-center">
                <Icon name="i-lucide:grip-vertical" class="text-muted-foreground size-4" />
                <h3 class="text-foreground font-semibold text-sm">Draggable Window</h3>
              </div>
              <Button
                variant="ghost"
                size="xs"
                class="p-0 size-6 rounded-md"
                onClick={context.close}
                aria-label="Close"
              >
                <Icon name="i-lucide:x" class="size-3.5" />
              </Button>
            </div>

            <div class="p-4 space-y-3">
              <p class="text-muted-foreground leading-relaxed text-xs">
                Click and drag the header title bar to reposition this modal dialog across the
                viewport.
              </p>
              <div class="text-muted-foreground font-mono p-2.5 bg-muted flex items-center justify-between text-xs rounded-lg">
                <span>Offset:</span>
                <span>
                  X: {position().x}px, Y: {position().y}px
                </span>
              </div>
            </div>

            <div class="p-3 border-t border-border bg-card flex items-center justify-between">
              <Button
                size="xs"
                variant="ghost"
                leading="i-lucide:rotate-ccw"
                onClick={resetPosition}
                disabled={position().x === 0 && position().y === 0}
              >
                Reset Position
              </Button>
              <Button size="xs" variant="default" onClick={context.close}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal.Content>
    </Modal>
  )
}
