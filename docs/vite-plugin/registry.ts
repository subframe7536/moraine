export type DocsDirectiveName =
  | 'example'
  | 'docs-header'
  | 'header'
  | 'docs-api-reference'
  | 'api-reference'
  | 'intro-cards'
  | 'intro-components'
  | 'toast-hosts'
  | 'code-tabs'

export interface DocsDirectiveRegistration {
  name: DocsDirectiveName
  aliases?: string[]
}

export interface DocsWidgetRegistration {
  name: string
}

export interface DocsPluginRegistry {
  directives: Set<string>
  widgets: Set<string>
  directiveAliases: Map<string, string>
}

export function createDocsPluginRegistry(): DocsPluginRegistry {
  const directives = new Set<string>()
  const widgets = new Set<string>()
  const directiveAliases = new Map<string, string>()

  const registerDirective = (registration: DocsDirectiveRegistration) => {
    directives.add(registration.name)
    for (const alias of registration.aliases ?? []) {
      directiveAliases.set(alias, registration.name)
      directives.add(alias)
    }
  }

  const registerWidget = (registration: DocsWidgetRegistration) => {
    widgets.add(registration.name)
  }

  registerDirective({ name: 'example' })
  registerDirective({ name: 'docs-header', aliases: ['header'] })
  registerDirective({ name: 'docs-api-reference', aliases: ['api-reference'] })
  registerDirective({ name: 'intro-cards' })
  registerDirective({ name: 'intro-components' })
  registerDirective({ name: 'toast-hosts' })
  registerDirective({ name: 'code-tabs' })

  registerWidget({ name: 'docs-header' })
  registerWidget({ name: 'docs-api-reference' })
  registerWidget({ name: 'intro-cards' })
  registerWidget({ name: 'intro-components' })
  registerWidget({ name: 'toast-hosts' })

  return {
    directives,
    widgets,
    directiveAliases,
  }
}
