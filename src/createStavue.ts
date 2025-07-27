import type { App, InjectionKey } from 'vue'
import type { CreateStavueOptions, Stavue } from './types'

/**
 * Символ для provide/inject, чтобы обеспечить изоляцию.
 * @internal
 */
export const stavueSymbol: InjectionKey<Stavue> = Symbol('stavue')

/**
 * Создает экземпляр Stavue для подключения к приложению Vue.
 *
 * @param options - Опции для создания экземпляра, включая плагины.
 * @returns Экземпляр Stavue с методом `install`.
 *
 * @example
 * ```js
 * import { createApp } from 'vue'
 * import { createStavue } from 'stavue'
 *
 * const stavue = createStavue({ plugins: [myPlugin] })
 * const app = createApp(App)
 *
 * app.use(stavue)
 * ```
 */
export function createStavue(options?: CreateStavueOptions): Stavue {
  const stavue: Omit<Stavue, 'install'> = {
    activeStores: new Map(),
    plugins: options?.plugins || [],
    app: {} as App,
  }

  const stavueWithInstall = Object.assign(stavue, {
    install(app: App) {
      stavue.app = app
      app.provide(stavueSymbol, stavue as Stavue)
    },
  })

  return stavueWithInstall as Stavue
}
