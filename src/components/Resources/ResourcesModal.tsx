import { defineComponent, ref, computed, PropType } from "vue"
import { AlertActionCancel, AlertActionOkay, Modal, useModal } from "@/utils/vue-modal"
import { Button } from "@/components/Shared"
import { RemoteResourceStatus, RemoteResource, resourcesStore, DataPathUpdateStatus } from "@/stores/ResourcesStore"
import StatusEntry from "./StatusEntry"
import Store from "@/stores/Store"

export default defineComponent({

    props: {
        finish : {
            type: Function,
            required: true,
        },
        modal : Object
    },

    setup(props) {
        const currentDataPath = ref(resourcesStore.getState().dataPath)
        
        const startDownloading = async (event : Event) => {
            event.preventDefault()
            resourcesStore.startDownloading()
        }

        const stopDownloading = async (event : Event) => {
            event.preventDefault()
            resourcesStore.stopDownloading()
        }

        const resetDownloads = async (event : Event) => {
            event.preventDefault()
        
            const result = await props.modal.presentAlert({
                title: "Remove All Models Data",
                description: "Are you sure you want to remove all locally stored models data? All data will need to be redownloaded again in order to create images.",
                actions: [
                    {
                        name: "Delete",
                        type: "destructive"
                    },
                    AlertActionCancel
                ],
            })

            if (result?.name === "Delete") {
                resourcesStore.removeDownloads()
            }
        }

        const confirmDataPath = async (event : MouseEvent) => {
            event?.preventDefault()

            const result = await resourcesStore.updateDataPath(currentDataPath.value)

            switch (result) {

            case DataPathUpdateStatus.updated:
                break

            case DataPathUpdateStatus.pathNotFound:
        
                await props.modal.presentAlert({
                    title: "Cannot find path specified",
                    description: `Make sure ${currentDataPath.value} exists on your file system.`,
                    actions: [
                        AlertActionOkay
                    ],
                })

                break

            case DataPathUpdateStatus.pathNotDirectory:
                await props.modal.presentAlert({
                    title: "Specified path is not a directory",
                    description: `Make sure ${currentDataPath.value} is a directory where the files will be stored.`,
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

            currentDataPath.value = path
            await resourcesStore.updateDataPath(path)
        }

        const updateCurrentDataPath = (event : InputEvent) => {
            const target = event.target as HTMLInputElement
            currentDataPath.value = target.value
        }

        const close = async (event : Event) => {
            event.preventDefault()
            props.finish(null)
        }

        resourcesStore.fetch()
        
        return {
            resourcesState : resourcesStore.getState(),
            status : resourcesStore.status,
            currentDataPath,
            browseDataPath,
            updateCurrentDataPath,
            startDownloading,
            stopDownloading,
            resetDownloads,
            confirmDataPath,
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
            
            const bytes = this.resourcesState.resources.reduce((result, next) => {
                result.downloaded_file_bytes += next.downloaded_file_bytes
                result.total_file_bytes += next.total_file_bytes
                return result
            }, { total_file_bytes: 0, downloaded_file_bytes: 0 })

            const cumulativeResource : RemoteResource = {
                name: "All Models",
                path: "",
                downloaded_file_bytes: bytes.downloaded_file_bytes,
                total_file_bytes: bytes.total_file_bytes,
                is_required: true,
            }

            return <ul>
                {this.resourcesState.resources.map(resource => {
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
                return <Button onClick={this.resetDownloads}
                                class="ml-auto"
                                destructive={true}
                                title="Remove All Models Data" />
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

            const renderDataPathWarning = () => {
                if (this.resourcesState.isDataPathDefault === false) {
                    return
                }

                return <span class="block pt-2 text-red-500">
                    Warning! Please select a folder where all your models will be stored so they are not stored on the system disk.
                </span>
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
                <h3 class="opacity-50 pb-2">Data Storage Location (all models and output images will be stored there):</h3>
                {renderDataPathSelector()}
                {renderDataPathWarning()}
            </div>
        }
 
        return <Modal class="w-3/4" closableWithBackground={true} title="Settings & Resources" close={this.$props.finish}>
            {renderDataPathInfo()}
            
            {renderAllResourcesInfo()}

            <div class="flex mt-4 items-center">
                <span class="mr-auto text-sm opacity-100"><StatusEntry isDetailed={true} /></span>
                {renderAction()}
            </div>
        </Modal>
    }
})