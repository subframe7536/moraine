import ts from 'typescript'

interface GenericAliasInfo {
  paramName: string
  defaultType: ts.TypeNode
}

interface GenericFunctionInfo {
  paramName: string
  defaultType: ts.TypeNode
}

function collectAliasReferences(
  node: ts.Node | undefined,
  aliasNames: ReadonlySet<string>,
  out: Set<string>,
): void {
  if (!node) {
    return
  }

  const visit = (child: ts.Node) => {
    if (
      ts.isTypeReferenceNode(child) &&
      ts.isIdentifier(child.typeName) &&
      aliasNames.has(child.typeName.text)
    ) {
      out.add(child.typeName.text)
    }
    ts.forEachChild(child, visit)
  }

  visit(node)
}

function replaceTypeReferences(
  root: ts.Node,
  context: ts.TransformationContext,
  genericParamName: string | undefined,
  genericDefaultType: ts.TypeNode | undefined,
  aliasNames: ReadonlySet<string>,
): ts.Node {
  const visit = (node: ts.Node): ts.Node => {
    if (
      genericParamName &&
      genericDefaultType &&
      ts.isTypeReferenceNode(node) &&
      !node.typeArguments &&
      ts.isIdentifier(node.typeName) &&
      node.typeName.text === genericParamName
    ) {
      return cloneTypeNode(genericDefaultType)
    }

    if (
      ts.isTypeReferenceNode(node) &&
      node.typeArguments &&
      node.typeArguments.length > 0 &&
      ts.isIdentifier(node.typeName) &&
      aliasNames.has(node.typeName.text)
    ) {
      return ts.factory.updateTypeReferenceNode(node, node.typeName, undefined)
    }

    return ts.visitEachChild(node, visit, context)
  }

  return ts.visitNode(root, visit)
}

function cloneTypeNode(typeNode: ts.TypeNode): ts.TypeNode {
  const nodeFactory = ts.factory as ts.NodeFactory & { cloneNode: (node: ts.Node) => ts.Node }
  return nodeFactory.cloneNode(typeNode) as ts.TypeNode
}

export function preprocessGenericTypeAliases(text: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true)
  const genericAliases = new Map<string, GenericAliasInfo>()

  for (const statement of sourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) {
      continue
    }
    if (!statement.typeParameters || statement.typeParameters.length !== 1) {
      continue
    }

    const typeParam = statement.typeParameters[0]!
    if (!typeParam.default) {
      continue
    }

    genericAliases.set(statement.name.text, {
      paramName: typeParam.name.text,
      defaultType: typeParam.default,
    })
  }

  if (genericAliases.size === 0) {
    return text
  }

  const aliasNames = new Set(genericAliases.keys())
  const referencedAliases = new Set<string>()
  const functionGenerics = new Map<ts.FunctionDeclaration, GenericFunctionInfo>()

  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement)) {
      continue
    }
    if (!statement.typeParameters || statement.typeParameters.length !== 1) {
      continue
    }

    const typeParam = statement.typeParameters[0]!
    if (!typeParam.default) {
      continue
    }

    const aliasesInParameters = new Set<string>()
    for (const parameter of statement.parameters) {
      collectAliasReferences(parameter.type, aliasNames, aliasesInParameters)
    }
    if (aliasesInParameters.size === 0) {
      continue
    }

    for (const aliasName of aliasesInParameters) {
      referencedAliases.add(aliasName)
    }

    functionGenerics.set(statement, {
      paramName: typeParam.name.text,
      defaultType: typeParam.default,
    })
  }

  if (referencedAliases.size === 0) {
    return text
  }

  let changed = false
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit = (node: ts.Node): ts.Node => {
      if (ts.isTypeAliasDeclaration(node) && referencedAliases.has(node.name.text)) {
        const aliasInfo = genericAliases.get(node.name.text)
        if (aliasInfo) {
          changed = true
          const updatedType = replaceTypeReferences(
            node.type,
            context,
            aliasInfo.paramName,
            aliasInfo.defaultType,
            referencedAliases,
          ) as ts.TypeNode
          return ts.factory.updateTypeAliasDeclaration(
            node,
            node.modifiers,
            node.name,
            undefined,
            updatedType,
          )
        }
      }

      if (ts.isFunctionDeclaration(node)) {
        const genericInfo = functionGenerics.get(node)
        if (genericInfo) {
          changed = true
          const updatedParameters = node.parameters.map((parameter) => {
            if (!parameter.type) {
              return parameter
            }

            const updatedType = replaceTypeReferences(
              parameter.type,
              context,
              genericInfo.paramName,
              genericInfo.defaultType,
              referencedAliases,
            ) as ts.TypeNode
            return ts.factory.updateParameterDeclaration(
              parameter,
              parameter.modifiers,
              parameter.dotDotDotToken,
              parameter.name,
              parameter.questionToken,
              updatedType,
              parameter.initializer,
            )
          })

          const updatedReturnType = node.type
            ? (replaceTypeReferences(
                node.type,
                context,
                genericInfo.paramName,
                genericInfo.defaultType,
                referencedAliases,
              ) as ts.TypeNode)
            : undefined

          return ts.factory.updateFunctionDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            undefined,
            updatedParameters,
            updatedReturnType,
            node.body,
          )
        }
      }

      if (
        ts.isTypeReferenceNode(node) &&
        node.typeArguments &&
        node.typeArguments.length > 0 &&
        ts.isIdentifier(node.typeName) &&
        referencedAliases.has(node.typeName.text)
      ) {
        changed = true
        return ts.factory.updateTypeReferenceNode(node, node.typeName, undefined)
      }

      return ts.visitEachChild(node, visit, context)
    }

    return (node) => ts.visitNode(node, visit) as ts.SourceFile
  }

  const transformed = ts.transform(sourceFile, [transformer])
  const output = ts.createPrinter().printFile(transformed.transformed[0]!)
  transformed.dispose()

  return changed ? output : text
}
