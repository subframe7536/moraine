import { Button, Modal } from '@src'
import { Show } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function ModalPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'switch',
          prop: 'closeOnOverlayClick',
          label: 'Close on overlay click',
          defaultValue: true,
        },
        { kind: 'switch', prop: 'closeOnEscape', label: 'Close on Escape', defaultValue: true },
        { kind: 'switch', prop: 'overlay', label: 'Overlay', defaultValue: true },
      ]}
    >
      {(props) => (
        <Modal closeOnOverlayClick={props.closeOnOverlayClick} closeOnEscape={props.closeOnEscape}>
          <Modal.Trigger as={Button} variant="outline">
            Open Modal
          </Modal.Trigger>
          <Modal.Portal>
            <Show when={props.overlay}>
              <Modal.Overlay />
            </Show>
            <Modal.Content aria-label="Project details">
              {() => (
                <div class="p-5 gap-4 grid">
                  <div>
                    <h4 class="text-sm text-foreground font-semibold">Custom Modal Surface</h4>
                    <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                      Modal provides focus management, scroll locking, dismissal, and overridable
                      default surface styles.
                    </p>
                  </div>
                  <div class="flex gap-2 justify-end">
                    <Modal.Close as={Button} size="sm" variant="outline">
                      Got it
                    </Modal.Close>
                  </div>
                </div>
              )}
            </Modal.Content>
          </Modal.Portal>
        </Modal>
      )}
    </DocsPlayground>
  )
}
