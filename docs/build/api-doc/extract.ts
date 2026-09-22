import { TypeExtractor } from './extract-types'
import { RecipeExtractor } from './recipe'
import type { RecipeApi } from './recipe'
import { loadApiRegistry } from './registry'
import type { ComponentApi, ComponentIndexEntry, GenerationResult, PartApi } from './types'

const EMPTY_RECIPE: RecipeApi = {
  slots: [],
  variants: [],
  dataAttributes: [],
}

export async function generateApiDoc(projectRoot: string): Promise<GenerationResult> {
  const registry = await loadApiRegistry(projectRoot)
  const typeExtractor = new TypeExtractor(projectRoot)
  const recipeExtractor = new RecipeExtractor(projectRoot)
  const componentDocs = new Map<string, ComponentApi>()
  const indexComponents: ComponentIndexEntry[] = []

  for (const component of registry) {
    const typesModule = await typeExtractor.loadModule(component.typesPath)
    if (!typesModule) {
      throw new Error(
        `[api-doc] Could not load types file for component "${component.name}" at ${component.typesPath}`,
      )
    }

    const kind = await typeExtractor.extractKind(typesModule, component.namespaceName)
    const item = await typeExtractor.extractItem(typesModule, component.namespaceName)
    const recipe = component.recipePath
      ? await recipeExtractor.extract(component.recipePath, component.name)
      : EMPTY_RECIPE
    const parts: PartApi[] = []

    for (const part of component.parts) {
      const partTypesModule =
        part.typesPath === component.typesPath
          ? typesModule
          : await typeExtractor.loadModule(part.typesPath)
      if (!partTypesModule) {
        throw new Error(
          `[api-doc] Could not load types file for part "${part.name}" at ${part.typesPath}`,
        )
      }
      const extracted = await typeExtractor.extractPart(
        partTypesModule,
        part.namespaceName,
        part.propsTypeName,
        part.name,
        part.isRoot,
        recipe.variants,
      )
      parts.push({
        id: part.id,
        name: part.name,
        access: part.access,
        ...(extracted.description ? { description: extracted.description } : {}),
        ...(extracted.generics.length > 0 ? { generics: extracted.generics } : {}),
        ...(extracted.defaultElement ? { defaultElement: extracted.defaultElement } : {}),
        props: extracted.props,
      })
    }

    const description = parts[0]?.description
    componentDocs.set(component.key, {
      key: component.key,
      name: component.name,
      ...(description ? { description } : {}),
      kind,
      parts,
      ...(item ? { item } : {}),
      slots: recipe.slots,
      dataAttributes: recipe.dataAttributes,
    })
    indexComponents.push({
      key: component.key,
      name: component.name,
      category: component.category,
    })
  }
  indexComponents.sort((left, right) => left.key.localeCompare(right.key))

  return {
    indexDoc: { components: indexComponents },
    componentDocs,
  }
}
