import * as ts from 'typescript'

const TARGET_GLOBS = ['src/**/*.tsx', 'src/**/*.class.ts', 'playground/**/*.tsx']
const HAS_PSEUDO_RE = /:has\(/g
const HAS_TOKEN_RE = /\bhas-[a-z0-9-]+/gi

interface Violation {
  file: string
  line: number
  column: number
  token: string
}

function collectViolations(file: string, source: string): Violation[] {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const violations: Violation[] = []

  const pushViolations = (node: ts.Node, text: string): void => {
    for (const matcher of text.matchAll(HAS_PSEUDO_RE)) {
      const offset = node.getStart() + matcher.index! + 1
      const position = sourceFile.getLineAndCharacterOfPosition(offset)
      violations.push({
        file,
        line: position.line + 1,
        column: position.character + 1,
        token: ':has(',
      })
    }

    for (const matcher of text.matchAll(HAS_TOKEN_RE)) {
      const offset = node.getStart() + matcher.index! + 1
      const position = sourceFile.getLineAndCharacterOfPosition(offset)
      violations.push({
        file,
        line: position.line + 1,
        column: position.character + 1,
        token: matcher[0],
      })
    }
  }

  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      pushViolations(node, node.text)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

async function main(): Promise<void> {
  const violations: Violation[] = []

  for (const pattern of TARGET_GLOBS) {
    const glob = new Bun.Glob(pattern)
    for await (const file of glob.scan({ cwd: '.' })) {
      const source = await Bun.file(file).text()
      violations.push(...collectViolations(file, source))
    }
  }

  if (violations.length === 0) {
    process.stdout.write('modern css check passed\n')
    return
  }

  process.stderr.write('Found unsupported modern CSS selectors/classes:\n')
  for (const violation of violations) {
    process.stderr.write(
      `- ${violation.file}:${violation.line}:${violation.column} (${violation.token})\n`,
    )
  }

  process.exit(1)
}

await main()
