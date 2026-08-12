import { getInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { For, createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'
import { CheckboxGroup } from '../checkbox-group/index.ts'
import { Checkbox } from '../checkbox/index.ts'
import { FileUpload } from '../file-upload/index.ts'
import { createForm, Form } from '../form/index.ts'
import { InputNumber } from '../input-number/index.ts'
import { Input } from '../input/index.ts'
import { RadioGroup } from '../radio-group/index.ts'
import { MultiSelect } from '../select/multi-select.tsx'
import { Select } from '../select/select.tsx'
import { Slider } from '../slider/index.ts'
import { Switch } from '../switch/index.ts'
import { Textarea } from '../textarea/index.ts'

import { FormField } from './form-field.tsx'
import type { FormFieldProps, FormFieldT } from './form-field.tsx'

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
        <Form of={form}>
          <FormField name={['users', 0, 'email']} label="Email">
            <Input />
          </FormField>
        </Form>
      ),
    )

    const input = screen.getByLabelText('Email')
    await fireEvent.focus(input)
    await fireEvent.blur(input)
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
        <Form of={form}>
          <FormField name="value" label="Manual" error="Manual error">
            <Input />
          </FormField>
          <FormField name="value" label="Suppressed" error={false}>
            <Input />
          </FormField>
        </Form>
      ),
    )

    expect(screen.getByText('Manual error')).not.toBeNull()
    await fireEvent.submit(screen.container.querySelector('form')!)
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
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
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
        <Form of={form}>
          <FormField name="enabled" label="Enabled">
            <Switch />
          </FormField>
        </Form>
      ),
    )

    await fireEvent.click(screen.getByRole('switch'))

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

    expect((screen.getByText('Outer') as HTMLLabelElement).htmlFor).toBe('outer-control')
    expect((screen.getByText('Inner') as HTMLLabelElement).htmlFor).toBe('inner-control')
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
        <Form of={form}>
          <FormField name={name()} label="Value">
            <Input />
          </FormField>
        </Form>
      ),
    )
    const input = screen.getByLabelText('Value') as HTMLInputElement

    expect(input.value).toBe('First')
    setName('second')
    expect(input.value).toBe('Second')

    await fireEvent.input(input, { target: { value: 'Changed' } })
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
        <Form of={form}>
          <FormField name={name()} label="Late path">
            <Input defaultValue="Standalone" />
          </FormField>
        </Form>
      ),
    )
    const input = screen.getByLabelText('Late path') as HTMLInputElement

    setName('value')
    await fireEvent.input(input, { target: { value: 'Changed' } })

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

  test('hydrates registered controls and replaces help with the focused validation error', async () => {
    const markup = renderSsrFixture(
      '/src/forms/form-field/form-field.ssr.fixture.tsx',
      'renderFormFieldFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const serverInput = container.querySelector('input')!
    const serverLabel = container.querySelector('[data-slot="label"]') as HTMLLabelElement
    const serverMessageIds = ['hint', 'description', 'help'].map(
      (slot) => container.querySelector(`[data-slot="${slot}"]`)?.id,
    )

    expect(serverLabel.htmlFor).toBe(serverInput.id)
    expect(serverInput.getAttribute('aria-describedby')?.split(' ')).toEqual(serverMessageIds)

    const reads = { children: 0, description: 0, error: 0, help: 0, hint: 0, label: 0 }
    const restoreHydrationState = installHydrationState()

    function ClientField() {
      const form = createForm({
        schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Value is required')) }),
        initialInput: { value: '' },
      })

      return (
        <Form of={form} aria-label="Hydrated field form">
          {createComponent(FormField, {
            name: 'value',
            required: true,
            get label() {
              reads.label += 1
              return 'Value'
            },
            get hint() {
              reads.hint += 1
              return 'Required'
            },
            get description() {
              reads.description += 1
              return 'Enter a value'
            },
            get help() {
              reads.help += 1
              return 'Helpful text'
            },
            get error() {
              reads.error += 1
              return undefined
            },
            get children() {
              reads.children += 1
              return <Input />
            },
          })}
        </Form>
      )
    }

    const dispose = hydrate(() => <ClientField />, container)
    const input = container.querySelector('input')!
    const label = container.querySelector('[data-slot="label"]') as HTMLLabelElement

    expect(container.querySelector('[data-slot="root"]')).toBe(serverRoot)
    expect(input).toBe(serverInput)
    await waitFor(() => expect(label.htmlFor).toBe(input.id))
    expect(reads).toEqual({ children: 1, description: 1, error: 1, help: 1, hint: 1, label: 1 })

    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(container.querySelector('[data-slot="error"]')).not.toBeNull())

    const errorMessage = container.querySelector('[data-slot="error"]')!
    expect(document.activeElement).toBe(input)
    expect(container.querySelector('[data-slot="help"]')).toBeNull()
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      container.querySelector('[data-slot="hint"]')?.id,
      container.querySelector('[data-slot="description"]')?.id,
      errorMessage.id,
    ])
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(reads).toEqual({ children: 1, description: 1, error: 1, help: 1, hint: 1, label: 1 })

    dispose()
    container.remove()
    restoreHydrationState()
  }, 20_000)
})
