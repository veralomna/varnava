import { ButtonHTMLAttributes, defineComponent } from "vue"
import { resourcesStore } from "@/stores/ResourcesStore"
import StatusEntry from "./StatusEntry"

export interface Props extends ButtonHTMLAttributes {

}

export default defineComponent({

    setup(props : Props, ctx) {
        resourcesStore.fetch()
        
        const timer = setInterval(() => {
            resourcesStore.fetch()
        }, 1000)

        return {
            statusState : resourcesStore.getState(),
            status : resourcesStore.status,
            timer
        }
    },

    beforeUnmount() {
        clearInterval(this.timer)
    },

    render() {
        return <div class="flex items-center py-[6.5px] px-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-100 text-xs font-semibold cursor-pointer">
            <StatusEntry />
        </div>
    }

})