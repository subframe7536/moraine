import { Button, createForm, InputNumber } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [submittedQuantity, setSubmittedQuantity] = createSignal<number | null>(null)
  const form = createForm({
    schema: v.object({
      quantity: v.pipe(
        v.number('Please enter a number'),
        v.minValue(1, 'Quantity must be at least 1 item.'),
        v.maxValue(10, 'Maximum order quantity is 10 items.'),
      ),
    }),
    initialInput: { quantity: 1 },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedQuantity(output.quantity)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="quantity"
          label="Order Quantity"
          description="Specify between 1 and 10 units."
          required
        >
          <InputNumber minValue={1} maxValue={10} />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">Selected units: {submittedQuantity() ?? 1}</p>
        </div>
      </div>
    </form.Form>
  )
}
