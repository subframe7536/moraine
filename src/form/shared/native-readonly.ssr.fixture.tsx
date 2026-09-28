import { renderToString } from 'solid-js/web'

import { CheckboxGroup } from '../checkbox-group/checkbox-group'
import { Checkbox } from '../checkbox/checkbox'
import { FileUpload } from '../file-upload/file-upload'
import { InputNumber } from '../input-number/input-number'
import { Input } from '../input/input'
import { RadioGroup } from '../radio-group/radio-group'
import { Slider } from '../slider/slider'
import { Switch } from '../switch/switch'
import { Textarea } from '../textarea/textarea'

export function NativeReadonlyFixture(props: { readOnly: boolean }) {
  return (
    <section>
      <Input readOnly={props.readOnly} defaultValue="Text" />
      <InputNumber readOnly={props.readOnly} defaultValue={12} />
      <Textarea readOnly={props.readOnly} defaultValue="Notes" />
      <Checkbox readOnly={props.readOnly} label="Checkbox" />
      <CheckboxGroup readOnly={props.readOnly} items={[{ value: 'check', label: 'Group item' }]} />
      <RadioGroup readOnly={props.readOnly} items={[{ value: 'radio', label: 'Radio item' }]} />
      <Switch readOnly={props.readOnly} label="Switch" />
      <Slider readOnly={props.readOnly} defaultValue={25} />
      <FileUpload readOnly={props.readOnly} label="Upload" />
    </section>
  )
}

export function renderEditableFixture(): string {
  return renderToString(() => <NativeReadonlyFixture readOnly={false} />)
}

export function renderReadonlyFixture(): string {
  return renderToString(() => <NativeReadonlyFixture readOnly />)
}
