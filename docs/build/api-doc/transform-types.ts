import type { ESTree } from 'vite'

import { entityNameToText, nodeText, parseTypeScript, walkAst } from './ast'

interface GenericAliasInfo {
  node: ESTree.TSTypeAliasDeclaration
  paramName: string
  defaultType: ESTree.TSType
}

interface GenericFunctionInfo {
  node: DeclareFunctionNode
  paramName: string
  defaultType: ESTree.TSType
}

type DeclareFunctionNode = ESTree.Function

interface TextEdit {
  start: number
  end: number
  text: string
}

function collectAliasReferences(node: unknown, aliasNames: ReadonlySet<string>): Set<string> {
  const references = new Set<string>()
  walkAst(node, (current) => {
    if (current.type !== 'TSTypeReference') {
      return
    }
    const typeName = entityNameToText(current.typeName)
    if (typeName && aliasNames.has(typeName)) {
      references.add(typeName)
    }
  })
  return references
}

function addEdit(edits: TextEdit[], next: TextEdit): void {
  if (edits.some((edit) => edit.start <= next.start && edit.end >= next.end)) {
    return
  }
  for (let index = edits.length - 1; index >= 0; index -= 1) {
    const edit = edits[index]!
    if (next.start <= edit.start && next.end >= edit.end) {
      edits.splice(index, 1)
    }
  }
  edits.push(next)
}

function addTypeReferenceEdits(
  root: unknown,
  genericParamName: string | undefined,
  genericDefaultText: string | undefined,
  aliasNames: ReadonlySet<string>,
  edits: TextEdit[],
): void {
  walkAst(root, (current) => {
    if (current.type !== 'TSTypeReference') {
      return
    }

    const reference = current
    const typeName = entityNameToText(reference.typeName)
    if (
      genericParamName &&
      genericDefaultText &&
      !reference.typeArguments &&
      typeName === genericParamName
    ) {
      addEdit(edits, { start: reference.start, end: reference.end, text: genericDefaultText })
      return
    }

    if (typeName && aliasNames.has(typeName) && reference.typeArguments) {
      addEdit(edits, {
        start: reference.typeArguments.start,
        end: reference.typeArguments.end,
        text: '',
      })
    }
  })
}

function applyEdits(text: string, edits: TextEdit[]): string {
  let output = text
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  }
  return output
}

export async function preprocessGenericTypeAliases(
  text: string,
  fileName: string,
): Promise<string> {
  const source = await parseTypeScript(fileName, text, 'ts')
  const genericAliases = new Map<string, GenericAliasInfo>()

  for (const statement of source.program.body) {
    if (
      statement.type !== 'TSTypeAliasDeclaration' ||
      statement.typeParameters?.params.length !== 1
    ) {
      continue
    }
    const typeParam = statement.typeParameters.params[0]!
    if (!typeParam.default) {
      continue
    }
    genericAliases.set(statement.id.name, {
      node: statement,
      paramName: typeParam.name.name,
      defaultType: typeParam.default,
    })
  }

  if (genericAliases.size === 0) {
    return text
  }

  const aliasNames = new Set(genericAliases.keys())
  const referencedAliases = new Set<string>()
  const functionGenerics: GenericFunctionInfo[] = []

  for (const statement of source.program.body) {
    if (statement.type !== 'TSDeclareFunction' || statement.typeParameters?.params.length !== 1) {
      continue
    }
    const typeParam = statement.typeParameters.params[0]!
    if (!typeParam.default) {
      continue
    }

    const aliasesInParameters = new Set<string>()
    for (const parameter of statement.params) {
      const annotation = 'typeAnnotation' in parameter ? parameter.typeAnnotation : null
      for (const aliasName of collectAliasReferences(annotation, aliasNames)) {
        aliasesInParameters.add(aliasName)
      }
    }
    if (aliasesInParameters.size === 0) {
      continue
    }

    for (const aliasName of aliasesInParameters) {
      referencedAliases.add(aliasName)
    }
    functionGenerics.push({
      node: statement,
      paramName: typeParam.name.name,
      defaultType: typeParam.default,
    })
  }

  if (referencedAliases.size === 0) {
    return text
  }

  const edits: TextEdit[] = []
  for (const aliasName of referencedAliases) {
    const alias = genericAliases.get(aliasName)
    if (!alias?.node.typeParameters) {
      continue
    }
    addEdit(edits, {
      start: alias.node.typeParameters.start,
      end: alias.node.typeParameters.end,
      text: '',
    })
    addTypeReferenceEdits(
      alias.node.typeAnnotation,
      alias.paramName,
      nodeText(source, alias.defaultType),
      referencedAliases,
      edits,
    )
  }

  for (const genericFunction of functionGenerics) {
    if (genericFunction.node.typeParameters) {
      addEdit(edits, {
        start: genericFunction.node.typeParameters.start,
        end: genericFunction.node.typeParameters.end,
        text: '',
      })
    }
    const defaultText = nodeText(source, genericFunction.defaultType)
    for (const parameter of genericFunction.node.params) {
      const annotation = 'typeAnnotation' in parameter ? parameter.typeAnnotation : null
      addTypeReferenceEdits(
        annotation,
        genericFunction.paramName,
        defaultText,
        referencedAliases,
        edits,
      )
    }
    addTypeReferenceEdits(
      genericFunction.node.returnType,
      genericFunction.paramName,
      defaultText,
      referencedAliases,
      edits,
    )
  }

  addTypeReferenceEdits(source.program, undefined, undefined, referencedAliases, edits)
  return edits.length > 0 ? applyEdits(text, edits) : text
}
