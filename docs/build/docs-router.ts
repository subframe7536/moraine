import { BaseFileSystemRouter } from 'solid-file-router/plugin'
import type { DefaultFileSystemRouter } from 'solid-file-router/plugin'
/**
 * Routes the docs site's two route trees through one router: `routes/` holds the
 * app route modules while `pages/` holds the Markdown/MDX content pages.
 * File events and manifest mapping delegate to the child router that owns the
 * scanned file.
 */
export class DocsFileSystemRouter extends BaseFileSystemRouter {
  private readonly children: DefaultFileSystemRouter[]

  constructor(children: DefaultFileSystemRouter[]) {
    super({ dir: '.', extensions: [] })
    this.children = children
  }

  override isRoute(src: string): boolean {
    return this.children.some((router) => router.isRoute(src))
  }

  override toRoute(src: string): ReturnType<DefaultFileSystemRouter['toRoute']> {
    return this.children.find((router) => router.isRoute(src))?.toRoute(src)
  }

  override glob(): string {
    const dirs = this.children.map((router) => router.config.dir)
    const extensions = [...new Set(this.children.flatMap((router) => router.config.extensions))]
    return `{${dirs.join(',')}}/**/*.{${extensions.join(',')}}`
  }
}
