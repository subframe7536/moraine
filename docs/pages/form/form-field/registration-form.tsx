import {
  Button,
  Checkbox,
  createForm,
  DropdownMenu,
  Form,
  FormField,
  Icon,
  Input,
  Select,
  Textarea,
} from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

export function RegistrationForm() {
  const RegistrationSchema = v.object({
    email: v.pipe(v.string(), v.email('Enter a valid email.')),
    password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters.')),
    confirmPassword: v.pipe(v.string(), v.minLength(8, 'Confirm your password.')),
    nickname: v.pipe(v.string(), v.nonEmpty('Enter a nickname.')),
    residence: v.picklist(['zhejiang', 'beijing', 'shanghai'], 'Choose your residence.'),
    phone: v.pipe(v.string(), v.nonEmpty('Enter a phone number.')),
    website: v.string(),
    introduction: v.pipe(
      v.string(),
      v.maxLength(100, 'Keep your introduction under 100 characters.'),
    ),
    gender: v.picklist(['male', 'female', 'other'], 'Choose a gender.'),
    agreement: v.pipe(v.boolean(), v.value(true, 'Accept the agreement to continue.')),
  })
  const [submitted, setSubmitted] = createSignal(false)
  const [phoneAreaCode, setPhoneAreaCode] = createSignal('+86')
  const [passwordVisible, setPasswordVisible] = createSignal(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = createSignal(false)
  const form = createForm({
    schema: RegistrationSchema,
    initialInput: {
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
      residence: 'zhejiang',
      phone: '',
      website: '',
      introduction: '',
      gender: 'male',
      agreement: false,
    },
  })

  return (
    <Form of={form} onSubmit={() => setSubmitted(true)} class="mx-auto max-w-4xl w-full space-y-5">
      <FormField<typeof RegistrationSchema>
        name="email"
        label="E-mail"
        required
        orientation="horizontal"
      >
        <Input type="email" placeholder="you@example.com" />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="password"
        label="Password"
        required
        orientation="horizontal"
      >
        <Input
          type={passwordVisible() ? 'text' : 'password'}
          placeholder="At least 8 characters"
          trailing={
            <button
              type="button"
              class="text-muted-foreground p-1 rounded-sm hover:text-foreground"
              aria-label={passwordVisible() ? 'Hide password' : 'Show password'}
              aria-pressed={passwordVisible()}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              <Icon name={passwordVisible() ? 'i-lucide-eye-off' : 'i-lucide-eye'} />
            </button>
          }
        />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="confirmPassword"
        label="Confirm Password"
        required
        orientation="horizontal"
      >
        <Input
          type={confirmPasswordVisible() ? 'text' : 'password'}
          trailing={
            <button
              type="button"
              class="text-muted-foreground p-1 rounded-sm hover:text-foreground"
              aria-label={confirmPasswordVisible() ? 'Hide password' : 'Show password'}
              aria-pressed={confirmPasswordVisible()}
              onClick={() => setConfirmPasswordVisible((visible) => !visible)}
            >
              <Icon name={confirmPasswordVisible() ? 'i-lucide-eye-off' : 'i-lucide-eye'} />
            </button>
          }
        />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="nickname"
        label="Nickname"
        hint="?"
        required
        orientation="horizontal"
      >
        <Input placeholder="Choose a display name" />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="residence"
        label="Habitual Residence"
        required
        orientation="horizontal"
      >
        <Select
          options={[
            { label: 'Zhejiang / Hangzhou / West Lake', value: 'zhejiang' },
            { label: 'Beijing / Chaoyang', value: 'beijing' },
            { label: 'Shanghai / Pudong', value: 'shanghai' },
          ]}
        />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="phone"
        label="Phone Number"
        required
        orientation="horizontal"
      >
        <Input
          aria-label="Phone number"
          leading={
            <DropdownMenu
              items={[
                { label: '+86 China', onSelect: () => setPhoneAreaCode('+86') },
                { label: '+1 United States', onSelect: () => setPhoneAreaCode('+1') },
                { label: '+44 United Kingdom', onSelect: () => setPhoneAreaCode('+44') },
                { label: '+81 Japan', onSelect: () => setPhoneAreaCode('+81') },
              ]}
            >
              {(triggerProps) => (
                <Button
                  {...triggerProps}
                  type="button"
                  variant="ghost"
                  class="border-0 border-e-(1 input) rounded-none w-18"
                  trailing="i-lucide-chevron-down"
                  aria-label="Select phone area code"
                >
                  {phoneAreaCode()}
                </Button>
              )}
            </DropdownMenu>
          }
          classes={{ leading: 'ps-0' }}
        />
      </FormField>

      <FormField<typeof RegistrationSchema> name="website" label="Website" orientation="horizontal">
        <Input placeholder="website" />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="introduction"
        label="Intro"
        required
        help="Keep your introduction under 100 characters."
        orientation="horizontal"
      >
        <Textarea rows={3} maxLength={100} />
      </FormField>

      <FormField<typeof RegistrationSchema>
        name="gender"
        label="Gender"
        required
        orientation="horizontal"
      >
        <Select
          options={[
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' },
          ]}
        />
      </FormField>

      <FormField
        label="Captcha"
        orientation="horizontal"
        help="We must make sure that you are a human."
      >
        <div class="flex gap-2 w-full">
          <Input aria-label="Captcha code" class="flex-1" />
          <Button type="button" variant="outline">
            Get captcha
          </Button>
        </div>
      </FormField>

      <FormField<typeof RegistrationSchema> name="agreement" required orientation="horizontal">
        <Checkbox
          label={
            <>
              I have read the{' '}
              <a class="text-primary underline underline-offset-2" href="#agreement">
                agreement
              </a>
            </>
          }
        />
      </FormField>

      <FormField orientation="horizontal">
        <Button type="submit">Register</Button>
      </FormField>

      <Show when={submitted()}>
        <p class="text-success text-sm">Your registration details are ready to submit.</p>
      </Show>
    </Form>
  )
}
