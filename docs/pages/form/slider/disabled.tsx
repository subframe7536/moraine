import { Slider } from '@src'

export function Disabled() {
  return <Slider disabled min={0} max={100} step={10} defaultValue={35} />
}
