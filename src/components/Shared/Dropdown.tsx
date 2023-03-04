import { defineComponent, HTMLAttributes, ref, Transition, VNode, Fragment } from "vue"
import { ChevronDownIcon, CheckIcon } from "@heroicons/vue/24/outline"

export interface Props extends HTMLAttributes {
    title? : string
    isSelected? : boolean
    value : any
}
  
export const DropdownItem = (props : Props, context: { slots: { default: any } }) => {
    const isSelected = props.isSelected ?? false
    const title = props.title ?? ""

    const renderContent = () => {
        if (typeof context.slots.default !== "function") {
            return <div class={`px-3 py-2 ${isSelected === true ? "font-semibold" : ""} flex items-center justify-between`}>
                {title}
                {isSelected === true ? <CheckIcon class="w-4 h-4" /> : null}
            </div>
        }
        
        return context.slots.default()
    }

    return <div>
        {renderContent()}
    </div>
}

export default defineComponent({

    props: {
        title : {
            type : String,
            required : true
        },
        onChange : {
            type : Function,
            required : false
        }
    },

    setup(props, ctx) {
        const isVisible = ref(false)

        const toggle = (event : MouseEvent) => {
            event.preventDefault()

            isVisible.value = !isVisible.value
        }

        const select = (item : VNode) => {
            const itemProps = item.props as Props

            props.onChange?.(itemProps.value)
            isVisible.value = false
        }

        const onDocumentClick = (event : MouseEvent) => {
            const target = event.target as HTMLElement

            if (target.closest("[data-dropdown-title]") !== null) {
                return
            }

            if (target.closest("[data-dropdown-contents]") !== null) {
                return
            }

            isVisible.value = false
        }

        document.addEventListener("click", onDocumentClick)

        return {
            isVisible,
            toggle,
            select,
            onDocumentClick
        }
    },

    beforeUnmount() {
        document.removeEventListener("click", this.onDocumentClick)
    },

    render() {
        const renderList = () => {
            let items : VNode[] = []

            if (typeof this.$slots.default === "function") {
                for (const item of this.$slots.default()) {
                    if (item.type === Fragment) {
                        for (const child of item.children) {
                            items.push(child)
                        }
                    }
                    else {
                        items.push(item)
                    }
                }
            }
            if (this.isVisible === false) {
                return null
            }

            return <div data-dropdown-contents={true} class="absolute left-0 right-0 max-h-64 overflow-scroll shadow-2xl" style="overflow: overlay;">
                <ul class="bg-gray-800 rounded-bl rounded-br divide-y divide-gray-500/10 border-t border-gray-500/10 text-sm truncate">
                    {items.map(item => {
                        return <li onClick={() => this.select(item)} class="hover:bg-gray-700/50">
                            {item}
                        </li>
                    })}
                </ul>
            </div>
        }

        return <div class="relative w-full text-white select-none">
            <div data-dropdown-title={true} onClick={this.toggle} class={`transition w-full cursor-default flex items-center justify-between text-sm px-3 py-2 ${this.isVisible === false ? "rounded bg-gray-700 hover:bg-gray-600" : "rounded-tl rounded-tr bg-gray-800"} drop-shadow-sm duration-300 text-white`}>
                {this.title}
                <ChevronDownIcon class={`w-4 h-4 transition ${this.isVisible === true ? "rotate-180" : ""}`} />
            </div>
            <Transition name="fade">
                {renderList()}
            </Transition>
        </div>
    }

})