import { renderToString } from 'solid-js/web'

import { Button } from '../../elements/button/index'

import { Modal } from './modal'

export function renderModalFixture(): string {
  return renderToString(() => (
    <Modal>
      <Modal.Trigger as={Button} variant="outline">
        Open modal
      </Modal.Trigger>
      <Modal.Content>
        <span data-testid="hydrated-content">Content</span>
      </Modal.Content>
    </Modal>
  ))
}
