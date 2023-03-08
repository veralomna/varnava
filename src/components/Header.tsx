import { defineComponent } from "vue"
import { useRouter } from "vue-router"
import { useModal } from "@/utils/vue-modal"
import Status from "@/components/Resources/StatusEntryButton"
import Activity from "@/components/Resources/Activity"
import ResourcesModal from "@/components/Resources/ResourcesModal"
import Store from "@/stores/Store"
import { PrerequisitesStatus, prerequisitesStore } from "@/stores/PrerequisitesStore"

export default defineComponent({

    setup() {
        const router = useRouter()
        const modal = useModal()

        const openHome = (event : MouseEvent) => {
            event.preventDefault()
            router.push({ name: "dashboard" })
        }

        const openStatusOverview = (event : MouseEvent) => {
            event.preventDefault()
            modal.present(ResourcesModal, {})
        }

        const minimise = () => {
            window.app.send("minimise");
        }

        const maximise = () => {
            window.app.send("maximise");
        }

        const close = () => {
            window.app.send("close");
        }

        return {
            prerequisitesState : prerequisitesStore.getState(),
            minimise,
            maximise,
            close,
            openHome,
            openStatusOverview
        }

    },

    render() {
        const renderTrafficLights = () => {
            if (Store.isInApp === false) {
                return null
            }

            if (Store.platform !== "win32") {
                return null
            }

            return <div style="-webkit-app-region: no-drag;" class="flex gap-2 ml-6 text-2xl z-[100000]">
                <button onClick={this.minimise} class="cursor-default hover:bg-gray-800 hover:text-white text-gray-500 w-7 h-7 flex items-center justify-center">
                    <span class="relative bottom-[0px]">&ndash;</span>
                </button>
                <button onClick={this.maximise} class="cursor-default hover:bg-gray-800 hover:text-white text-gray-500 w-7 h-7 flex items-center justify-center">
                    <span class="relative bottom-[4px]">□</span>
                </button>
                <button onClick={this.close} class="cursor-default hover:bg-red-700 hover:text-white text-gray-500 w-7 h-7 flex items-center justify-center">
                    <span class="relative bottom-[3px] left-[-1px] text-3xl">×</span>
                </button>
            </div>
        }

        const renderStatus = () => {
            if (Store.isInApp === true && this.prerequisitesState.status !== PrerequisitesStatus.running) {
                return null
            }

            return <Status class="z-10" style="-webkit-app-region: no-drag;" onClick={this.openStatusOverview} />
        }

        const renderQueueStatus = () => {
            if (Store.isInApp === true && this.prerequisitesState.status !== PrerequisitesStatus.running) {
                return null
            }

            return <Activity class="ml-auto mr-3 z-10" style="-webkit-app-region: no-drag;" />
        }

        return <header style="-webkit-app-region: drag;" class="backdrop-blur-md bg-neutral-900/[.9] w-full pb-2 px-6 fixed z-[10000] pt-2 flex box-border select-none">
            <div class= {Store.platform === "darwin" ? "w-full" : ""} />
            <h1 class="font-semibold text-xl uppercase font-display tracking-wide">
                <a style="-webkit-app-region: no-drag;" class="transition drop-shadow-md hover:drop-shadow-2xl duration-500 hover:scale-105 hover:opacity-75" onClick={this.openHome} href="#">Varnava</a>
            </h1>
            <div class={`flex ${Store.platform === "darwin" ? "w-full" : "ml-auto"}`}>
                {renderQueueStatus()}
                {renderStatus()}
                {renderTrafficLights()}
            </div>
        </header> 
    }

})