import { renderToString } from 'solid-js/web'
import * as v from 'valibot'

import { Button } from '../../elements/button/index'
import { Input } from '../input/index'

import { createForm } from './index'

export function renderFormFixture(): string {
  function ServerForm() {
    const form = createForm({
      schema: v.object({ value: v.string() }),
      initialInput: { value: 'Server value' },
    })

    return (
      <form.Form aria-label="Hydrated form">
        <form.Field name="value" label="Value">
          <Input />
        </form.Field>
        <Button type="submit">Submit</Button>
      </form.Form>
    )
  }

  return renderToString(() => <ServerForm />)
}
