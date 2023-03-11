import { defineComponent } from "vue"

export default defineComponent({

    props: {
        title: {
            type: String,
            required: true
        },

        class: {
            type: String,
            required: false
        },

        close: {
            type: Function,
            required: true
        },

        showsCloseButton: {
            type: Boolean,
            required: false,
            default: true,
        },
        
        closableWithBackground: {
            type: Boolean,
            required: false,
            default: true
        },

        preserveContentSize: {
            type: Boolean,
            required: false,
            default: true
        }
    },

    setup(props, context) {
      
        const closeModal = (event : MouseEvent) => {
            event.preventDefault()

            const target = event.target as HTMLElement

            if (target === null) {
                return
            }
            
            if (target.closest("[data-modal-index]") === null) {
                return
            }

            if ((target as Element).getAttribute("data-closable")) {
                props.close()
                return
            } 

            if ((target as Element).getAttribute("data-closable-background") && props.closableWithBackground === true) {
                props.close()
                return
            }
        }

        return () => {
            const minWidth = props.preserveContentSize === true ? "" : "min-w-1/2"
            const modalClass = `border-box text-white bg-neutral-800 rounded-xl p-6 shadow-lg ${minWidth} ${props.class || ""}`

            if (typeof context.slots.default === "undefined") {
                return null
            }

            return <div data-closable-background onClick={closeModal} class="z-[10000] fixed inset-0 bg-black bg-opacity-50 flex items-center backdrop-blur-sm justify-center">
                <div class={modalClass}>
                    <h2 class="flex items-center font-medium text-xl tracking-normal pb-2 select-none">
                        <span class="pr-8">{props.title}</span> 
                        {props.showsCloseButton && (
                            <span data-closable onClick={closeModal} class="font-bold ml-auto hover:text-white text-gray-500 cursor-pointer">✕</span>
                        )}
                    </h2>
                    <div>
                        {context.slots.default()}
                    </div>
                </div>
            </div>
        }
    }
})