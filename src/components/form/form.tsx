import type { FormConfig, FormStore, RequiredPath, Schema } from '@formisch/solid'
import {
  createForm as createFormischForm,
  Form as FormischForm,
  reset as resetForm,
} from '@formisch/solid'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'
import { Field as FieldInternal } from '../field/field'
import { scheduleFormReset } from '../shared/form/form-reset-scheduler'

import { useFormischFieldBinding } from './form-field-binding'
import { defaultFormMessages } from './form.messages'
import { formDataAttributes, formRecipe } from './form.recipe'
import type { FormProps, FormT } from './form.types'

interface InternalFormProps<TSchema extends Schema> extends FormProps<TSchema> {
  of: FormT.Store<TSchema>
}

function hasErrorMessage(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string',
  )
}

/**
 * Renders Formisch's own `Form`, which owns submission: it prevents the native submit, validates,
 * focuses the first invalid field, tracks `isSubmitting`, and records handler errors on the store.
 */
function FormRoot<TSchema extends Schema>(props: InternalFormProps<TSchema>): JSX.Element {
  const [local, formProps] = splitProps(props, [
    'class',
    'style',
    'classes',
    'styles',
    'of',
    'onSubmit',
    'onReset',
    'translations',
  ])
  const {
    slots: { root: rootSlot },
  } = useRecipe(formRecipe, local, {
    data: { root: formDataAttributes.root({ submitting: () => local.of.isSubmitting }) },
  })
  const messages = useMessages('form', defaultFormMessages, () => local.translations)

  // Moraine also accepts root collection schemas, which Formisch's component typings exclude.
  const formStore = () => local.of as FormStore

  const onReset: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    const form = local.of
    callHandler(event, local.onReset)
    scheduleFormReset(event, () => resetForm(form), 'form')
  }

  const onSubmit = async (output: unknown, event: SubmitEvent): Promise<void> => {
    try {
      await local.onSubmit?.(output, event)
    } catch (error) {
      // Formisch stores `error.message`; give message-less errors a localized fallback.
      throw hasErrorMessage(error) ? error : new Error(messages().unknownError)
    }
  }

  return (
    <FormischForm
      data-slot="form"
      {...rootSlot}
      {...formProps}
      of={formStore()}
      onSubmit={onSubmit}
      onReset={onReset}
    >
      {formProps.children}
    </FormischForm>
  )
}

/**
 * Creates a reactive Formisch store from a schema config (`schema`, `initialInput`, `validate`,
 * `revalidate`) and attaches the bound `form.Form` and `form.Field` components. `form.Form` owns
 * submission and reset; `form.Field` is a `Field` whose `name` is a schema path and whose value,
 * error, and focus come from the store. Use a standalone `Field` when no schema binding is needed.
 *
 * @example
 * ```tsx
 * import { Button, createForm, Input } from 'moraine'
 * import * as v from 'valibot'
 *
 * const form = createForm({
 *   schema: v.object({ email: v.pipe(v.string(), v.email()) }),
 *   initialInput: { email: '' },
 *   validate: 'blur',
 * })
 *
 * <form.Form onSubmit={(output) => console.log(output.email)}>
 *   <form.Field name="email" label="Email">
 *     <Input type="email" />
 *   </form.Field>
 *   <Button type="submit">Subscribe</Button>
 * </form.Form>
 * ```
 */
export function createForm<TSchema extends Schema>(
  config: FormT.Config<TSchema>,
): FormT.Instance<TSchema> {
  const store = createFormischForm(config as FormConfig) as FormT.Store<TSchema>

  const BoundForm = (props: FormT.Props<TSchema>): JSX.Element => <FormRoot {...props} of={store} />

  const BoundField = <T extends ValidComponent = 'div'>(
    props: FormT.FieldProps<TSchema, T>,
  ): JSX.Element => {
    const binding = useFormischFieldBinding(
      store as FormStore,
      () => (typeof props.name === 'string' ? [props.name] : props.name) as RequiredPath,
    )
    return <FieldInternal {...props} binding={binding} />
  }

  return Object.assign(store, {
    Form: BoundForm,
    Field: BoundField,
  })
}
