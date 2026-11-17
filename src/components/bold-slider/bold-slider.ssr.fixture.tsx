import { renderToString } from 'solid-js/web'

import { BoldSlider } from './bold-slider'

export function renderBoldSliderFixture(): string {
  return renderToString(() => (
    <div>
      <BoldSlider id="ssr-bold-slider" label="Bounce" defaultValue={0.5} max={1} step={0.1} />
    </div>
  ))
}
