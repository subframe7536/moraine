import { renderToString } from 'solid-js/web'
import * as v from 'valibot'

import { Button } from '../../elements/button/index.ts'
import { FormField } from '../form-field/index.ts'
import { Input } from '../input/index.ts'

import { createForm, Form } from './index.ts'

export function renderFormFixture(): string {
  function ServerForm() {
    const form = createForm({
      schema: v.object({ value: v.string() }),
      initialInput: { value: 'Server value' },
    })

    return (
      <Form of={form} aria-label="Hydrated form">
        <FormField name="value" label="Value">
          <Input />
        </FormField>
        <Button type="submit">Submit</Button>
      </Form>
    )
  }

  return renderToString(() => <ServerForm />)
}
