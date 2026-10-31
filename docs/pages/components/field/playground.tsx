import { Field, Input } from '@src'
import { createSignal } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function FieldPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'orientation',
          label: 'Orientation',
          defaultValue: 'vertical',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
          ],
        },
        { kind: 'switch', prop: 'invalid', label: 'Invalid', defaultValue: false },
      ]}
    >
      {(props) => {
        const [invalid, setInvalid] = createSignal(false)

        return (
          <Field
            label="Email"
            required
            hint="Required"
            description="Use your work email address."
            help="We use this address for account notifications."
            error={props.invalid || invalid() ? 'Enter a valid email address.' : undefined}
            orientation={props.orientation}
          >
            <Input
              type="email"
              placeholder="you@example.com"
              onBlur={(event) => setInvalid(!event.currentTarget.validity.valid)}
            />
          </Field>
        )
      }}
    </DocsPlayground>
  )
}
