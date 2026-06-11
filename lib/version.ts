import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 读取 package.json 中的版本号（开发 tsx 与 npm dist/cli.mjs 均适用） */
export function getCliVersion(): string {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const pkgPath = join(root, 'package.json')
  if (!existsSync(pkgPath)) return 'unknown'
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
    return pkg.version?.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export function printVersion(): void {
  console.log(getCliVersion())
}
