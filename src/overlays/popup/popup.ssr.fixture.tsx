import { renderToString } from 'solid-js/web'

import { Popup } from './popup.tsx'

export function renderPopupFixture(): string {
  return renderToString(() => (
    <Popup title="Hydrated popup" content="Hydrated body">
      {(props) => (
        <button {...props} type="button">
          Open popup
        </button>
      )}
    </Popup>
  ))
}
