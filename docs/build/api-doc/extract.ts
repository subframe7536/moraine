import { toKebabCase } from '../core/strings'

import { discoverPublicComponents } from './discovery'
import { TypeExtractor } from './extract-types'
import { RuntimeExtractor } from './runtime'
import type { ComponentApi, ComponentIndexEntry, GenerationResult, PartApi } from './types'

export async function generateApiDoc(projectRoot: string): Promise<GenerationResult> {
  const discovered = await discoverPublicComponents(projectRoot)
  const typeExtractor = new TypeExtractor(projectRoot)
  const runtimeExtractor = new RuntimeExtractor(projectRoot)

  const componentDocs = new Map<string, ComponentApi>()

  for (const comp of discovered) {
    const typesModule = await typeExtractor.loadModule(comp.typesPath)
    if (!typesModule) {
      throw new Error(
        `[api-doc] Could not load types file for component "${comp.name}" at ${comp.typesPath}`,
      )
    }

    const kind = await typeExtractor.extractKind(typesModule, comp.namespaceName)
    const slots = await typeExtractor.extractSlots(typesModule, comp.namespaceName)
    const item = await typeExtractor.extractItem(typesModule, comp.namespaceName)
    const slotNamesSet = new Set(slots.map((s) => s.name))

    const parts: PartApi[] = []

    for (const part of comp.parts) {
      const partTypesModule =
        part.typesPath === comp.typesPath
          ? typesModule
          : await typeExtractor.loadModule(part.typesPath)

      if (!partTypesModule) {
        throw new Error(
          `[api-doc] Could not load types file for part "${part.name}" at ${part.typesPath}`,
        )
      }

      const partData = await typeExtractor.extractPart(
        partTypesModule,
        part.namespaceName,
        part.propsTypeName,
        part.name,
        part.isRoot,
      )
      if (part.rendersDom === false) {
        partData.rendering = { rendersDom: false }
      }

      const targetFallback = part.isRoot
        ? 'root'
        : toKebabCase(part.name.includes('.') ? part.name.split('.').pop()! : part.name)

      const runtime =
        partData.rendering?.rendersDom === false
          ? { targets: [], cssVariables: [] }
          : await runtimeExtractor.extractRuntimeMetadata({
              sourcePath: part.runtimeSourcePath ?? part.sourcePath,
              implementationName: part.runtimeImplementationName ?? part.implementationName,
              publicSlotNames: part.runtimeSlotNames
                ? new Set(part.runtimeSlotNames)
                : slotNamesSet,
              targetFallback,
              allowHostFallback: part.runtimeAllowHostFallback ?? true,
              delegateRootTargets: part.runtimeDelegateRootTargets,
              defaultElement: partData.rendering?.defaultElement,
            })

      parts.push({
        id: part.id,
        name: part.name,
        access: part.access,
        sourcePath: part.sourcePath,
        ...(partData.description ? { description: partData.description } : {}),
        ...(partData.generics.length > 0 ? { generics: partData.generics } : {}),
        ...(partData.rendering ? { rendering: partData.rendering } : {}),
        props: partData.props,
        slots: part.isRoot ? slots : [],
        runtime: runtime.targets,
        cssVariables: runtime.cssVariables,
      })
    }

    const rootDiscoveredPart = comp.parts.find((p) => p.isRoot) ?? comp.parts[0]
    const rootPart = parts.find((p) => p.id === rootDiscoveredPart?.id) ?? parts[0]
    const description = rootPart?.description

    const componentApi: ComponentApi = {
      key: comp.key,
      name: comp.name,
      category: comp.category,
      ...(description ? { description } : {}),
      kind,
      sourcePath: comp.sourcePath,
      parts,
      ...(item ? { item } : {}),
    }

    componentDocs.set(comp.key, componentApi)
  }

  const indexComponents: ComponentIndexEntry[] = [...componentDocs.values()]
    .map((c) => {
      const entry: ComponentIndexEntry = {
        key: c.key,
        name: c.name,
        category: c.category,
        kind: c.kind,
        sourcePath: c.sourcePath,
      }
      if (c.description) {
        entry.description = c.description
      }
      return entry
    })
    .sort((a, b) => a.key.localeCompare(b.key))

  return {
    indexDoc: { components: indexComponents },
    componentDocs,
    diagnostics: [...runtimeExtractor.diagnostics],
  }
}
