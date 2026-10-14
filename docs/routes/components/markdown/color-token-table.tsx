import { For, Match, Switch } from 'solid-js'

import {
  DOCS_INLINE_CODE_CLASS,
  DOCS_TABLE_CLASS,
  DOCS_TABLE_TBODY_TR_CLASS,
  DOCS_TABLE_TD_CLASS,
  DOCS_TABLE_TH_CLASS,
  DOCS_TABLE_THEAD_TR_CLASS,
  DOCS_TABLE_WRAPPER_CLASS,
} from '../../../build/markdown/shared.recipe'
import { listDocsColorTokens } from '../../../shared/color-tokens'
import type { DocsColorTokenDefault } from '../../../shared/color-tokens'

const COLOR_TOKENS = listDocsColorTokens()

function DefaultValue(props: { value: DocsColorTokenDefault }) {
  const literal = () => (props.value.type === 'value' ? props.value.value : undefined)
  const percent = () => (props.value.type === 'auto' ? props.value.percent : undefined)
  const fallback = () => (props.value.type === 'fallback' ? props.value.variable : undefined)

  return (
    <Switch fallback="none">
      <Match when={literal()}>
        {(value) => <code class={DOCS_INLINE_CODE_CLASS}>{value()}</code>}
      </Match>
      <Match when={percent()}>{(value) => `auto (color-mix, ${value()}%)`}</Match>
      <Match when={fallback()}>
        {(value) => (
          <>
            falls back to <code class={DOCS_INLINE_CODE_CLASS}>{value()}</code>
          </>
        )}
      </Match>
    </Switch>
  )
}

/** Live preview of every Moraine color token; swatches follow the active docs theme. */
export function ColorTokenTable() {
  return (
    <div class={DOCS_TABLE_WRAPPER_CLASS}>
      <table class={DOCS_TABLE_CLASS}>
        <thead>
          <tr class={DOCS_TABLE_THEAD_TR_CLASS}>
            <th class={DOCS_TABLE_TH_CLASS}>Preview</th>
            <th class={DOCS_TABLE_TH_CLASS}>Token</th>
            <th class={DOCS_TABLE_TH_CLASS}>CSS variable</th>
            <th class={DOCS_TABLE_TH_CLASS}>Light default</th>
            <th class={DOCS_TABLE_TH_CLASS}>Dark default</th>
          </tr>
        </thead>
        <tbody>
          <For each={COLOR_TOKENS}>
            {(token) => (
              <tr class={DOCS_TABLE_TBODY_TR_CLASS} data-color-token={token.name}>
                <td class={DOCS_TABLE_TD_CLASS}>
                  <span
                    class="border border-border rounded-md size-6 block shadow-xs"
                    style={{ 'background-color': token.value }}
                    role="img"
                    aria-label={`${token.name} swatch`}
                  />
                </td>
                <td class={DOCS_TABLE_TD_CLASS}>
                  <code class={DOCS_INLINE_CODE_CLASS}>{token.name}</code>
                </td>
                <td class={DOCS_TABLE_TD_CLASS}>
                  <code class={DOCS_INLINE_CODE_CLASS}>{token.cssVariable}</code>
                </td>
                <td class={`${DOCS_TABLE_TD_CLASS} whitespace-nowrap`}>
                  <DefaultValue value={token.defaults.light} />
                </td>
                <td class={`${DOCS_TABLE_TD_CLASS} whitespace-nowrap`}>
                  <DefaultValue value={token.defaults.dark} />
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
