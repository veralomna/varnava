import { onBeforeUnmount } from "vue"

export interface KeyCombo {
    key : string
    handler : CallableFunction
}

let useKeyDown = (keyCombos : KeyCombo[]) => {
    let onKeyDown = (event : KeyboardEvent) => {
        let kc = keyCombos.find(kc => kc.key === event.key)

        if(kc) {
            kc.handler()
        }
    }

    window.addEventListener("keydown", onKeyDown)

    onBeforeUnmount(() => {
        window.removeEventListener("keydown", onKeyDown)
    })
};

export default useKeyDown