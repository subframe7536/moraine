import { useContext } from 'solid-js'

import { renderAnatomyText } from '../../../shared/anatomy'
import type { AnatomyConfig } from '../../../shared/anatomy'

import { CodeBlock } from './code'
import { ComponentDocContext } from './component-doc.context'

export function Anatomy(props: { value: AnatomyConfig }) {
  const component = useContext(ComponentDocContext)
  if (!component) {
    throw new Error('Anatomy requires a component docs context')
  }

  return (
    <div data-docs-anatomy>
      <CodeBlock lang="text" code={renderAnatomyText(component.name, props.value)} />
    </div>
  )
}
