# Stavue

![npm](https://img.shields.io/npm/v/stavue) ![license](https://img.shields.io/npm/l/stavue)

A lightweight, modern, and fully-typed state manager for Vue 3, inspired by Pinia.

---

[**Русская версия**](#-русская-версия) | [**English Version**](#-english-version)

---

## <a name="english-version">🇬🇧 English Version</a>

### Why Stavue?

Stavue is designed to be a minimal, modular, and fully typed alternative for state management in Vue 3 applications. If you appreciate the Composition API-like syntax of Pinia but need a lightweight core or want to build upon a simple foundation, Stavue is for you.

### Features

*   ✅ **Intuitive API:** A `defineStore` syntax that feels familiar.
*   ✅ **Full TypeScript Support:** Provides excellent autocompletion and type safety.
*   ✅ **State, Getters, Actions:** The classic trio for structured state management.
*   ✅ **Direct State Mutation:** Change state directly or through actions.
*   ✅ **Built-in Methods:** Includes `$reset()` and `$subscribe()` out-of-the-box.
*   ✅ **Extensible via Plugins:** Add global functionality with a simple and powerful plugin system.
*   ✅ **Lightweight:** A minimal core with no external dependencies besides Vue.

### Installation

```bash
npm install stavue
```

### Quick Start

#### 1. Create a Stavue instance

In your `main.ts` file, create and install the Stavue instance.

```typescript
// main.ts
import { createApp } from 'vue'
import { createStavue } from 'stavue'
import App from './App.vue'

// Create a Stavue instance
const stavue = createStavue()

const app = createApp(App)
app.use(stavue) // Install the plugin
app.mount('#app')
```

#### 2. Define a Store

Create a file to define your store.

```typescript
// stores/counter.ts
import { defineStore } from 'stavue'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'My Counter',
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
    add(amount: number) {
      this.count += amount
    },
  },
})
```

#### 3. Use the Store in a Component

Now you can use the store in any component.

```vue
<template>
  <div>
    <h1>{{ counter.name }}</h1>
    <p>Count: {{ counter.count }}</p>
    <p>Double Count: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">Increment</button>
    <button @click="counter.add(5)">Add 5</button>
    <button @click="counter.$reset()">Reset</button>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '../stores/counter'

const counter = useCounterStore()
</script>
```

### Advanced API

#### `$reset()`

Resets the store's state to its initial value.

```typescript
const store = useMyStore()
store.$reset()
```

#### `$subscribe()`

Subscribes to state changes. The method returns an `unsubscribe` function to stop listening.

```typescript
const store = useMyStore()

const unsubscribe = store.$subscribe((mutation, state) => {
  console.log(`[${mutation.storeId}] State changed:`, state)
}, { deep: true })

// To stop the subscription later
unsubscribe()
```

### Plugin System

Stavue has a powerful plugin system to add global functionality. A plugin is a function that receives the store context.

**Example: A simple localStorage persistence plugin.**

```typescript
// plugins/persistence.ts
import type { PluginContext } from 'stavue'

export function persistencePlugin({ store, id, options }: PluginContext) {
  // Check for a custom option in the store definition
  // @ts-ignore
  if (!options.persist) return

  // Load state from localStorage on initialization
  const savedState = localStorage.getItem(id)
  if (savedState) {
    // You must use a method like $patch or directly mutate
    // to update the state.
    Object.assign(store, JSON.parse(savedState))
  }

  // Subscribe to changes and save them
  store.$subscribe((mutation, state) => {
    localStorage.setItem(id, JSON.stringify(state))
  })
}
```

**Registering the plugin:**

```typescript
// main.ts
import { createStavue } from 'stavue'
import { persistencePlugin } from './plugins/persistence'

const stavue = createStavue({
  plugins: [persistencePlugin],
})
```

**Using the plugin in a store:**

```typescript
// stores/user.ts
import { defineStore } from 'stavue'

export const useUserStore = defineStore('user', {
  // @ts-ignore
  persist: true, // Custom option for our plugin
  state: () => ({
    name: 'Guest',
    isLoggedIn: false,
  }),
  // ...
})
```

---

## <a name="russian-version">🇷🇺 Русская версия</a>

### Почему Stavue?

Stavue спроектирован как минимальная, модульная и полностью типизированная альтернатива для управления состоянием в приложениях Vue 3. Если вам нравится синтаксис Pinia, похожий на Composition API, но нужен легковесный движок или вы хотите создать что-то на простой основе, Stavue — для вас.

### Возможности

*   ✅ **Интуитивный API:** Знакомый синтаксис `defineStore`.
*   ✅ **Полная поддержка TypeScript:** Отличное автодополнение и безопасность типов.
*   ✅ **State, Getters, Actions:** Классическое трио для структурированного управления состоянием.
*   ✅ **Прямое изменение состояния:** Меняйте состояние напрямую или через действия.
*   ✅ **Встроенные методы:** Включает `$reset()` и `$subscribe()` из коробки.
*   ✅ **Расширяемость через плагины:** Добавляйте глобальную функциональность с помощью простой и мощной системы плагинов.
*   ✅ **Легковесность:** Минимальное ядро без внешних зависимостей, кроме Vue.

### Установка

```bash
npm install stavue
```

### Быстрый старт

#### 1. Создайте экземпляр Stavue

В вашем файле `main.ts` создайте и установите экземпляр Stavue.

```typescript
// main.ts
import { createApp } from 'vue'
import { createStavue } from 'stavue'
import App from './App.vue'

// Создаем экземпляр Stavue
const stavue = createStavue()

const app = createApp(App)
app.use(stavue) // Устанавливаем плагин
app.mount('#app')
```

#### 2. Определите хранилище

Создайте файл для определения вашего хранилища.

```typescript
// stores/counter.ts
import { defineStore } from 'stavue'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Мой счётчик',
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
    add(amount: number) {
      this.count += amount
    },
  },
})
```

#### 3. Используйте хранилище в компоненте

Теперь вы можете использовать хранилище в любом компоненте.

```vue
<template>
  <div>
    <h1>{{ counter.name }}</h1>
    <p>Счёт: {{ counter.count }}</p>
    <p>Двойной счёт: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">Увеличить</button>
    <button @click="counter.add(5)">Добавить 5</button>
    <button @click="counter.$reset()">Сбросить</button>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '../stores/counter'

const counter = useCounterStore()
</script>
```

### Продвинутое API

#### `$reset()`

Сбрасывает состояние хранилища до его начального значения.

```typescript
const store = useMyStore()
store.$reset()
```

#### `$subscribe()`

Подписывается на изменения состояния. Метод возвращает функцию `unsubscribe` для прекращения прослушивания.

```typescript
const store = useMyStore()

const unsubscribe = store.$subscribe((mutation, state) => {
  console.log(`[${mutation.storeId}] Состояние изменилось:`, state)
}, { deep: true })

// Чтобы остановить подписку позже
unsubscribe()
```

### Система плагинов

Stavue имеет мощную систему плагинов для добавления глобальной функциональности. Плагин — это функция, которая получает контекст хранилища.

**Пример: Простой плагин для сохранения в `localStorage`.**

```typescript
// plugins/persistence.ts
import type { PluginContext } from 'stavue'

export function persistencePlugin({ store, id, options }: PluginContext) {
  // Проверяем наличие кастомной опции в определении хранилища
  // @ts-ignore
  if (!options.persist) return

  // Загружаем состояние из localStorage при инициализации
  const savedState = localStorage.getItem(id)
  if (savedState) {
    // Вы должны использовать метод, подобный $patch, или напрямую
    // изменять состояние для его обновления.
    Object.assign(store, JSON.parse(savedState))
  }

  // Подписываемся на изменения и сохраняем их
  store.$subscribe((mutation, state) => {
    localStorage.setItem(id, JSON.stringify(state))
  })
}
```

**Регистрация плагина:**

```typescript
// main.ts
import { createStavue } from 'stavue'
import { persistencePlugin } from './plugins/persistence'

const stavue = createStavue({
  plugins: [persistencePlugin],
})
```

**Использование плагина в хранилище:**

```typescript
// stores/user.ts
import { defineStore } from 'stavue'

export const useUserStore = defineStore('user', {
  // @ts-ignore
  persist: true, // Кастомная опция для нашего плагина
  state: () => ({
    name: 'Гость',
    isLoggedIn: false,
  }),
  // ...
})
```

---

## License

[MIT](LICENSE)
