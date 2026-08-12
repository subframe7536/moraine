import { renderToString } from 'solid-js/web'
import * as v from 'valibot'

import { createForm, Form } from '../form/index.ts'
import { Input } from '../input/index.ts'

import { FormField } from './form-field.tsx'

export function renderFormFieldFixture(): string {
  function ServerField() {
    const form = createForm({
      schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Value is required')) }),
      initialInput: { value: '' },
    })

    return (
      <Form of={form} aria-label="Hydrated field form">
        <FormField
          name="value"
          required
          label="Value"
          hint="Required"
          description="Enter a value"
          help="Helpful text"
        >
          <Input />
        </FormField>
      </Form>
    )
  }

  return renderToString(() => <ServerField />)
}
