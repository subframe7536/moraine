import { renderToString } from 'solid-js/web'

import { Slider } from './slider.tsx'

export function renderSliderFixture(): string {
  return renderToString(() => (
    <div>
      <Slider id="ssr-scalar-slider" defaultValue={25} />
      <Slider id="ssr-range-slider" defaultValue={[75, 25]} orientation="vertical" />
    </div>
  ))
}
