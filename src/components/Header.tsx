import { defineComponent } from "vue"
import { useRouter } from "vue-router"
import { useModal } from "@/stores/vue-modal"
import Status from "@/components/Resources/StatusEntryButton"
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
        const headerClassName = `backdrop-blur-md bg-neutral-900/[.9] w-full pb-2 px-6 fixed z-[10000] flex flex-row items-center pt-2 box-border select-none`

        const renderTrafficLights = () => {
            if (Store.isInApp === false) {
                return null
            }

            return <div style="-webkit-app-region: no-drag;" class="flex gap-2 ml-6 text-2xl">
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

            return <Status style="-webkit-app-region: no-drag;" onClick={this.openStatusOverview} />
        }

        return <header style="-webkit-app-region: drag;" class={headerClassName}>
            <h1 style="-webkit-app-region: no-drag;" class="mr-auto font-semibold text-xl uppercase font-display tracking-wide"><a onClick={this.openHome} href="#">Varnava</a></h1>
            {renderStatus()}
            {renderTrafficLights()}
        </header> 
    }

})