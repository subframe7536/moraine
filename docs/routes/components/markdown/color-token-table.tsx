import { For } from 'solid-js'

import {
  DOCS_INLINE_CODE_CLASS,
  DOCS_TABLE_CLASS,
  DOCS_TABLE_TBODY_TR_CLASS,
  DOCS_TABLE_TD_CLASS,
  DOCS_TABLE_TH_CLASS,
  DOCS_TABLE_THEAD_TR_CLASS,
  DOCS_TABLE_WRAPPER_CLASS,
} from '../../../build/markdown/shared.class'
import { listDocsColorTokens } from '../../../shared/color-tokens'

const COLOR_TOKENS = listDocsColorTokens()

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
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
