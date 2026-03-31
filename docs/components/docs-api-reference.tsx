import { Show } from 'solid-js'

import { HeadingWithAnchor, PropsTable } from './props-table'
import type { PropsTableSection } from './props-table'

interface DocsApiReferenceProps {
  model?: DocsApiReferenceModel
}

export const DocsApiReference = (props: DocsApiReferenceProps) => {
  return (
    <>
      <HeadingWithAnchor id="api-ref" level={2}>
        API Reference
      </HeadingWithAnchor>
      <Show when={(props.model?.sections?.length ?? 0) > 0}>
        <PropsTable sections={props.model?.sections ?? []} />
      </Show>
    </>
  )
}

export interface DocsApiReferenceModel {
  sections: PropsTableSection[]
}
