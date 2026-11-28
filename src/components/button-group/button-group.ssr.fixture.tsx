import { renderToString } from '@solidjs/web'

import { Button } from '../button'

import { ButtonGroup } from './button-group'

export function renderButtonGroupFixture(): string {
  return renderToString(() => (
    <ButtonGroup variant="outline" size="sm" aria-label="Document actions">
      <Button>Copy</Button>
      <ButtonGroup.Separator />
      <Button>Archive</Button>
    </ButtonGroup>
  ))
}
