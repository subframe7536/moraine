import { getInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { For, createComponent, createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render'
import { CheckboxGroup } from '../checkbox-group/index'
import { Checkbox } from '../checkbox/index'
import { FileUpload } from '../file-upload/index'
import { InputNumber } from '../input-number/index'
import { Input } from '../input/index'
import { RadioGroup } from '../radio-group/index'
import { MultiSelect } from '../select/multi-select'
import { Select } from '../select/select'
import { Slider } from '../slider/index'
import { Switch } from '../switch/index'
import { Textarea } from '../textarea/index'

import { createForm } from './form'
import type { FormFieldProps, FormFieldT } from './form-field'
import { FormField } from './form-field'

const TypedFormSchema = v.object({
  email: v.string(),
  profile: v.object({ name: v.string() }),
})

const typedTopLevelField: FormFieldProps<typeof TypedFormSchema> = { name: 'email' }
const typedNestedField: FormFieldProps<typeof TypedFormSchema> = {
  name: ['profile', 'name'],
}
// @ts-expect-error unknown top-level field
const invalidTypedField: FormFieldProps<typeof TypedFormSchema> = { name: 'unknown' }

void typedTopLevelField
void typedNestedField
void invalidTypedField

interface ConsumerCase {
  bound: boolean
  createControl: (required?: boolean) => JSX.Element
  forSelector?: string
  labelledSelector: string
  name: string
  requiredAriaSelector?: string
  requiredSelector: string
}

const CONSUMER_CASES: ConsumerCase[] = [
  {
    name: 'Input',
    bound: true,
    createControl: (required) => <Input required={required} />,
    requiredSelector: 'input[data-slot="input"]',
    requiredAriaSelector: 'input[data-slot="input"]',
    labelledSelector: 'input[data-slot="input"]',
  },
  {
    name: 'Textarea',
    bound: true,
    createControl: (required) => <Textarea required={required} />,
    requiredSelector: 'textarea',
    requiredAriaSelector: 'textarea',
    labelledSelector: 'textarea',
  },
  {
    name: 'Checkbox',
    bound: true,
    createControl: (required) => <Checkbox required={required} />,
    forSelector: '[role="checkbox"]',
    requiredSelector: 'input[type="checkbox"]',
    requiredAriaSelector: '[role="checkbox"]',
    labelledSelector: '[role="checkbox"]',
  },
  {
    name: 'CheckboxGroup',
    bound: false,
    createControl: (required) => <CheckboxGroup required={required} items={['A', 'B']} />,
    requiredSelector: 'input[type="checkbox"]',
    requiredAriaSelector: '[data-slot="fieldset"]',
    labelledSelector: '[data-slot="fieldset"]',
  },
  {
    name: 'RadioGroup',
    bound: false,
    createControl: (required) => <RadioGroup required={required} items={['A', 'B']} />,
    requiredSelector: 'input[type="radio"]',
    requiredAriaSelector: '[role="radiogroup"]',
    labelledSelector: '[role="radiogroup"]',
  },
  {
    name: 'Switch',
    bound: true,
    createControl: (required) => <Switch required={required} />,
    forSelector: '[role="switch"]',
    requiredSelector: 'input[type="checkbox"]',
    requiredAriaSelector: '[role="switch"]',
    labelledSelector: '[role="switch"]',
  },
  {
    name: 'Slider',
    bound: true,
    createControl: (required) => <Slider required={required} />,
    requiredSelector: 'input[type="range"]',
    requiredAriaSelector: '[role="slider"]',
    labelledSelector: '[role="group"]',
  },
  {
    name: 'InputNumber',
    bound: true,
    createControl: (required) => <InputNumber required={required} />,
    requiredSelector: 'input[data-slot="input"]',
    requiredAriaSelector: '[role="spinbutton"]',
    labelledSelector: '[role="spinbutton"]',
  },
  {
    name: 'FileUpload',
    bound: true,
    createControl: (required) => <FileUpload required={required} />,
    requiredSelector: 'input[type="file"]',
    labelledSelector: '[data-slot="control"]',
  },
  {
    name: 'Select',
    bound: false,
    createControl: (required) => (
      <Select required={required} options={[{ label: 'A', value: 'a' }]} />
    ),
    requiredSelector: 'select',
    requiredAriaSelector: '[role="combobox"]',
    labelledSelector: '[role="combobox"]',
  },
  {
    name: 'MultiSelect',
    bound: false,
    createControl: (required) => (
      <MultiSelect required={required} options={[{ label: 'A', value: 'a' }]} />
    ),
    requiredSelector: 'select',
    requiredAriaSelector: '[role="combobox"]',
    labelledSelector: '[role="combobox"]',
  },
]

describe('FormField', () => {
  test('renders accessible standalone field content', () => {
    const screen = render(() => (
      <FormField label="Email" hint="Required" description="Use a valid email" help="Never shared">
        <Input />
      </FormField>
    ))

    const input = screen.getByLabelText('Email')
    expect(screen.getByText('Required')).not.toBeNull()
    expect(screen.getByText('Use a valid email')).not.toBeNull()
    expect(screen.getByText('Never shared')).not.toBeNull()
    expect(input.getAttribute('aria-describedby')).toContain('-description')
  })

  test('uses Formisch errors and supports nested numeric paths', async () => {
    const schema = v.object({
      users: v.array(v.object({ email: v.pipe(v.string(), v.email('Invalid email')) })),
    })
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema,
          initialInput: { users: [{ email: '' }] },
          validate: 'blur',
        }),
      (form) => (
        <form.Form>
          <form.Field name={['users', 0, 'email']} label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    const input = screen.getByLabelText('Email')
    fireEvent.focus(input)
    fireEvent.blur(input)
    await waitFor(() => expect(screen.getByText('Invalid email')).not.toBeNull())
  })

  test('manual error overrides Formisch and false suppresses it', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Schema error')) }),
          initialInput: { value: '' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Manual" error="Manual error">
            <Input />
          </form.Field>
          <form.Field name="value" label="Suppressed" error={false}>
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    expect(screen.getByText('Manual error')).not.toBeNull()
    fireEvent.submit(screen.container.querySelector('form')!)
    await waitFor(() => expect(screen.queryByText('Schema error')).toBeNull())
  })

  test('evaluates a getter-backed JSX error once before normalization', () => {
    let reads = 0
    const screen = render(() =>
      createComponent(FormField, {
        label: 'Field',
        children: <Input />,
        get error() {
          reads += 1
          return <span>Cached error</span>
        },
      }),
    )

    expect(reads).toBe(1)
    expect(screen.getByText('Cached error')).not.toBeNull()
  })

  test('applies root class and style priority', () => {
    const screen = render(() => (
      <FormField class="root-override" style={{ width: '200px' }} label="Field">
        <Input />
      </FormField>
    ))
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    expect(root.className).toContain('root-override')
    expect(root.style.width).toBe('200px')
  })

  test('uses a fixed four-column horizontal layout with an aligned control column', () => {
    const screen = render(() => (
      <FormField
        orientation="horizontal"
        label="Display name"
        description="Shown in activity feeds."
        help="Use a short name."
      >
        <Input />
      </FormField>
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const wrapper = root.querySelector('[data-slot="wrapper"]')
    const container = root.querySelector('[data-slot="container"]')

    expect(root.className).toContain('grid')
    expect(root.className).toContain('grid-cols-4')
    expect(root.className).toContain('items-baseline')
    expect(root.className).toContain('gap-x-2')
    expect(root.className).not.toMatch(/(?:^|:)sm:/)
    expect(wrapper?.className).toContain('col-span-1')
    expect(wrapper?.className).toContain('text-end')
    expect(container?.getAttribute('data-slot')).toBe('container')
    expect(container?.className).toContain('col-span-3')
    expect(container?.className).toContain('min-w-0')
  })

  test('reserves the label column for unlabelled horizontal fields', () => {
    const screen = render(() => (
      <FormField orientation="horizontal">
        <Input placeholder="Aligned control" />
      </FormField>
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const wrapper = root.querySelector('[data-slot="wrapper"]')
    const container = root.querySelector('[data-slot="container"]')

    expect(wrapper?.textContent).toBe('')
    expect(container?.className).toContain('col-span-3')
    expect(container?.className).toContain('min-w-0')
    expect(root.children[1]).toBe(container)
  })

  test('places the required marker before horizontal labels', () => {
    const screen = render(() => (
      <FormField orientation="horizontal" label="Email" required>
        <Input />
      </FormField>
    ))

    const label = screen.getByText('Email')

    expect(label.className).toContain('before:')
    expect(label.className).toContain('after:content-none')
  })

  test.each([
    ['sm', 'text-xs', 'h-7', 'py-1', 'text-xs'],
    ['md', 'text-sm', 'h-8', 'py-1.5', 'text-sm'],
    ['lg', 'text-base', 'h-9', 'py-2', 'text-base'],
  ] as const)(
    'propagates %s size to field content and messages',
    (size, fieldText, height, padding, subtextSize) => {
      const screen = render(() => (
        <FormField size={size} label="Name" description="Description" help="Help">
          <Input />
        </FormField>
      ))

      const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
      const inputRoot = screen.container.querySelector('[data-slot="root"] [data-slot="root"]')
      const input = screen.container.querySelector('[data-slot="input"]')
      const description = screen.container.querySelector('[data-slot="description"]')
      const help = screen.container.querySelector('[data-slot="help"]')

      expect(root.className).toContain(fieldText)
      expect(inputRoot?.className).toContain(height)
      expect(input?.className).toContain(padding)
      expect(description?.className).toContain(subtextSize)
      expect(help?.className).toContain(subtextSize)
    },
  )

  test.each([
    ['sm', 'h-4 w-7', 'size-3', 'text-xs'],
    ['md', 'h-4.5 w-8', 'size-3.5', 'text-sm'],
    ['lg', 'h-5.5 w-10', 'size-4.5', 'text-base'],
  ] as const)(
    'propagates %s size to Switch child control',
    (size, trackClass, thumbClass, wrapperClass) => {
      const screen = render(() => (
        <FormField size={size} label="Notifications">
          <Switch label="Email alerts" description="Receive updates" />
        </FormField>
      ))

      const track = screen.container.querySelector('[data-slot="track"]')
      const thumb = screen.container.querySelector('[data-slot="thumb"]')
      const switchWrapper = screen.container.querySelector(
        '[data-slot="track"] ~ [data-slot="wrapper"]',
      )

      expect(track?.className).toContain(trackClass)
      expect(thumb?.className).toContain(thumbClass)
      expect(switchWrapper?.className).toContain(wrapperClass)
    },
  )

  test('allows Switch to override FormField size with explicit size prop', () => {
    const screen = render(() => (
      <FormField size="sm" label="Notifications">
        <Switch size="lg" label="Email alerts" />
      </FormField>
    ))

    const track = screen.container.querySelector('[data-slot="track"]')
    const thumb = screen.container.querySelector('[data-slot="thumb"]')

    expect(track?.className).toContain('h-5.5 w-10')
    expect(thumb?.className).toContain('size-4.5')
  })

  test.each([
    ['sm', 'size-3.5', 'text-xs'],
    ['md', 'size-4', 'text-sm'],
    ['lg', 'size-4.5', 'text-base'],
  ] as const)('propagates %s size to Checkbox child control', (size, boxClass, textClass) => {
    const screen = render(() => (
      <FormField size={size} label="Agree">
        <Checkbox label="Terms" description="I agree" />
      </FormField>
    ))

    const control = screen.container.querySelector('[data-slot="control"]')
    const desc = screen.container.querySelector('[data-slot="description"]')

    expect(control?.className).toContain(boxClass)
    expect(desc?.className).toContain(textClass)
  })

  test('inherits required state while allowing an explicit control override', () => {
    const screen = render(() => (
      <>
        <FormField label="Required field" required>
          <Input />
        </FormField>
        <FormField label="Optional override" required>
          <Input required={false} />
        </FormField>
      </>
    ))
    const requiredInput = screen.getByLabelText('Required field') as HTMLInputElement
    const optionalInput = screen.getByLabelText('Optional override') as HTMLInputElement

    expect(requiredInput.required).toBe(true)
    expect(requiredInput.getAttribute('aria-required')).toBe('true')
    expect(optionalInput.required).toBe(false)
    expect(optionalInput.getAttribute('aria-required')).toBeNull()
  })

  test('keeps multiple control ids unique and targets the last bound control', () => {
    const screen = render(() => (
      <FormField label="Values">
        <Input />
        <Input />
      </FormField>
    ))
    const inputs = screen.getAllByRole('textbox')
    const label = screen.getByText('Values') as HTMLLabelElement

    expect(inputs[0]?.id).not.toBe(inputs[1]?.id)
    expect(label.htmlFor).toBe(inputs[1]?.id)
  })

  test('describes only mounted messages and replaces help with a reactive error', async () => {
    const [error, setError] = createSignal<string | undefined>()
    const screen = render(() => (
      <FormField label="Field" hint="Hint" description="Description" help="Help" error={error()}>
        <Input />
      </FormField>
    ))
    const input = screen.getByLabelText('Field')
    const hint = screen.getByText('Hint')
    const description = screen.getByText('Description')
    const help = screen.getByText('Help')

    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      hint.id,
      description.id,
      help.id,
    ])

    setError('Error')

    await waitFor(() => expect(screen.getByText('Error')).not.toBeNull())
    expect(screen.queryByText('Help')).toBeNull()
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      hint.id,
      description.id,
      screen.getByText('Error').id,
    ])
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  test('does not reference unmounted hint or boolean error messages', () => {
    const screen = render(() => (
      <FormField hint="Hidden hint" help="Visible help" error>
        <Input />
      </FormField>
    ))
    const input = screen.getByRole('textbox')
    const help = screen.getByText('Visible help')

    expect(screen.queryByText('Hidden hint')).toBeNull()
    expect(input.getAttribute('aria-describedby')).toBe(help.id)
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  test('labels bind-false group controls from the shared field label', () => {
    const screen = render(() => (
      <FormField label="Channels">
        <CheckboxGroup items={['Email', 'SMS']} />
      </FormField>
    ))
    const label = screen.getByText('Channels') as HTMLLabelElement
    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')!

    expect(label.htmlFor).toBe('')
    expect(fieldset.getAttribute('aria-labelledby')).toBe(label.id)
  })

  test('notifies Formisch change validation for custom controls without a synthetic event', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({
            enabled: v.pipe(
              v.boolean(),
              v.check((value) => value, 'Must stay enabled'),
            ),
          }),
          initialInput: { enabled: true },
          validate: 'change',
        }),
      (form) => (
        <form.Form>
          <form.Field name="enabled" label="Enabled">
            <Switch />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.click(screen.getByRole('switch'))

    await waitFor(() => expect(screen.getByText('Must stay enabled')).not.toBeNull())
    expect(screen.getByRole('switch').getAttribute('aria-invalid')).toBe('true')
  })

  test.each(CONSUMER_CASES)(
    '$name inherits required and shared labelling while preserving an explicit override',
    ({
      bound,
      createControl,
      forSelector,
      labelledSelector,
      name,
      requiredAriaSelector,
      requiredSelector,
    }) => {
      const labelText = `${name} field`
      const inherited = render(() => (
        <FormField label={labelText} required>
          {createControl()}
        </FormField>
      ))
      const inheritedLabel = inherited.getByText(labelText) as HTMLLabelElement
      const inheritedRequiredTargets = Array.from(
        inherited.container.querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(requiredSelector),
      )
      const inheritedLabelledTarget = inherited.container.querySelector(labelledSelector)

      expect(inheritedRequiredTargets.length).toBeGreaterThan(0)
      expect(inheritedRequiredTargets.some((element) => element.required)).toBe(true)
      expect(inheritedLabelledTarget?.getAttribute('aria-labelledby')).toBe(inheritedLabel.id)
      if (requiredAriaSelector) {
        expect(
          inherited.container.querySelector(requiredAriaSelector)?.getAttribute('aria-required'),
        ).toBe('true')
      }
      if (bound) {
        const boundTarget = forSelector
          ? inherited.container.querySelector(forSelector)
          : inheritedRequiredTargets[0]
        expect(inheritedLabel.htmlFor).toBe(boundTarget?.id)
      } else {
        expect(inheritedLabel.getAttribute('for')).toBeNull()
      }

      inherited.unmount()

      const overridden = render(() => (
        <FormField label={labelText} required>
          {createControl(false)}
        </FormField>
      ))
      const overriddenRequiredTargets = Array.from(
        overridden.container.querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(requiredSelector),
      )

      expect(overriddenRequiredTargets.every((element) => !element.required)).toBe(true)
      if (requiredAriaSelector) {
        expect(
          overridden.container.querySelector(requiredAriaSelector)?.getAttribute('aria-required'),
        ).toBeNull()
      }
    },
  )

  test('keeps registration aligned through id changes, reorder, and unmount', async () => {
    const [singleId, setSingleId] = createSignal('single-a')
    const single = render(() => (
      <FormField label="Single">
        <Input id={singleId()} />
      </FormField>
    ))
    const singleLabel = single.getByText('Single') as HTMLLabelElement

    expect(singleLabel.htmlFor).toBe('single-a')
    setSingleId('single-b')
    expect(singleLabel.htmlFor).toBe('single-b')
    single.unmount()

    const [ids, setIds] = createSignal(['first', 'second'])
    const multiple = render(() => (
      <FormField label="Multiple">
        <For each={ids()}>{(id) => <Input id={id} />}</For>
      </FormField>
    ))
    const getMultipleLabel = () => multiple.getByText('Multiple') as HTMLLabelElement

    expect(getMultipleLabel().htmlFor).toBe('second')
    setIds(['second', 'first'])
    expect(getMultipleLabel().htmlFor).toBe('first')
    setIds(['first'])
    await waitFor(() => expect(getMultipleLabel().htmlFor).toBe('first'))
  })

  test('isolates control registration between nested FormField providers', () => {
    const screen = render(() => (
      <FormField label="Outer">
        <Input id="outer-control" />
        <FormField label="Inner">
          <Input id="inner-control" />
        </FormField>
      </FormField>
    ))

    expect(screen.getByText<HTMLLabelElement>('Outer').htmlFor).toBe('outer-control')
    expect(screen.getByText<HTMLLabelElement>('Inner').htmlFor).toBe('inner-control')
  })

  test('tracks an initially present reactive path', async () => {
    const [name, setName] = createSignal<'first' | 'second'>('first')
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ first: v.string(), second: v.string() }),
          initialInput: { first: 'First', second: 'Second' },
        }),
      (form) => (
        <form.Form>
          <form.Field name={name()} label="Value">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )
    const input = screen.getByLabelText('Value') as HTMLInputElement

    expect(input.value).toBe('First')
    setName('second')
    expect(input.value).toBe('Second')

    fireEvent.input(input, { target: { value: 'Changed' } })
    expect(getInput(form)).toEqual({ first: 'First', second: 'Changed' })
  })

  test('treats a missing initial path as an intentionally unbound field', async () => {
    const [name, setName] = createSignal<string>()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Stored' },
        }),
      (form) => (
        <form.Form>
          <form.Field name={name() as any} label="Late path">
            <Input defaultValue="Standalone" />
          </form.Field>
        </form.Form>
      ),
    )
    const input = screen.getByLabelText('Late path') as HTMLInputElement

    setName('value')
    fireEvent.input(input, { target: { value: 'Changed' } })

    expect(input.name).toBe('value')
    expect(getInput(form)).toEqual({ value: 'Stored' })
  })

  test('single-evaluates every JSX prop and keeps render children reactive', async () => {
    const reads = { children: 0, description: 0, error: 0, help: 0, hint: 0, label: 0 }
    const [error, setError] = createSignal<string | undefined>()
    let renderCalls = 0

    function FieldContent(context: FormFieldT.RenderContext) {
      renderCalls += 1
      return <span data-testid="render-content">{context.error ?? 'Ready'}</span>
    }

    const screen = render(() =>
      createComponent(FormField, {
        get label() {
          reads.label += 1
          return 'Field'
        },
        get description() {
          reads.description += 1
          return 'Description'
        },
        get hint() {
          reads.hint += 1
          return 'Hint'
        },
        get help() {
          reads.help += 1
          return 'Help'
        },
        get error() {
          reads.error += 1
          return error()
        },
        get children() {
          reads.children += 1
          return FieldContent
        },
      }),
    )

    expect(reads).toEqual({ children: 1, description: 1, error: 1, help: 1, hint: 1, label: 1 })
    expect(renderCalls).toBe(1)
    expect(screen.getByTestId('render-content').textContent).toBe('Ready')

    setError('Changed')
    await waitFor(() => expect(screen.getByTestId('render-content').textContent).toBe('Changed'))
    expect(renderCalls).toBe(1)
    expect(reads).toEqual({ children: 1, description: 1, error: 2, help: 1, hint: 1, label: 1 })
  })

  test('renders numeric zero JSX without stale message references', () => {
    const helpScreen = render(() => (
      <FormField label={0} hint={0} description={0} help={0}>
        <Input />
      </FormField>
    ))
    const helpInput = helpScreen.container.querySelector('input')!
    const helpIds = ['hint', 'description', 'help'].map(
      (slot) => helpScreen.container.querySelector(`[data-slot="${slot}"]`)?.id,
    )

    expect(helpIds.every(Boolean)).toBe(true)
    expect(helpInput.getAttribute('aria-describedby')?.split(' ')).toEqual(helpIds)
    helpScreen.unmount()

    const errorScreen = render(() => (
      <FormField error={0}>
        <Input />
      </FormField>
    ))
    const errorInput = errorScreen.container.querySelector('input')!
    const errorMessage = errorScreen.container.querySelector('[data-slot="error"]')!

    expect(errorMessage.textContent).toBe('0')
    expect(errorInput.getAttribute('aria-describedby')).toBe(errorMessage.id)
    expect(errorInput.getAttribute('aria-invalid')).toBe('true')
    expect(
      errorScreen.container
        .querySelector('[data-slot="input"]')
        ?.parentElement?.getAttribute('data-invalid'),
    ).toBe('')
  })

  test('applies unified spacing and typography classes across slots', () => {
    const screen = render(() => (
      <FormField
        label="Email"
        hint="Optional"
        description="We never share email"
        help="Enter valid email"
        error="Invalid"
      >
        <Input />
      </FormField>
    ))

    const wrapper = screen.container.querySelector('[data-slot="wrapper"]')
    const labelWrapper = screen.container.querySelector('[data-slot="labelWrapper"]')
    const hint = screen.container.querySelector('[data-slot="hint"]')
    const description = screen.container.querySelector('[data-slot="description"]')
    const container = screen.container.querySelector('[data-slot="container"]')
    const error = screen.container.querySelector('[data-slot="error"]')

    expect(wrapper?.className).toContain('flex')
    expect(wrapper?.className).toContain('flex-col')
    expect(wrapper?.className).toContain('gap-1')

    expect(labelWrapper?.className).toContain('gap-1.5')
    expect(hint?.className).toContain('text-sm')
    expect(hint?.className).toContain('text-muted-foreground')
    expect(hint?.className).not.toContain('ms-1')

    expect(description?.className).toContain('text-sm')
    expect(description?.className).toContain('text-muted-foreground')
    expect(description?.className).toContain('leading-normal')

    expect(container?.className).toContain('mt-1.5')
    expect(container?.className).toContain('gap-1.5')

    expect(error?.className).toContain('text-sm')
    expect(error?.className).toContain('text-destructive')
    expect(error?.className).toContain('font-medium')
  })

  test('omits top margin on container when label and description are absent in vertical layout', () => {
    const screen = render(() => (
      <FormField>
        <Input />
      </FormField>
    ))

    const container = screen.container.querySelector('[data-slot="container"]')
    expect(container?.className).toContain('flex')
    expect(container?.className).toContain('flex-col')
    expect(container?.className).toContain('gap-1.5')
    expect(container?.className).not.toContain('mt-0')
  })
})
