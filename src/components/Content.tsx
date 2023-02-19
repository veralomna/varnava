import { RouterView, useRouter } from "vue-router"
import { defineComponent } from "vue"
import Store from "@/stores/Store"
import { PrerequisitesStatus, prerequisitesStore } from "@/stores/PrerequisitesStore"
import LinearProgress from "./Shared/LinearProgress"

export default defineComponent({

    setup(props, ctx) {
        prerequisitesStore.fetch()

        const timer = setInterval(() => {
            prerequisitesStore.fetch()
        }, 1000)

        return {
            prerequisitesState : prerequisitesStore.getState(),
            timer
        }
    },

    beforeUnmount() {
        clearInterval(this.timer)
    },    

    render() {
        const renderLoadingLabel = () => {
            switch (this.prerequisitesState.status) {

            case PrerequisitesStatus.loading:
                return "Checking for dependencies"

            case PrerequisitesStatus.downloadingExecutables:
                return "Preparing runtime"

            case PrerequisitesStatus.preparingEnvironment:
                return "Preparing environment"

            case PrerequisitesStatus.downloadingDependencies:
                return "Downlading dependencies"

            case PrerequisitesStatus.launchingServer:
                return "Loading application"

            case PrerequisitesStatus.running:
                return "All set and ready to go"

            }
        }

        const renderLoadingDescription = () => {
            switch (this.prerequisitesState.status) { 

            case PrerequisitesStatus.downloadingDependencies:
                return "Depending on the connection speed, this might take a while."

            case PrerequisitesStatus.downloadingExecutables:
                return "Depending on the connection speed, this might take a while."

            default:
                return null

            }
        }

        const renderLoadingStatus = () => {
            return <article class="select-none flex flex-col items-leading justify-center w-full h-full px-16 gap-4">
                <div class="text-xl flex items-center justify-between">
                    {renderLoadingLabel()} 
                    <span class="font-mono">{Math.round(this.prerequisitesState.progress*100)}%</span>
                </div>
                <LinearProgress class="w-full" value={this.prerequisitesState.progress} /> 
                <div class="opacity-50">{renderLoadingDescription()}</div>
            </article>
        }

        const renderContent = () => {
            if (Store.isInApp === false) {
                return <RouterView />
            }
    
            if (this.prerequisitesState.status !== PrerequisitesStatus.running) {
                return renderLoadingStatus()
            }
            else {
                return <RouterView />
            }
        }

        return (
            <main class={`h-full w-full pb-8 px-6 ${Store.isInApp === true ? "pt-0" : "pt-4"}`}>
               {renderContent()}
            </main>
        )
    }

})