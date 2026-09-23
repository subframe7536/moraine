import { getInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button'
import { MoraineProvider } from '../../provider'
import { renderWithOwner } from '../../test-utils/owner-render'
import { defineTheme } from '../../theme'
import { Checkbox } from '../checkbox'
import { CheckboxGroup } from '../checkbox-group'
import { Input } from '../input'
import { RadioGroup } from '../radio-group'
import { Slider } from '../slider'
import { Switch } from '../switch'

import { createForm } from './'

const Schema = v.object({
  email: v.pipe(v.string(), v.email('Enter a valid email.')),
  enabled: v.boolean(),
})

describe('Form', () => {
  test('renders component defaults when provider is absent', () => {
    const { screen } = renderWithOwner(
      () => createForm({ schema: Schema }),
      (form) => <form.Form />,
    )
    const formElement = screen.container.querySelector('form')
    expect(formElement?.className).not.toBe('')
  })
  test('submits Formisch output through the high-level adapters', async () => {
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'initial@example.com', enabled: false },
        }),
      (form) => (
        <form.Form onSubmit={onSubmit}>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
          <form.Field name="enabled" label="Enabled">
            <Switch />
          </form.Field>
          <Button type="submit">Save</Button>
        </form.Form>
      ),
    )

    expect(screen.getByLabelText<HTMLInputElement>('Email').value).toBe('initial@example.com')
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } })
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: 'dev@example.com', enabled: true })
  })

  test('renders field errors and forwards native form props', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: '', enabled: false },
          validate: 'blur',
        }),
      (form) => (
        <form.Form aria-label="Settings" class="root-override" style={{ width: '200px' }}>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    const input = screen.getByLabelText('Email')
    fireEvent.focus(input)
    fireEvent.blur(input)

    await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const element = screen.getByRole('form')
    expect(element.className).toContain('root-override')
    expect(element.style.width).toBe('200px')
  })

  test('applies root slot overrides without leaking style props to the native form', () => {
    const { screen } = renderWithOwner(
      () => createForm({ schema: Schema }),
      (form) => (
        <form.Form
          aria-label="Styled form"
          classes={{ root: 'slot-class' }}
          styles={{ root: { height: '18px', color: 'blue' } }}
          class="native-class"
          style={{ width: '20px', color: 'red' }}
        />
      ),
    )
    const element = screen.getByRole('form')

    expect(element.className).toContain('slot-class')
    expect(element.className).toContain('native-class')
    expect(element.style.height).toBe('18px')
    expect(element.style.width).toBe('20px')
    expect(element.style.color).toBe('red')
    expect(element.hasAttribute('classes')).toBe(false)
    expect(element.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the bound form', () => {
    const { screen, value } = renderWithOwner(
      () => {
        const [design, setDesign] = createSignal(defineTheme({ form: { base: { root: 'p-2' } } }))
        return { form: createForm({ schema: Schema }), design, setDesign }
      },
      (props) => (
        <MoraineProvider theme={props.design()}>
          <props.form.Form />
        </MoraineProvider>
      ),
    )
    const element = screen.container.querySelector<HTMLFormElement>('form')!

    expect(element.className).toContain('p-2')

    value.setDesign(defineTheme({ form: { base: { root: 'p-4' } } }))

    expect(screen.container.querySelector('form')).toBe(element)
    expect(element.className).toContain('p-4')
    expect(element.className).not.toContain('p-2')
  })

  test('uses a control initialValue only when Formisch has no field input', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.optional(v.string()) }),
          initialInput: {},
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Input defaultValue="Fallback" />
          </form.Field>
        </form.Form>
      ),
    )

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>('Value').value).toBe('Fallback')
    })
  })

  test('blocks invalid submission and renders the first field error', async () => {
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: '', enabled: false },
        }),
      (form) => (
        <form.Form onSubmit={onSubmit}>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
          <Button type="submit">Save</Button>
        </form.Form>
      ),
    )
    const input = screen.getByLabelText('Email')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
    expect(screen.container.querySelector('form')?.hasAttribute('novalidate')).toBe(true)
  })

  test('re-reads live DOM order when invalid fields are reordered between submissions', async () => {
    const schema = v.object({
      first: v.pipe(v.string(), v.nonEmpty('First is required.')),
      second: v.pipe(v.string(), v.nonEmpty('Second is required.')),
    })
    const labels = { first: 'First', second: 'Second' } as const
    const [order, setOrder] = createSignal<('first' | 'second')[]>(['first', 'second'])
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { first: '', second: '' } }),
      (form) => (
        <form.Form>
          <For each={order()}>
            {(name) => (
              <form.Field name={name} label={labels[name]}>
                <Input />
              </form.Field>
            )}
          </For>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('First is required.')).not.toBeNull())
    expect(document.activeElement).toBe(screen.getByLabelText('First'))

    setOrder(['second', 'first'])
    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Second')))
    expect(document.activeElement).toBe(screen.getByLabelText('Second'))
  })

  test('rechecks whether invalid controls are enabled between submissions', async () => {
    const schema = v.object({
      first: v.pipe(v.string(), v.nonEmpty('First is required.')),
      second: v.pipe(v.string(), v.nonEmpty('Second is required.')),
    })
    const [firstDisabled, setFirstDisabled] = createSignal(true)
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { first: '', second: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="first" label="First">
            <Input disabled={firstDisabled()} />
          </form.Field>
          <form.Field name="second" label="Second">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Second')))

    setFirstDisabled(false)
    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('First')))
  })

  test('focuses the visible checkbox before a later invalid text input', async () => {
    const schema = v.object({
      accepted: v.pipe(
        v.boolean(),
        v.check((value: boolean) => value, 'Accept the terms.'),
      ),
      email: v.pipe(v.string(), v.nonEmpty('Email is required.')),
    })
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { accepted: false, email: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="accepted" label="Terms">
            <Checkbox label="Accept" />
          </form.Field>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    await waitFor(() => expect(document.activeElement).toBe(checkbox))
    expect(screen.container.querySelector<HTMLInputElement>('input[type="checkbox"]')).not.toBe(
      document.activeElement,
    )
  })

  test('focuses the visible switch before a later invalid text input', async () => {
    const schema = v.object({
      enabled: v.pipe(
        v.boolean(),
        v.check((value: boolean) => value, 'Enable the setting.'),
      ),
      email: v.pipe(v.string(), v.nonEmpty('Email is required.')),
    })
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { enabled: false, email: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="enabled" label="Setting">
            <Switch />
          </form.Field>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    const switchControl = screen.getByRole('switch', { name: 'Setting' })
    await waitFor(() => expect(document.activeElement).toBe(switchControl))
    expect(screen.container.querySelector<HTMLInputElement>('input[type="checkbox"]')).not.toBe(
      document.activeElement,
    )
  })

  test('focuses the first slider thumb before a later invalid text input', async () => {
    const schema = v.object({
      score: v.pipe(v.number(), v.minValue(1, 'Choose a score.')),
      email: v.pipe(v.string(), v.nonEmpty('Email is required.')),
    })
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { score: 0, email: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="score" label="Score">
            <Slider min={0} max={10} />
          </form.Field>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    const thumb = screen.container.querySelector<HTMLElement>('[data-slot="slider-thumb"]')!
    await waitFor(() => expect(document.activeElement).toBe(thumb))
  })

  test('focuses the first enabled radio in an invalid group', async () => {
    const schema = v.object({
      plan: v.pipe(v.string(), v.nonEmpty('Choose a plan.')),
      email: v.pipe(v.string(), v.nonEmpty('Email is required.')),
    })
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { plan: '', email: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="plan" label="Plan">
            <RadioGroup
              items={[
                { label: 'Unavailable', value: 'unavailable', disabled: true },
                { label: 'Standard', value: 'standard' },
              ]}
            />
          </form.Field>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    const enabledRadio = screen.getByRole('radio', { name: 'Standard' })
    await waitFor(() => expect(document.activeElement).toBe(enabledRadio))
  })

  test('focuses the first enabled checkbox in an invalid checkbox group', async () => {
    const schema = v.object({
      choices: v.pipe(v.array(v.string()), v.minLength(1, 'Choose an option.')),
      email: v.pipe(v.string(), v.nonEmpty('Email is required.')),
    })
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { choices: [], email: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="choices" label="Choices">
            <CheckboxGroup
              items={[
                { label: 'Unavailable', value: 'unavailable', disabled: true },
                { label: 'Standard', value: 'standard' },
              ]}
            />
          </form.Field>
          <form.Field name="email" label="Email">
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    const enabledCheckbox = screen
      .getAllByRole<HTMLButtonElement>('checkbox')
      .find((control) => !control.disabled)!
    await waitFor(() => expect(document.activeElement).toBe(enabledCheckbox))
  })

  test('uses DOM order for nested invalid paths and skips disabled controls', async () => {
    const schema = v.object({
      profile: v.object({ name: v.pipe(v.string(), v.nonEmpty('Name is required.')) }),
      title: v.pipe(v.string(), v.nonEmpty('Title is required.')),
    })
    const { screen } = renderWithOwner(
      () => createForm({ schema, initialInput: { profile: { name: '' }, title: '' } }),
      (form) => (
        <form.Form>
          <form.Field name="title" label="Title">
            <Input />
          </form.Field>
          <form.Field name={['profile', 'name']} label="Name">
            <Input disabled />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(screen.getByText('Title is required.')).not.toBeNull())
    expect(document.activeElement).toBe(screen.getByLabelText('Title'))
  })

  test('focuses the visual first invalid field inside an iframe document', async () => {
    const schema = v.object({
      first: v.pipe(v.string(), v.nonEmpty('First is required.')),
      second: v.pipe(v.string(), v.nonEmpty('Second is required.')),
    })
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const frameDocument = frame.contentDocument!

    try {
      const screen = render(
        () => {
          const form = createForm({ schema, initialInput: { first: '', second: '' } })
          return (
            <form.Form>
              <form.Field name="second" label="Second">
                <Input />
              </form.Field>
              <form.Field name="first" label="First">
                <Input />
              </form.Field>
            </form.Form>
          )
        },
        { container: frameDocument.body },
      )

      fireEvent.submit(frameDocument.querySelector('form')!)

      await waitFor(() =>
        expect(frameDocument.querySelector('[data-slot="field-error"]')).not.toBeNull(),
      )
      expect(frameDocument.activeElement).toBe(screen.getByLabelText('Second'))
    } finally {
      frame.remove()
    }
  })

  test('focuses an invalid control inside its shadow root', async () => {
    const lightControl = document.createElement('input')
    lightControl.id = 'shadow-email'
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    document.body.append(lightControl, host)
    const screen = render(
      () => {
        const form = createForm({ schema: Schema, initialInput: { email: '', enabled: false } })
        return (
          <form.Form>
            <form.Field name="email" label="Email">
              <Input id="shadow-email" />
            </form.Field>
            <Button type="submit">Save</Button>
          </form.Form>
        )
      },
      { container: shadow as unknown as HTMLElement },
    )

    const formElement = shadow.querySelector('form')!
    const input = shadow.querySelector<HTMLInputElement>('#shadow-email')!
    fireEvent.submit(formElement)

    await waitFor(() => expect(shadow.querySelector('[data-slot="field-error"]')).not.toBeNull())
    expect(shadow.activeElement).toBe(input)
    expect(document.activeElement).toBe(host)

    screen.unmount()
    lightControl.remove()
    host.remove()
  })

  test('preserves the native submitter and exposes exact async submitting state', async () => {
    let resolveSubmit: (() => void) | undefined
    const onSubmit = vi.fn(
      (_output: v.InferOutput<typeof Schema>, _event: SubmitEvent) =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'dev@example.com', enabled: false },
        }),
      (form) => (
        <form.Form onSubmit={onSubmit}>
          <Button type="submit" name="intent" value="save">
            Save
          </Button>
        </form.Form>
      ),
    )
    const formElement = screen.container.querySelector('form')!
    const submitter = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(submitter)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[1].submitter).toBe(submitter)
    expect(onSubmit.mock.calls[0]?.[1].defaultPrevented).toBe(true)
    expect(formElement.getAttribute('data-submitting')).toBe('')

    resolveSubmit?.()
    await waitFor(() => expect(formElement.getAttribute('data-submitting')).toBeNull())
  })

  test('captures rejected submit handlers as form errors and clears submitting state', async () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'dev@example.com', enabled: false },
        }),
      (form) => (
        <form.Form onSubmit={() => Promise.reject(new Error('Submit failed'))}>
          <Button type="submit">Save</Button>
        </form.Form>
      ),
    )
    const formElement = screen.container.querySelector('form')!

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(form.errors).toEqual(['Submit failed']))
    expect(formElement.getAttribute('data-submitting')).toBeNull()
  })

  test.each([false, true])(
    'resets native controls and Formisch state with enabled initially %s',
    async (enabled) => {
      const resetSnapshots: unknown[] = []
      const onChange = vi.fn()
      const { screen, value: form } = renderWithOwner(
        () =>
          createForm({
            schema: Schema,
            initialInput: { email: 'initial@example.com', enabled },
            validate: 'blur',
          }),
        (form) => (
          <form.Form
            onReset={() => {
              resetSnapshots.push({ dirty: form.isDirty, input: getInput(form) })
            }}
          >
            <form.Field name="email" label="Email">
              <Input />
            </form.Field>
            <form.Field name="enabled" label="Enabled">
              <Switch onChange={onChange} />
            </form.Field>
            <Button type="reset">Reset</Button>
          </form.Form>
        ),
      )
      const input = screen.getByLabelText('Email') as HTMLInputElement

      fireEvent.input(input, { target: { value: 'invalid' } })
      fireEvent.blur(input)
      await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
      fireEvent.click(screen.getByRole('switch'))
      expect(form.isDirty).toBe(true)
      expect(form.isTouched).toBe(true)

      fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

      await waitFor(() => {
        expect(input.value).toBe('initial@example.com')
        expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(String(enabled))
        expect(screen.queryByText('Enter a valid email.')).toBeNull()
      })
      expect(form.isDirty).toBe(false)
      expect(form.isTouched).toBe(false)
      expect(form.isEdited).toBe(false)
      expect(
        screen.container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked,
      ).toBe(enabled)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(getInput(form)).toEqual({ email: 'initial@example.com', enabled })
      expect(resetSnapshots).toEqual([
        {
          dirty: true,
          input: { email: 'invalid', enabled: !enabled },
        },
      ])
    },
  )

  test.each(['form', 'ancestor'])('keeps state when the %s cancels reset', async (cancelAt) => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Initial' },
        }),
      (form) => (
        <div onReset={cancelAt === 'ancestor' ? (event) => event.preventDefault() : undefined}>
          <form.Form onReset={cancelAt === 'form' ? (event) => event.preventDefault() : undefined}>
            <form.Field name="value" label="Value">
              <Input />
            </form.Field>
            <Button type="reset">Reset</Button>
          </form.Form>
        </div>
      ),
    )
    const input = screen.getByLabelText('Value') as HTMLInputElement

    fireEvent.input(input, { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(input.value).toBe('Changed')
    expect(getInput(form)).toEqual({ value: 'Changed' })
    expect(form.isDirty).toBe(true)
  })

  test('keeps sibling form providers and submissions isolated', async () => {
    const schema = v.object({ value: v.string() })
    const firstSubmit = vi.fn()
    const secondSubmit = vi.fn()
    const { screen, value: forms } = renderWithOwner(
      (): [
        ReturnType<typeof createForm<typeof schema>>,
        ReturnType<typeof createForm<typeof schema>>,
      ] => [
        createForm({ schema, initialInput: { value: 'First' } }),
        createForm({ schema, initialInput: { value: 'Second' } }),
      ],
      ([firstForm, secondForm]) => (
        <>
          <firstForm.Form onSubmit={firstSubmit} aria-label="First form">
            <firstForm.Field name="value" label="First value">
              <Input />
            </firstForm.Field>
            <Button type="submit">Submit first</Button>
          </firstForm.Form>
          <secondForm.Form onSubmit={secondSubmit} aria-label="Second form">
            <secondForm.Field name="value" label="Second value">
              <Input />
            </secondForm.Field>
            <Button type="submit">Submit second</Button>
          </secondForm.Form>
        </>
      ),
    )
    const [, secondForm] = forms

    fireEvent.input(screen.getByLabelText('First value'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit first' }))

    await waitFor(() => expect(firstSubmit).toHaveBeenCalledTimes(1))
    expect(firstSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Changed' })
    expect(secondSubmit).not.toHaveBeenCalled()
    expect(getInput(secondForm)).toEqual({ value: 'Second' })

    fireEvent.click(screen.getByRole('button', { name: 'Submit second' }))
    await waitFor(() => expect(secondSubmit).toHaveBeenCalledTimes(1))
    expect(secondSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Second' })
  })

  test('applies default field gap on form root', () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: '' },
        }),
      (form) => (
        <MoraineProvider>
          <form.Form>
            <form.Field name="value" label="Value">
              <Input />
            </form.Field>
          </form.Form>
        </MoraineProvider>
      ),
    )

    const formElement = screen.container.querySelector('form')
    expect(formElement?.className).toContain('space-y-4')
  })

  test('binds form.Field without requiring form.Form', () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Stored' },
        }),
      (form) => (
        <form.Field name="value" label="Value">
          <Input />
        </form.Field>
      ),
    )

    const input = screen.getByLabelText<HTMLInputElement>('Value')
    expect(input.value).toBe('Stored')
    fireEvent.input(input, { target: { value: 'Changed' } })
    expect(getInput(form)).toEqual({ value: 'Changed' })
  })

  test('redirects a bound field when its reactive path changes', () => {
    const [name, setName] = createSignal<'first' | 'second'>('first')
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ first: v.string(), second: v.string() }),
          initialInput: { first: 'First', second: 'Second' },
        }),
      (form) => (
        <form.Field name={name()} label="Value">
          <Input />
        </form.Field>
      ),
    )

    const input = screen.getByLabelText<HTMLInputElement>('Value')
    expect(input.value).toBe('First')
    setName('second')
    expect(input.value).toBe('Second')
    fireEvent.input(input, { target: { value: 'Changed second' } })
    expect(getInput(form)).toEqual({ first: 'First', second: 'Changed second' })
  })

  test('lets explicit errors override or suppress Formisch errors', async () => {
    const [error, setError] = createSignal<string | false | undefined>()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Schema error')) }),
          initialInput: { value: '' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value" error={error()}>
            <Input />
          </form.Field>
        </form.Form>
      ),
    )

    fireEvent.submit(screen.container.querySelector('form')!)
    await waitFor(() => expect(screen.getByText('Schema error')).not.toBeNull())
    setError('Manual error')
    expect(screen.getByText('Manual error')).not.toBeNull()
    setError(false)
    expect(screen.queryByText('Manual error')).toBeNull()
    expect(screen.queryByText('Schema error')).toBeNull()
  })
})
