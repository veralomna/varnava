import { ButtonHTMLAttributes, defineComponent } from "vue"
import { RemoteResourceStatus, resourcesStore } from "@/stores/ResourcesStore"
import Spinner from "@/components/Shared/Spinner"

export interface Props extends ButtonHTMLAttributes {
    isDetailed : boolean
}

export default defineComponent({

    props: {
        isDetailed: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    setup(props : Props, ctx) {
        resourcesStore.fetch()
        
        return {
            statusState : resourcesStore.getState(),
            status : resourcesStore.status,
        }
    },

    render() {
        const renderStatusIndicator = () => {
            let color = "" 

            switch (this.status) {
                
                case RemoteResourceStatus.unknown:
                    color = "bg-red-500"
                    break

                case RemoteResourceStatus.needToLoad:
                    color = "bg-red-500"
                    break

                case RemoteResourceStatus.loading:
                    color = "bg-yellow-500"
                    break

                case RemoteResourceStatus.ready:
                    color = "bg-teal-400"
                    break

            }

            if (this.status === RemoteResourceStatus.loading) {
                return <Spinner class="w-4 h-4 mr-2 inline fill-yellow-500" />
            }
            else {
                return <span class={`inline-block w-3 h-3 rounded-full mr-2 ${color}`}></span>
            }
        }

        const renderStatusLabel = () => {
            switch (this.status) {

                case RemoteResourceStatus.unknown:
                    return this.isDetailed == true ? "Cannot connect to resource manager server." : "No Server Connection"
                
                case RemoteResourceStatus.needToLoad:
                    return this.isDetailed == true ? "Waiting to load models from remote server." : "Waiting To Download"

                case RemoteResourceStatus.loading:
                    return this.isDetailed == true ? "Model files are being loaded from remote server." : "Downloading Models"

                case RemoteResourceStatus.ready:
                    return this.isDetailed == true ? "All model files have been downloaded." : "Models Ready"

            }
        }

        return <div class="flex items-center">
            {renderStatusIndicator()}
            {renderStatusLabel()}
        </div>
    }

})