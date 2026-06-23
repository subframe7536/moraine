import type { ESTree, ParserOptions } from 'vite'

export type ProgramNode = ESTree.Program
export type StatementNode = ProgramNode['body'][number]
export type ParseExampleCode = (code: string) => ProgramNode

export const EXAMPLE_PARSE_OPTIONS = {
  lang: 'tsx',
  sourceType: 'module',
} satisfies ParserOptions
