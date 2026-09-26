import { renderToString } from 'solid-js/web'

import { Button } from '../../element/button'

import { Modal } from './modal'

export function renderModalFixture(): string {
  return renderToString(() => (
    <Modal>
      <Modal.Trigger as={Button} variant="outline">
        Open modal
      </Modal.Trigger>
      <Modal.Portal>
        <Modal.Content>
          <span data-testid="hydrated-content">Content</span>
        </Modal.Content>
      </Modal.Portal>
    </Modal>
  ))
}
