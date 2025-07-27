import type { App, ComputedRef, ToRefs } from 'vue'

export type StateTree = Record<string, any>
export type ActionsTree = Record<string, (...args: any[]) => any>
export type GettersTree<S extends StateTree> = Record<string, (this: S, state: S) => any>

export interface StoreOptions<S extends StateTree, A extends ActionsTree, G> {
  state: () => S
  actions?: A
  getters?: G & ThisType<S & A & GettersAsProperties<G>> & GettersTree<S>
}

export type StoreDefinition<S extends StateTree, A extends ActionsTree, G>
  = () => UseStoreReturnType<S, A, G>

export interface PluginContext {
  app: App
  store: StateTree & StoreMethods<any>
  id: string
  options: StoreOptions<any, any, any>
}

export type StavuePlugin = (context: PluginContext) => void

export interface CreateStavueOptions {
  plugins?: StavuePlugin[]
}

export interface Stavue {
  app: App
  activeStores: Map<string, StateTree>
  plugins: StavuePlugin[]
  install: (app: App) => void
}

type GettersAsProperties<G> = {
  [K in keyof G]: G[K] extends (...args: any[]) => infer R ? ComputedRef<R> : never
}

export type SubscriptionCallback<S> = (mutation: { storeId: string, type: string }, state: S) => void
export type Unsubscribe = () => void

export interface StoreMethods<S> {
  $reset: () => void
  $subscribe: (callback: SubscriptionCallback<S>) => Unsubscribe
}

export type UseStoreReturnType<S, A, G> = S & A & GettersAsProperties<G> & ToRefs<S> & StoreMethods<S>
