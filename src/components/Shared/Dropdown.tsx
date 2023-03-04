import { defineComponent, ref, VNode } from "vue"
import { ChevronDownIcon } from "@heroicons/vue/24/solid"

export default defineComponent({

    props: {
        title : {
            type: String,
            required: true
        }
    },

    setup(props, ctx) {
        const isVisible = ref(true)

        let items : VNode[] = []

        if (typeof ctx.slots.default === "function") {
            items = ctx.slots.default()
        }

        return {
            isVisible,
            items
        }
    },

    render() {
        const renderList = () => {
            if (this.isVisible === false) {
                return null
            }

            return <div class="absolute left-0 right-0 max-h-64 overflow-scroll" style="overflow: overlay;">
                <ul class="bg-gray-700 rounded divide-y divide-gray-600 text-sm truncate">
                    {this.items.map(item => {
                        return <li class="px-4 py-2">
                            {item}
                        </li>
                    })}
                </ul>
            </div>
        }

        return <div class="relative w-full text-white">
            <div class="w-full cursor-default flex items-center justify-between text-sm px-4 py-2 rounded drop-shadow-md bg-gray-700 duration-300 hover:bg-gray-600 focus:bg-gray-600 text-white">
                {this.title}
                <ChevronDownIcon class="w-4 h-4" />
            </div>
            {renderList()}
            {/* <ul>
                {this.$slots.default()}
            </ul> */}
        </div>
    }

})