import { parse } from 'vite'
import type { ESTree, ParserOptions } from 'vite'

export type ProgramNode = ESTree.Program
export type StatementNode = ProgramNode['body'][number]
export type ParsePreviewCode = (code: string) => Promise<ProgramNode>

export const PREVIEW_PARSE_OPTIONS = {
  lang: 'tsx',
  sourceType: 'module',
} satisfies ParserOptions

export async function parsePreviewCode(code: string): Promise<ProgramNode> {
  return (await parse('preview.tsx', code, PREVIEW_PARSE_OPTIONS)).program
}
