import { renderToString } from 'solid-js/web'

import { Button } from '../../elements/button/index.ts'

import { Modal } from './modal.tsx'

export function renderModalFixture(): string {
  return renderToString(() => (
    <Modal>
      <Modal.Trigger as={Button} variant="outline">
        Open modal
      </Modal.Trigger>
      <Modal.Content contentRender={<span data-testid="hydrated-content">Content</span>} />
    </Modal>
  ))
}
