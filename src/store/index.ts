import type { App } from 'vue'
import { createPinia,defineStore } from 'pinia'

export const store = createPinia()

export function setupStore(app: App) {
  app.use(store)
}

export const useMyStore = defineStore('myStore',{
  state: () => ({
    globalAmount: 0,
  }), actions: {
    changeAmount(amount: number) {
      this.globalAmount = amount
    },
  },
})

export * from './modules'
