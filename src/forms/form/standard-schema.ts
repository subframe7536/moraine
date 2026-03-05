import type { StandardProps } from 'valibot'
/**
 * Inlined Standard Schema V1 types.
 *
 * Avoids adding `@standard-schema/spec` as a dependency.
 * Valibot, zod v4, ArkType, etc. all natively implement `~standard`,
 * so the inlined type is structurally compatible.
 *
 * @see https://github.com/standard-schema/standard-schema
 */

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardProps<Input, Output>
}
