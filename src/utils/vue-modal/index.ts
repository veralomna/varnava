import { App, provide, inject, h, render } from "vue"
import { AlertInfo, AlertAction, Alert } from "./Alert"

export { default as Modal } from "./Modal"
export type { AlertInfo, AlertAction } from "./Alert"
export { AlertActionCancel, AlertActionOkay } from "./Alert"

export type AnyVueModalComponent = Function | any

export class VueModalStore { 
    modals: AnyVueModalComponent[] = []
    zIndex: number = 100000

    app: App | null = null

    install(app : App) {
        this.app = app
    }

    present<T>(component : AnyVueModalComponent, props : { [key : string] : any }): Promise<T | null> {
        const $this = this

        return new Promise((resolve) => {
            if (!this.app) {
                resolve(null)
            }

            const instance = h(component, {
                ...props,
                finish: (data : Object) => {
                    $this.dismiss()
                    resolve(data as T)
                },
                modal: $this,
            })
            
            this.zIndex += 1

            const container = document.createElement("div") 
            container.setAttribute("data-modal-index", this.zIndex.toString())

            document.body.children[0].appendChild(container)

            render(instance, container)
            
            this.modals.push(instance)
        })
    }

    presentAlert(info : AlertInfo): Promise<AlertAction | null> {
        return this.present(Alert, { info })
    }

    dismiss() {
        if (this.modals.length === 0) {
            return
        }

        const container = document.body.children[0].querySelector(`[data-modal-index="${this.zIndex}"]`)

        if (container === null) {
            return
        }

        render(null, container)
        container.parentElement?.removeChild(container)

        this.zIndex--
        this.modals.pop()
    }
}

const modalSymbol = Symbol("vue-modal-store")
const modalStore = new VueModalStore()

export const provideModal = (app : App) => {
    modalStore.install(app)
    provide<VueModalStore>(modalSymbol, modalStore)
}

export const useModal = (): VueModalStore => {
    const modalStore = inject<VueModalStore>(modalSymbol)

    if (!modalStore) {
        throw new Error("No Modal component provided.")
    }

    return modalStore
}
