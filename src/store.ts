import type { Reactive, WatchHandle } from 'vue'
import type {
  ActionsTree,
  GettersTree,
  StateTree,
  Stavue,
  StoreDefinition,
  StoreOptions,
  SubscriptionCallback,
  Unsubscribe,
  UseStoreReturnType,
} from './types'
import { computed, inject, reactive, toRefs, watch } from 'vue'
import { stavueSymbol } from './createStavue'

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

/**
 * Определяет новое хранилище Stavue.
 *
 * @param id - Уникальный идентификатор хранилища.
 * @param options - Объект с опциями: `state`, `actions`, `getters`.
 * @returns Функция-хук для использования хранилища в компонентах.
 */
export function defineStore<
  S extends StateTree,
  A extends ActionsTree,
  G extends GettersTree<S>,
>(
  id: string,
  options: StoreOptions<S, A, G>,
): StoreDefinition<S, A, G> {
  const useStore = (): UseStoreReturnType<S, A, G> => {
    const stavue = inject(stavueSymbol) as Stavue

    if (!stavue) {
      throw new Error(
        `[Stavue] Could not find stavue instance. Did you forget to call "app.use(stavue)"?`,
      )
    }

    if (!stavue.activeStores.has(id)) {
      const store = setupStore(id, options, stavue)
      stavue.activeStores.set(id, store)
    }

    return stavue.activeStores.get(id) as UseStoreReturnType<S, A, G>
  }

  return useStore
}

/**
 * Внутренняя функция для создания и настройки экземпляра хранилища.
 * @internal
 */
export function setupStore<
  S extends StateTree,
  A extends ActionsTree,
  G extends GettersTree<S>,
>(id: string, options: StoreOptions<S, A, G>, stavue: Stavue): StateTree {
  const storeInstance: StateTree = {}
  const {
    state,
    actions = {},
    getters = {},
  } = options

  const { plugins } = stavue

  const initialState = state()

  const defaultState = structuredClone(initialState)
  const reactiveState = reactive(initialState)

  const _subscriptions: Array<(...args: any[]) => void> = []
  let _stopWatcher: WatchHandle | undefined

  const _methods = {
    $reset: () => {
      for (const key of Object.keys(reactiveState)) {
        if (!Object.prototype.hasOwnProperty.call(defaultState, key)) {
          delete reactiveState[key]
        }
      }

      Object.assign(reactiveState, defaultState)
    },
    $subscribe: (callback: SubscriptionCallback<S>): Unsubscribe => {
      _subscriptions.push(callback)

      if (!_stopWatcher) {
        _stopWatcher = watch(reactiveState, (newState) => {
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
      }

      const unsubscribe = (): void => {
        const index = _subscriptions.indexOf(callback)

        if (index > -1) {
          _subscriptions.splice(index, 1)

          if (_subscriptions.length === 0 && _stopWatcher) {
            _stopWatcher()
            _stopWatcher = undefined
          }
        }
      }

      return unsubscribe
    },
  }

  if (actions) {
    bindActionsToStoreInstance(actions, storeInstance)
  }
  assignStateToStoreInstance(reactiveState, storeInstance)
  if (getters) {
    bindGettersToStoreInstance(
      (getters as GettersTree<StateTree>),
      reactiveState,
      storeInstance,
    )
  }
  bindMethodsToStoreInstance(_methods, storeInstance)

  if (plugins) {
    plugins.forEach((plugin) => {
      plugin({
        store: storeInstance as any,
        id,
        options,
        app: stavue.app,
      })
    })
  }

  return storeInstance
}
