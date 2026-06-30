import { parse } from 'vite'
import type { ESTree, ParserOptions } from 'vite'

export type ProgramNode = ESTree.Program
export type StatementNode = ProgramNode['body'][number]
export type ParseExampleCode = (code: string) => Promise<ProgramNode>

export const EXAMPLE_PARSE_OPTIONS = {
  lang: 'tsx',
  sourceType: 'module',
} satisfies ParserOptions

export async function parseExampleCode(code: string): Promise<ProgramNode> {
  return (await parse('example.tsx', code, EXAMPLE_PARSE_OPTIONS)).program
}
