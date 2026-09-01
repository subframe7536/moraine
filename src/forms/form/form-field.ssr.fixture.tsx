import { renderToString } from 'solid-js/web'
import * as v from 'valibot'

import { Input } from '../input/index.ts'

import { createForm } from './form.tsx'

export function renderFormFieldFixture(): string {
  function ServerField() {
    const form = createForm({
      schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Value is required')) }),
      initialInput: { value: '' },
    })

    return (
      <form.Form aria-label="Hydrated field form">
        <form.Field
          name="value"
          required
          label="Value"
          hint="Required"
          description="Enter a value"
          help="Helpful text"
        >
          <Input />
        </form.Field>
      </form.Form>
    )
  }

  return renderToString(() => <ServerField />)
}
