import type { JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import {
  createApiReferenceModel,
  getApiReferenceTocEntries,
} from '../../../../build/api-doc/presentation'
import type {
  ApiReferencePresentationModel,
  PresentationPartSection,
} from '../../../../build/api-doc/presentation'
import type { ComponentApi } from '../../../../build/api-doc/types'
import { DOCS_INLINE_CODE_CLASS } from '../markdown.class.ts'

import { AttributesSection } from './api-attributes-section'
import { PropRows } from './api-prop-rows'
import { HeadingWithAnchor } from './heading-with-anchor'

export { HeadingWithAnchor } from './heading-with-anchor'
export { PropDetails, PropRowItem, PropRows, type PropDoc } from './api-prop-rows'
export { AttributeRow, AttributesSection, EmptyAttributes } from './api-attributes-section'

export interface DocsApiReferenceModel {
  reference: ApiReferencePresentationModel | null
}

export function createDocsApiReferenceModel(
  apiDoc: ComponentApi | undefined,
): DocsApiReferenceModel {
  return { reference: createApiReferenceModel(apiDoc) }
}

export function getDocsApiReferenceTocEntries(apiDoc: ComponentApi | undefined) {
  return getApiReferenceTocEntries(apiDoc)
}

function PartMetadata(props: { part: PresentationPartSection; description?: string }): JSX.Element {
  const description = () => props.part.description ?? props.description

  return (
    <Show when={description() || props.part.defaultElement}>
      <p>
        <Show when={description()}>{`${description()} `}</Show>

        <Show when={props.part.defaultElement}>
          Renders a <code class={DOCS_INLINE_CODE_CLASS}>&lt;{props.part.defaultElement}&gt;</code>{' '}
          element by default.
        </Show>
      </p>
    </Show>
  )
}

export function DocsApiReference(props: { apiDoc?: ComponentApi }): JSX.Element {
  const model = createMemo(() => createApiReferenceModel(props.apiDoc))

  return (
    <Show when={model()}>
      {(reference) => (
        <>
          <Show when={reference().attributes}>
            {(attributes) => <AttributesSection attributes={attributes()} />}
          </Show>
          <HeadingWithAnchor id="api-reference" level={2}>
            Props
          </HeadingWithAnchor>

          <Show
            when={reference().parts.length > 1}
            fallback={
              <Show when={reference().parts[0]}>
                {(part) => (
                  <>
                    <PartMetadata part={part()} description={reference().description} />
                    <Show when={part().props.length > 0}>
                      <PropRows props={part().props} />
                    </Show>
                  </>
                )}
              </Show>
            }
          >
            <For each={reference().parts}>
              {(part) => (
                <section>
                  <HeadingWithAnchor id={part.id} level={3}>
                    {part.shortHeading}
                  </HeadingWithAnchor>
                  <PartMetadata part={part} />
                  <Show when={part.props.length > 0}>
                    <PropRows props={part.props} />
                  </Show>
                </section>
              )}
            </For>
          </Show>
        </>
      )}
    </Show>
  )
}
