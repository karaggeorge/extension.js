// ██████╗ ███████╗██╗   ██╗███████╗██╗      ██████╗ ██████╗
// ██╔══██╗██╔════╝██║   ██║██╔════╝██║     ██╔═══██╗██╔══██╗
// ██║  ██║█████╗  ██║   ██║█████╗  ██║     ██║   ██║██████╔╝
// ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║██╔═══╝
// ██████╔╝███████╗ ╚████╔╝ ███████╗███████╗╚██████╔╝██║
// ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚══════╝ ╚═════╝ ╚═╝

import {type Compiler} from 'webpack'
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

import {type DevOptions} from '../../extensionDev'
import {isUsingTypeScript, tsCheckerOptions} from '../options/typescript'

export default function compilationPlugins(
  projectDir: string,
  opts: DevOptions
) {
  return {
    constructor: {name: 'CompilationPlugins'},
    apply: (compiler: Compiler) => {
      new CaseSensitivePathsPlugin().apply(compiler)

      if (isUsingTypeScript(projectDir)) {
        const options = tsCheckerOptions(projectDir, opts)
        new ForkTsCheckerWebpackPlugin(options).apply(compiler)
      }

      new MiniCssExtractPlugin().apply(compiler)
    }
  }
}
