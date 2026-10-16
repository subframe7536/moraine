// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'

import path from 'pathe'
import { describe, expect, test } from 'vitest'

import { collectFiles } from '../core/paths.ts'

import { COMPONENT_API_SCHEMA_URL } from './write.ts'

const projectRoot = path.resolve(__dirname, '../../..')
const schemaPath = path.join(projectRoot, 'docs/public/component-api.schema.json')
const pagesRoot = path.join(projectRoot, 'docs/pages')

describe('component-api.schema.json', () => {
  test('schema file exists and defines valid JSON Schema structure', () => {
    expect(existsSync(schemaPath)).toBe(true)
    const raw = readFileSync(schemaPath, 'utf8')
    const schema = JSON.parse(raw) as {
      $schema: string
      $id: string
      title: string
      type: string
      required: string[]
      properties: Record<string, { type?: string; description?: string }>
      $defs: Record<string, unknown>
    }

    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.$id).toBe(COMPONENT_API_SCHEMA_URL)
    expect(schema.title).toBe('MoraineComponentApi')
    expect(schema.type).toBe('object')
    expect(schema.required).toEqual(['key', 'name', 'kind', 'parts', 'slots', 'dataAttributes'])
    expect(schema.properties.key).toBeDefined()
    expect(schema.properties.name).toBeDefined()
    expect(schema.properties.kind).toBeDefined()
    expect(schema.properties.parts).toBeDefined()
    expect(schema.properties.slots).toBeDefined()
    expect(schema.properties.dataAttributes).toBeDefined()
    expect(schema.$defs.DefaultValue).toBeDefined()
    expect(schema.$defs.GenericParameterApi).toBeDefined()
    expect(schema.$defs.AccessApi).toBeDefined()
    expect(schema.$defs.PropApi).toBeDefined()
    expect(schema.$defs.PartApi).toBeDefined()
    expect(schema.$defs.ItemApi).toBeDefined()
    expect(schema.$defs.DataAttributeTargetApi).toBeDefined()
  })

  test('all component api.json files conform to the component api contract', () => {
    const apiFiles = collectFiles(pagesRoot, (file) => path.basename(file) === 'api.json')
    expect(apiFiles.length).toBeGreaterThanOrEqual(40)

    for (const file of apiFiles) {
      const data = JSON.parse(readFileSync(file, 'utf8')) as {
        $schema?: string
        key: string
        name: string
        kind: string
        parts: Array<{
          id: string
          name: string
          access: { kind: string; name?: string; root?: string; member?: string; factory?: string }
          props: Array<{ name: string; optional: boolean; type: string }>
        }>
        slots: string[]
        dataAttributes: Array<{ target: string; attributes: string[] }>
      }

      expect(typeof data.key).toBe('string')
      expect(typeof data.name).toBe('string')
      expect(['single', 'composite']).toContain(data.kind)
      expect(Array.isArray(data.parts)).toBe(true)
      expect(data.parts.length).toBeGreaterThan(0)
      for (const part of data.parts) {
        expect(typeof part.id).toBe('string')
        expect(typeof part.name).toBe('string')
        expect(['export', 'attached', 'factory-member']).toContain(part.access.kind)
        expect(Array.isArray(part.props)).toBe(true)
        for (const prop of part.props) {
          expect(typeof prop.name).toBe('string')
          expect(typeof prop.optional).toBe('boolean')
          expect(typeof prop.type).toBe('string')
        }
      }
      expect(Array.isArray(data.slots)).toBe(true)
      expect(Array.isArray(data.dataAttributes)).toBe(true)
    }
  })
})
