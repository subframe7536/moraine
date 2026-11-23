import { renderToString } from '@solidjs/web'

import { Button } from '../button'

import { BaseDialog } from './base-dialog'
export function renderModalFixture(): string {
  return renderToString(() => (
    <BaseDialog>
      <BaseDialog.Trigger as={Button} variant="outline">
        Open modal
      </BaseDialog.Trigger>
      <BaseDialog.Portal>
        <BaseDialog.Content>
          <span data-testid="hydrated-content">Content</span>
        </BaseDialog.Content>
      </BaseDialog.Portal>
    </BaseDialog>
  ))
}
