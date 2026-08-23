import { Button, Modal } from '@src'

export interface ModalPlaygroundProps {
  ariaLabel?: string
  dismissible?: boolean
  overlay?: boolean
}

export function ModalPlayground(props: ModalPlaygroundProps) {
  return (
    <Modal dismissible={props.dismissible ?? true}>
      <Modal.Trigger as={Button}>Open modal</Modal.Trigger>
      <Modal.Content
        overlay={props.overlay ?? true}
        ariaLabel={props.ariaLabel ?? 'Project details'}
        contentRender={(context) => (
          <div class="grid gap-4 p-4">
            <p class="text-sm text-foreground">A custom surface composed with Modal primitives.</p>
            <Button class="justify-self-end" onClick={context.close}>
              Close
            </Button>
          </div>
        )}
      />
    </Modal>
  )
}
