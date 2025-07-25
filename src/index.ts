// src/index.ts
import type { ComputedRef, Reactive, ToRefs } from 'vue'
import { computed, reactive, toRefs } from 'vue'

export type StateTree = Record<string, any>
export type ActionsTree = Record<string, (...args: any[]) => any>
// Обновляем тип геттера: он может принимать state, а `this` будет сам стор.
export type GettersTree<S extends StateTree> = Record<string, (state: S | S & ToRefs<S>) => any>

// УТИЛИТАРНЫЙ ТИП: Превращает объект с функциями-геттерами в объект со свойствами.
// { doubleCount: () => number } => { doubleCount: number }
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

// ОБНОВЛЕННЫЙ ТИП: Теперь включает и геттеры!
export type StoreDefinition<
  S extends StateTree,
  A extends ActionsTree,
  G,
> = () => S & A & GettersAsProperties<G> & ToRefs<S>

const activeStores = new Map<string, StateTree>()

// ... функции bindActions и assignState остаются без изменений ...
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

// ИЗМЕНЕНАЯ ФУНКЦИЯ: Добавляем .call для правильного `this`
function bindGettersToStoreInstance(
  getters: GettersTree<StateTree>,
  state: Reactive<StateTree>,
  storeInstance: StateTree,
): void {
  for (const getterName of Object.keys(getters)) {
    const getter = getters[getterName]
    // Создаем computed, но вызываем оригинальный геттер с контекстом `storeInstance`.
    // Теперь внутри геттера `this` будет указывать на стор.
    const computedGetter = computed(() => getter.call(storeInstance, state))
    // Важно: мы присваиваем сам computed-объект. Vue распакует .value автоматически.
    storeInstance[getterName] = computedGetter
  }
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
    if (!activeStores.has(id)) {
      const storeInstance: StateTree = {}
      const state = reactive(options.state())
      const actions = options.actions || ({} as A)
      const getters = options.getters || ({} as G)

      // Порядок важен: сначала привязываем actions, чтобы геттеры могли их вызывать
      bindActionsToStoreInstance(actions, storeInstance)
      // Затем состояние, чтобы и actions, и getters имели к нему доступ
      assignStateToStoreInstance(state, storeInstance)
      // И в конце геттеры, которые могут зависеть от всего вышеперечисленного
      bindGettersToStoreInstance(getters, state, storeInstance)

      activeStores.set(id, storeInstance)
    }

    return activeStores.get(id) as S & A & GettersAsProperties<G> & ToRefs<S>
  }

  return useStore
}
