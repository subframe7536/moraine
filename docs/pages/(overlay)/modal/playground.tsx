import { Button, Modal } from '@src'

export interface ModalPlaygroundProps {
  ariaLabel?: string
  dismissible?: boolean
  overlay?: boolean
}

export function ModalPlayground(props: ModalPlaygroundProps) {
  return (
    <Modal dismissible={props.dismissible ?? true}>
      <Modal.Trigger as={Button} variant="outline">
        Open Modal
      </Modal.Trigger>
      <Modal.Content
        overlay={props.overlay ?? true}
        ariaLabel={props.ariaLabel ?? 'Project details'}
        contentRender={(context) => (
          <div class="p-5 gap-4 grid">
            <div>
              <h4 class="text-sm text-foreground font-semibold">Custom Primitive Surface</h4>
              <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                Low-level modal primitives provide focus trapping, scroll locking, and dismissal
                with arbitrary layouts.
              </p>
            </div>
            <div class="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={context.close}>
                Got it
              </Button>
            </div>
          </div>
        )}
      />
    </Modal>
  )
}
