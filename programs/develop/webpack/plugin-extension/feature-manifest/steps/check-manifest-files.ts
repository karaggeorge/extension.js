import fs from 'fs'
import path from 'path'
import {Compilation, Compiler, WebpackError} from '@rspack/core'
import * as messages from '../../../lib/messages'
import {PluginInterface, FilepathList} from '../../../webpack-types'

export class CheckManifestFiles {
  public readonly manifestPath: string
  public readonly includeList?: FilepathList
  public readonly excludeList?: FilepathList

  constructor(options: PluginInterface) {
    this.manifestPath = options.manifestPath
    this.includeList = options.includeList
    this.excludeList = options.excludeList
  }

  extractPaths(
    value:
      | string
      | string[]
      | {light: string; dark: string}
      | {light: string; dark: string}[]
  ) {
    const valueArr = Array.isArray(value) ? value : [value]

    if (typeof valueArr[0] === 'string') return valueArr

    const paths: any[] = []

    if (typeof value === 'object' && !Array.isArray(value)) {
      const icon = value as {light?: string; dark?: string}

      if (icon.light) {
        paths.push(icon.light)
      }

      if (icon.dark) {
        paths.push(icon.dark)
      }
    }

    return paths
  }

  private handleErrors(compilation: Compilation, WebpackError: any) {
    const iconExts = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp']
    const jsonExts = ['.json']
    const scriptExts = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']
    const htmlExt = '.html'

    const entries = Object.entries(this.includeList || {})
    for (const [field, value] of entries) {
      if (value) {
        const valueArr = this.extractPaths(value)

        for (const item of valueArr) {
          const ext = path.extname(item as string)
          const manifest = require(this.manifestPath)
          const manifestName = manifest.name || 'Extension.js'
          const fieldError = messages.manifestFieldError(
            manifestName,
            field,
            item as string
          )

          if (!fs.existsSync(item as string)) {
            if (iconExts.includes(ext)) {
              compilation.errors.push(new WebpackError(fieldError))
            } else if (jsonExts.includes(ext)) {
              compilation.errors.push(new WebpackError(fieldError))
            } else if (scriptExts.includes(ext)) {
              compilation.errors.push(new WebpackError(fieldError))
            } else if (ext === htmlExt) {
              compilation.errors.push(new WebpackError(fieldError))
            } else {
              compilation.errors.push(new WebpackError(fieldError))
            }
          }
        }
      }
    }
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(
      'manifest:check-manifest-files',
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'compatibility:check-manifest-files',
            // One after PROCESS_ASSETS_STAGE_OPTIMIZE, where
            // feature-browser-fields cuts off the browser-specific field prefixes.
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT
          },
          () => {
            // Handle all errors.
            this.handleErrors(compilation, WebpackError)
          }
        )
      }
    )
  }
}
