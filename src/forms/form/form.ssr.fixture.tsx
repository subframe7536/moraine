import { renderToString } from 'solid-js/web'
import * as v from 'valibot'

import { Button } from '../../elements/button'
import { Input } from '../input'
import { Switch } from '../switch'

import { createForm } from './'

export function renderFormFixture(): string {
  function ServerForm() {
    const form = createForm({
      schema: v.object({ value: v.string(), enabled: v.boolean() }),
      initialInput: { value: 'Server value', enabled: true },
    })

    return (
      <form.Form aria-label="Hydrated form">
        <form.Field name="value" label="Value">
          <Input />
        </form.Field>
        <form.Field name="enabled" label="Enabled">
          <Switch />
        </form.Field>
        <Button type="reset">Reset</Button>
        <Button type="submit">Submit</Button>
      </form.Form>
    )
  }

  return renderToString(() => <ServerForm />)
}
