export type AnatomyRoot =
  | { slot: 'root'; element?: string; noDom?: never }
  | { noDom: true; slot?: never; element?: never }

interface AnatomyChildren {
  element?: string
  children?: AnatomyNode[]
}

export type AnatomyNode = AnatomyChildren &
  (
    | { part: string; slot?: string; internal?: never }
    | { slot: string; part?: never; internal?: never }
    | { internal: string; part?: never; slot?: never }
  )

export interface AnatomyConfig {
  root: AnatomyRoot
  children?: AnatomyNode[]
}

export function anatomyNodeLabel(node: AnatomyNode): string {
  return node.part ?? node.slot ?? node.internal!
}

export function anatomyNodeKind(node: AnatomyNode): 'part' | 'slot' | 'internal' {
  return node.part !== undefined ? 'part' : node.internal !== undefined ? 'internal' : 'slot'
}

/** Dense text output for agent Markdown, derived from the same hierarchy as the Web list. */
export function renderAnatomyText(componentName: string, config: AnatomyConfig): string {
  const annotation = config.root.noDom
    ? 'no DOM'
    : `slot=root${config.root.element ? `; <${config.root.element}>` : ''}`
  const lines = [`${componentName} [component; ${annotation}]`]
  const visit = (nodes: AnatomyNode[], prefix: string) => {
    for (const [index, node] of nodes.entries()) {
      const last = index === nodes.length - 1
      const metadata: string[] = [anatomyNodeKind(node)]
      if (node.part && node.slot) {
        metadata.push(`slot=${node.slot}`)
      }
      if (node.element) {
        metadata.push(`<${node.element}>`)
      }
      lines.push(
        `${prefix}${last ? '└──' : '├──'} ${anatomyNodeLabel(node)} [${metadata.join('; ')}]`,
      )
      if (node.children) {
        visit(node.children, `${prefix}${last ? '    ' : '│   '}`)
      }
    }
  }
  visit(config.children ?? [], '')
  return lines.join('\n')
}
