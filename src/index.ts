import type { App, ComputedRef, InjectionKey, Reactive, ToRefs } from 'vue'
import { computed, inject, reactive, toRefs, watch } from 'vue'

export type StateTree = Record<string, any>
export type ActionsTree = Record<string, (...args: any[]) => any>
export type GettersTree<S extends StateTree> = Record<string, (state: S | S & ToRefs<S>) => any>

type GettersAsProperties<G> = {
  [K in keyof G]: G[K] extends (...args: any[]) => infer R ? ComputedRef<R> : never
}

export interface StoreOptions<
  S extends StateTree,
  A extends ActionsTree,
  G,
> {
  state: () => S
  actions?: A
  getters?: G & ThisType<S & A & GettersAsProperties<G>> & GettersTree<S>
}

export interface StoreMethods<S> {
  $reset: () => void
  $subscribe: (callback: SubscriptionCallback<S>) => Unsubscribe
}

export type UseStoreReturnType<S, A, G> = S
  & A
  & GettersAsProperties<G>
  & ToRefs<S>
  & StoreMethods<S>

export type StoreDefinition<
  S extends StateTree,
  A extends ActionsTree,
  G,
> = () => UseStoreReturnType<S, A, G>

export interface StavuePlugin {
  activeStores: Map<string, StateTree>
  install: (app: App) => void
}

export interface Stavue {
  activeStores: Map<string, StateTree>
}

export interface SubscriptionCallbackMutation<S> {
  storeId: string
  type: 'direct' // В будущем могут быть и другие, например 'patch' или 'action'
}

export type SubscriptionCallback<S> = (mutation: SubscriptionCallbackMutation<S>, state: S) => void

type Unsubscribe = () => void

function bindActionsToStoreInstance(actions: ActionsTree, storeInstance: StateTree): void {
  for (const actionName of Object.keys(actions)) {
    storeInstance[actionName] = actions[actionName].bind(storeInstance)
  }
}
function assignStateToStoreInstance<S extends StateTree>(
  state: Reactive<S>,
  storeInstance: StateTree,
): void {
  Object.assign(storeInstance, state)
  Object.assign(storeInstance, toRefs(state))
}

function bindGettersToStoreInstance(
  getters: GettersTree<StateTree>,
  state: Reactive<StateTree>,
  storeInstance: StateTree,
): void {
  for (const getterName of Object.keys(getters)) {
    const getter = getters[getterName]
    const computedGetter = computed(() => getter.call(storeInstance, state))
    storeInstance[getterName] = computedGetter
  }
}

function bindMethodsToStoreInstance(
  methods: Record<string, (...args: any[]) => void>,
  storeInstance: StateTree,
): void {
  for (const methodName of Object.keys(methods)) {
    const method = methods[methodName]
    storeInstance[methodName] = method.bind(storeInstance)
  }
}

const stavueSymbol: InjectionKey<Stavue> = Symbol('stavue')

export function createStavue(): Stavue & { install: (app: App) => void } {
  const stavue: Stavue = {
    activeStores: new Map<string, StateTree>(),
  }

  const stavueWithInstall = Object.assign(stavue, {
    install(app: App) {
      app.provide(stavueSymbol, stavue)
    },
  })

  return stavueWithInstall
}

export function defineStore<
  S extends StateTree,
  A extends ActionsTree,
  G extends GettersTree<S>,
>(
  id: string,
  options: StoreOptions<S, A, G>,
): StoreDefinition<S, A, G> {
  const useStore = (): UseStoreReturnType<S, A, G> => {
    const stavue = inject(stavueSymbol)

    if (!stavue) {
      throw new Error(
        `[Stavue] Could not find stavue instance. Did you forget to call "app.use(stavue)"?`,
      )
    }

    const { activeStores } = stavue

    if (!activeStores.has(id)) {
      const storeInstance: StateTree = {}
      const {
        state,
        actions = {},
        getters = {},
      } = options

      const initialState = state()

      const defaultState = structuredClone(initialState)
      const reactiveState = reactive(initialState)

      const _subscriptions: Array<(...args: any[]) => void> = []

      const _methods = {
        $reset: () => {
          for (const key of Object.keys(reactiveState)) {
            if (!Object.prototype.hasOwnProperty.call(defaultState, key)) {
              delete reactiveState[key]
            }
          }

          Object.assign(reactiveState, defaultState)
        },
        $subscribe: (callback: (...args: any[]) => void): () => void => {
          _subscriptions.push(callback)
          const unsubscribe = (): void => {
            const index = _subscriptions.findIndex(fn => fn === callback)
            if (index !== -1) {
              _subscriptions.splice(index, 1)
            }
          }

          return unsubscribe
        },
      }

      bindActionsToStoreInstance(actions, storeInstance)
      assignStateToStoreInstance(reactiveState, storeInstance)
      bindGettersToStoreInstance(
        (getters as GettersTree<StateTree>),
        reactiveState,
        storeInstance,
      )
      bindMethodsToStoreInstance(_methods, storeInstance)

      watch(reactiveState, (newState) => {
        _subscriptions.forEach((callback) => {
          callback({
            storeId: id,
            type: 'direct',
          }, newState)
        })
      }, {
        deep: true,
        flush: 'sync',
      })

      activeStores.set(id, storeInstance)
    }

    return activeStores.get(id) as S
      & A
      & GettersAsProperties<G>
      & ToRefs<S>
      & { $reset: () => void }
  }

  return useStore
}
