import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { DropdownMenu } from '../../overlays/dropdown-menu/index.ts'

import { ButtonGroup } from './button-group.tsx'
import { Button } from './button.tsx'

export function ButtonGroupHydrationFixture(props: {
  separator?: boolean
  vertical?: boolean
  extra?: boolean
}) {
  return (
    <ButtonGroup
      separator={props.separator ?? true}
      orientation={props.vertical ? 'vertical' : 'horizontal'}
    >
      <Button>Export</Button>
      <DropdownMenu>
        <DropdownMenu.Trigger as={Button}>Options</DropdownMenu.Trigger>
        <DropdownMenu.Content items={[{ label: 'Download' }]} />
      </DropdownMenu>
      <Show when={props.extra}>
        <Button>Reset</Button>
      </Show>
    </ButtonGroup>
  )
}

export function renderButtonGroupFixture(): string {
  return renderToString(() => <ButtonGroupHydrationFixture />)
}

export function renderVerticalButtonGroupFixture(): string {
  return renderToString(() => <ButtonGroupHydrationFixture vertical />)
}
