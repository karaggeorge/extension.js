import {type Compiler} from '@rspack/core'
import {type RunFirefoxExtensionInterface} from './types'
import CreateWebSocketServer from './steps/CreateWebSocketServer'
import SetupReloadStrategy from './steps/SetupReloadStrategy'
import RunFirefoxPlugin from './steps/RunFirefoxPlugin'

export default class RunFirefoxExtension {
  private readonly options: RunFirefoxExtensionInterface

  constructor(options: RunFirefoxExtensionInterface) {
    this.options = {
      manifestPath: options.manifestPath,
      extensionPath: options.extensionPath,
      port: options.port || 8002,
      browserFlags: options.browserFlags || [],
      userDataDir: options.userDataDir,
      startingUrl: options.startingUrl,
      autoReload: options.autoReload != null ? options.autoReload : true,
      stats: options.stats != null ? options.stats : true
    }
  }

  /**
   * RunFirefoxExtension works by creating a WebSockets server
   * that listens to changes triggered by the user extension
   * via rspack. When a change is detected, the server sends
   * a message to an extension called reload-extension, which
   * is injected into the browser. This extension is responsible
   * for sending messages to the user extension. We do that by
   * injecting a script into the background page that listens
   * to messages from the reload-extension. The HMR part is
   * done by webpack-target-webextension, which patches the
   * manifest file and modifies the background script to accept
   * both extension runtime updates (service_worker, manifest.json)
   * and HMR updates (background, content scripts).
   *
   * Features supported:
   * - HTML from the manifest file (action, options_ui, etc) - HMR enabled
   * - CSS/JS from the HTML file - HMR enabled
   * - Changes in assets from an HTML file - HMR enabled
   * - Background script - HMR enabled
   * - Content scripts (js) - HMR enabled
   * - Content scripts (css) - HMR enabled
   * - Context Menu (API) - Full extension reload (browser.runtime.reload)
   * - declarative_net_request (API) - Full extension reload (browser.runtime.reload)
   * - _locales - Full extension reload (browser.runtime.reload)
   * - Service worker - Full extension reload (browser.runtime.reload)
   * - manifest.json - Full extension reload (browser.runtime.reload)
   */
  apply(compiler: Compiler) {
    // 1 - Creates a WebSockets server to communicate with the browser.
    // This server is responsible for sending reload requests to the client,
    // which is a browser extension that is injected into the browser called
    // reload-extension. This extension is responsible for sending messages
    // to the user extension.
    if (compiler.options.mode === 'development') {
      new CreateWebSocketServer(this.options).apply(compiler)
    }

    // 2 - Patches the manifest file, modifies the background script to
    // accept both extension runtime updates (service_worker, manifest.json)
    // and HMR updates (background, content scripts). The HMR part is done by
    // webpack-target-webextension.
    if (compiler.options.mode === 'development') {
      new SetupReloadStrategy(this.options).apply(compiler)
    }

    // 3 - Bundle the reloader and manager extensions. The reloader extension
    // is injected into the browser and is responsible for sending reload
    // requests to the user extension. The manager extension is responsible
    // for everything else, for now opening the chrome://extension page on startup.
    // It starts a new browser instance with the user extension loaded.
    new RunFirefoxPlugin(this.options).apply(compiler)
  }
}
