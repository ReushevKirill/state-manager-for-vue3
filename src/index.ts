import type { App, ComputedRef, InjectionKey, Reactive, ToRefs } from 'vue'
import { computed, inject, reactive, toRefs } from 'vue'

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

export type StoreDefinition<
  S extends StateTree,
  A extends ActionsTree,
  G,
> = () => S & A & GettersAsProperties<G> & ToRefs<S>

export interface PiniaPlugin {
  activeStores: Map<string, StateTree>
  install: (app: App) => void
}

export interface Pinia {
  activeStores: Map<string, StateTree>
}

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

const piniaSymbol: InjectionKey<Pinia> = Symbol('pinia')

export function createPinia(): Pinia & { install: (app: App) => void } {
  const pinia: Pinia = {
    activeStores: new Map<string, StateTree>(),
  }

  const piniaWithInstall = Object.assign(pinia, {
    install(app: App) {
      app.provide(piniaSymbol, pinia)
    },
  })

  return piniaWithInstall
}

export function defineStore<
  S extends StateTree,
  A extends ActionsTree,
  G extends GettersTree<S>,
>(
  id: string,
  options: StoreOptions<S, A, G>,
): StoreDefinition<S, A, G> {
  const useStore = (): S & A & GettersAsProperties<G> & ToRefs<S> => {
    const pinia = inject(piniaSymbol)

    if (!pinia) {
      throw new Error(
        `[Pinia] Could not find pinia instance. Did you forget to call "app.use(pinia)"?`,
      )
    }

    const { activeStores } = pinia

    if (!activeStores.has(id)) {
      const storeInstance: StateTree = {}
      const state = reactive(options.state())
      const actions = options.actions || ({} as A)
      const getters = options.getters || ({} as G)

      bindActionsToStoreInstance(actions, storeInstance)
      assignStateToStoreInstance(state, storeInstance)
      bindGettersToStoreInstance((getters as GettersTree<StateTree>), state, storeInstance)

      activeStores.set(id, storeInstance)
    }

    return activeStores.get(id) as S & A & GettersAsProperties<G> & ToRefs<S>
  }

  return useStore
}
