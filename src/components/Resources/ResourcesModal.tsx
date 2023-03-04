import { defineComponent, ref } from "vue"
import { AlertActionOkay, Modal } from "@/utils/vue-modal"
import { Button } from "@/components/Shared"
import { RemoteResourceStatus, RemoteResource, resourcesStore, DataPathUpdateStatus } from "@/stores/ResourcesStore"
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline"
import StatusEntry from "./StatusEntry"
import Store from "@/stores/Store"
import Multiselect from "vue-multiselect" 

export default defineComponent({

    props: {
        finish : {
            type: Function,
            required: true,
        },
        modal : Object
    },

    setup(props) {
        resourcesStore.fetch()

        const selectedModelPath = ref(resourcesStore.getState().models[0].path)
        const selectedDataPath = ref(resourcesStore.getState().dataPath)
        
        const startDownloading = async (event : Event) => {
            event.preventDefault()
            resourcesStore.startDownloading()
        }

        const stopDownloading = async (event : Event) => {
            event.preventDefault()
            resourcesStore.stopDownloading()
        }

        const confirmDataPath = async (event : MouseEvent) => {
            event?.preventDefault()

            const result = await resourcesStore.updateDataPath(selectedDataPath.value)

            switch (result) {

            case DataPathUpdateStatus.updated:
                break

            case DataPathUpdateStatus.pathNotFound:
        
                await props.modal.presentAlert({
                    title: "Cannot find path specified",
                    description: `Make sure ${selectedDataPath.value} exists on your file system.`,
                    actions: [
                        AlertActionOkay
                    ],
                })

                break

            case DataPathUpdateStatus.pathNotDirectory:
                await props.modal.presentAlert({
                    title: "Specified path is not a directory",
                    description: `Make sure ${selectedDataPath.value} is a directory where the files will be stored.`,
                    actions: [
                        AlertActionOkay
                    ],
                })
                
                break

            }
        }

        const browseDataPath = async (event : MouseEvent) => {
            event?.preventDefault()

            const path = await window.app.showOpenFileDialog()

            if (typeof path === "undefined") {
                return
            }

            selectedDataPath.value = path
            await resourcesStore.updateDataPath(path)
        }

        const updateCurrentDataPath = (event : InputEvent) => {
            const target = event.target as HTMLInputElement
            selectedDataPath.value = target.value
        }

        const updateSelectedModelPath = (event : Event) => {
            event.preventDefault()

            const target = event.target as HTMLSelectElement
            selectedModelPath.value = target.value
        }

        const confirmSelectedModelPath = async () => {
            await resourcesStore.updatePreviewModel(selectedModelPath.value)
        }

        const openModelLink = (event : Event) => {
            if (Store.isInApp === true) {
                window.app.open(`http://huggingface.co/${selectedModelPath.value}`)
            }
            else {
                window.open(`http://huggingface.co/${selectedModelPath.value}`, "_blank")
            }
        }

        const close = async (event : Event) => {
            event.preventDefault()
            props.finish(null)
        }

        return {
            resourcesState : resourcesStore.getState(),
            status : resourcesStore.status,
            currentDataPath: selectedDataPath,
            selectedModelPath,
            updateSelectedModelPath,
            confirmSelectedModelPath,
            browseDataPath,
            updateCurrentDataPath,
            startDownloading,
            stopDownloading,
            confirmDataPath,
            openModelLink,
            close
        }
    },

    render() {
        const renderResourceInfo = (resource : RemoteResource) => {
            const formatBytes = (x : number) => {
                const units = ["B", 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                
                let l = 0, n = parseInt(x.toString(), 10) || 0
            
                while (n >= 1024 && ++l) {
                    n = n/1024
                }
              
                return(n.toFixed(n < 10 && l > 0 ? 2 : 2) + units[l])
            }
            
            const colorForProgress = (progress : number): string => {
                if (progress < 1) {
                    return "text-yellow-500"
                }
                else {
                    return "text-teal-500"
                }
            }

            const renderProgressInfo = () => {
                if (progress == 1) {
                    return <span>
                        {formatBytes(resource.downloaded_file_bytes)}
                    </span>
                }

                return `${formatBytes(resource.downloaded_file_bytes)}/${formatBytes(resource.total_file_bytes)}`
            }

            const progress = resource.downloaded_file_bytes / resource.total_file_bytes
            const progressPercent = Math.round(progress * 100)

            return <div class="py-4 font-mono text-sm">
                <div class="flex">
                    <span>
                        {resource.name} <span class="text-xs opacity-50">{resource.path}</span>
                    </span>
                    <span class={`ml-auto font-medium ${colorForProgress(progress)}`}>
                        {renderProgressInfo()}
                    </span>
                </div>
                <div class="mt-2">
                    <div class="relative w-full h-3 bg-neutral-600 rounded overflow-hidden">
                        <span style={`width:${progressPercent}%`} class="transition-all animate-pulse bg-blue-600 absolute top-0 left-0 bottom-0"></span>
                    </div>
                </div>
            </div>
        }

        const renderAllResourcesInfo = () => {
            if (this.status === RemoteResourceStatus.unknown) {
                return null
            }
            
            const bytes = this.resourcesState.models.reduce((result, next) => {
                result.downloaded_file_bytes += next.downloaded_file_bytes
                result.total_file_bytes += next.total_file_bytes
                return result
            }, { total_file_bytes: 0, downloaded_file_bytes: 0 })

            const cumulativeResource : RemoteResource = {
                name: "All Models",
                path: "",
                downloaded_file_bytes: bytes.downloaded_file_bytes,
                total_file_bytes: bytes.total_file_bytes,
                revision: ""
            }

            return <ul>
                {this.resourcesState.models.map(resource => {
                    return <li>
                        {renderResourceInfo(resource)}
                    </li> 
                })}
                <li class="border-t border-neutral-700 mt-2">
                   {renderResourceInfo(cumulativeResource)} 
                </li>
            </ul>
        }
        
        const renderAction = () => {
            if (this.status === RemoteResourceStatus.unknown) {
                return null
            }

            if (this.status === RemoteResourceStatus.ready) {
                return null
            }
            else {
                if (this.resourcesState.isDownloading === false) {
                    return <Button onClick={this.startDownloading}
                                    class="ml-auto text-green-600 border-green-600"
                                    title="Start Downloading" />
                }
                else {
                    return <Button onClick={this.stopDownloading}
                                    class="ml-auto"
                                    title="Pause Downloading" />
                }
            }
        }

        const renderDataPathInfo = () => {
            if (this.status === RemoteResourceStatus.unknown) {
                return null
            }

            if (Store.platform === "darwin") {
                return null
            }

            const renderDataPathSelector = () => {
                if (Store.isInApp === false) {
                    return <div class="flex items-center">
                        <input onInput={this.updateCurrentDataPath} 
                                value={this.currentDataPath} 
                                class="block w-full focus:outline-none bg-gray-700 py-1.5 px-4 rounded" />
                    
                        <Button onClick={this.confirmDataPath}
                                class="ml-4 shrink-0"
                                disabled={this.currentDataPath === this.resourcesState.dataPath || this.currentDataPath.length === 0}
                                title="Update" />
                    </div>
                }
                else {
                    return <div class="flex items-center">
                        <input  disabled={true}
                                value={this.currentDataPath} 
                                class="block w-full focus:outline-none bg-gray-700 py-1.5 px-4 rounded" />
                    
                        <Button onClick={this.browseDataPath}
                                class="ml-4 shrink-0"
                                title="Browse" />
                    </div>
                }
            }

            return <div class="pb-4 border-b border-neutral-700 mb-2">
                <h3 class="opacity-50 pb-2">Models And Outputs Storage Location:</h3>
                {renderDataPathSelector()}
            </div>
        }

        const renderModelSelector = () => {
            return <div class="pb-2 border-b border-neutral-700">
                 <h3 class="opacity-50 pb-2">Preview Model Configuration</h3>
                 <div class="flex gap-4">
                    <select onChange={this.updateSelectedModelPath} class="w-full text-sm pl-2 border-r-[10px] border-neutral-500/0 rounded drop-shadow-md bg-gray-700 duration-300 hover:bg-gray-600 focus:bg-gray-600 focus:ring-0 text-white">
                                {this.resourcesState.availableModelPaths.map(id => {
                                    return <option value={id} selected={this.selectedModelPath === id}>{id} {this.resourcesState.models[0].path === id ? "(current)" : ""}</option>
                                })}
                    </select>

                    <Button onClick={this.confirmSelectedModelPath}
                                isLoading={this.resourcesState.isUpdatingModel}
                                class="shrink-0"
                                disabled={this.resourcesState.models[0].path === this.selectedModelPath}
                                title="Update" />
                </div>
                <a onClick={this.openModelLink} class="mt-2 text-xs text-blue-500 hover:text-blue-400" href="#">
                    Read more about <strong>{this.selectedModelPath}</strong> <ArrowTopRightOnSquareIcon class="inline w-3 h-3 relative bottom-0.5" />
                </a>
            </div>
        }
 
        return <Modal class="w-3/4" closableWithBackground={true} title="Settings & Resources" close={this.$props.finish}>
            {renderDataPathInfo()}
            
            {renderModelSelector()}

            {renderAllResourcesInfo()}

            <div class="flex mt-4 items-center">
                <span class="mr-auto text-sm opacity-100"><StatusEntry isDetailed={true} /></span>
                {renderAction()}
            </div>
        </Modal>
    }
})