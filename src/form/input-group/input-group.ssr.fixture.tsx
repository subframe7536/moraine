import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Icon } from '../../element/icon/index'
import { Input } from '../input/input'
import { Textarea } from '../textarea/textarea'

import { InputGroup } from './input-group'

export function renderInputGroupFixture(): string {
  return renderToString(() => (
    <InputGroup size="lg" classes={{ leading: 'leading-class' }}>
      <Show when={true}>
        <InputGroup.Leading compact>
          <Icon name="icon-search" />
          <span>Prefix</span>
        </InputGroup.Leading>
      </Show>
      <Input id="group-input" value="Server value" />
      <InputGroup.Trailing>
        <button type="button">Action</button>
      </InputGroup.Trailing>
    </InputGroup>
  ))
}

export function renderTextareaGroupFixture(): string {
  return renderToString(() => (
    <InputGroup dir="rtl" orientation="vertical">
      <InputGroup.Leading>{0}</InputGroup.Leading>
      <Textarea
        id="group-textarea"
        defaultValue="Server value"
        autoResize
        rows={2}
        maxRows={4}
        readOnly={false}
        required
      />
      <InputGroup.Trailing>
        <span>Footer</span>
      </InputGroup.Trailing>
    </InputGroup>
  ))
}
