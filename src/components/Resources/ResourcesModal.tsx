import { defineComponent, ref } from "vue"
import { AlertActionCancel, AlertActionOkay, Modal } from "@/utils/vue-modal"
import { Button } from "@/components/Shared"
import { RemoteResourceStatus, RemoteResource, resourcesStore, DataPathUpdateStatus } from "@/stores/ResourcesStore"
import { DocumentPlusIcon, TrashIcon } from "@heroicons/vue/24/outline"
import StatusEntry from "./StatusEntry"
import Store from "@/stores/Store"
import AddModelModal from "./AddModelModal"

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
        
                await props.modal?.presentAlert({
                    title: "Cannot find path specified",
                    description: `Make sure ${selectedDataPath.value} exists on your file system.`,
                    actions: [
                        AlertActionOkay
                    ]
                })

                break

            case DataPathUpdateStatus.pathNotDirectory:
                await props.modal?.presentAlert({
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

        const showAddModelDialogue = () => {
            props.modal?.present(AddModelModal)
        }

        const deleteModel = async (id : string) => {
            const result = await props.modal?.presentAlert({
                title: "Delete Model",
                description: "Are you sure you want to delete the model? All its files will be removed from disk.",
                actions: [
                    {
                        name: "Delete",
                        type: "destructive"
                    },
                    AlertActionCancel
                ]
            })

            if (result?.name !== "Delete") {
                return 
            }

            await resourcesStore.deleteModel(id)
        }

        const close = async (event : Event) => {
            event.preventDefault()
            props.finish(null)
        }

        return {
            resourcesState : resourcesStore.getState(),
            status : resourcesStore.status,
            currentDataPath: selectedDataPath,
            browseDataPath,
            updateCurrentDataPath,
            startDownloading,
            stopDownloading,
            confirmDataPath,
            showAddModelDialogue,
            deleteModel,
            close
        }
    },

    render() {
        const renderResourceInfo = (resource : RemoteResource, isDeletable : boolean = false) => {
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
                    return "bg-yellow-600"
                }
                else {
                    return "bg-blue-600"
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

            return <div class="pt-2 font-mono text-sm">
                <div class="flex justify-between">
                    <span class="text-xs opacity-75">{resource.path}</span>
                    {isDeletable === true ? <TrashIcon onClick={() => this.deleteModel(resource.path)} class="w-4 h-4 text-red-500 cursor-pointer hover:opacity-75" /> : null}
                </div>
                <div class="mt-2">
                    <div class="relative w-full h-6 bg-neutral-600 rounded overflow-hidden">
                        <span style={`width:${progressPercent}%`} class={`transition-all ${colorForProgress(progress)} absolute top-0 left-0 bottom-0`}></span>
                        <span class="ml-auto text-2xs font-medium absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2">
                            {renderProgressInfo()}
                        </span>
                    </div>
                </div>
            </div>
        }

        const renderAllResourcesInfo = () => {
            if (this.status === RemoteResourceStatus.unknown) {
                return null
            }

            const allModels = this.resourcesState.previewModels.concat(this.resourcesState.upscaleModels)
            
            const bytes = allModels.reduce((result, next) => {
                result.downloaded_file_bytes += next.downloaded_file_bytes
                result.total_file_bytes += next.total_file_bytes
                return result
            }, { total_file_bytes: 0, downloaded_file_bytes: 0 })

            const cumulativeResource : RemoteResource = {
                name: "All Models",
                path: "All Models",
                downloaded_file_bytes: bytes.downloaded_file_bytes,
                total_file_bytes: bytes.downloaded_file_bytes,
                revision: ""
            }

            return <dl class="mt-2">
                <dt class="flex justify-between gap-2 items-center">
                    Preview Models 
                    <DocumentPlusIcon onClick={this.showAddModelDialogue} class="inline w-5 h-5 hover:opacity-75 cursor-pointer" />
                </dt>
                {this.resourcesState.previewModels.map(model => {
                    return <dd class="mt-2">{renderResourceInfo(model, model.path !== this.resourcesState.previewModels[0].path)}</dd>
                })}

                <dt class="mt-4">Upscale Models</dt>
                {this.resourcesState.upscaleModels.map(model => {
                    return <dd class="mt-2">{renderResourceInfo(model)}</dd>
                })}

                <dt class="mt-4">Summary</dt>
                <dd class="mt-2">
                   {renderResourceInfo(cumulativeResource)} 
                </dd>
            </dl>
        }
        
        const renderAction = () => {
            if (this.status === RemoteResourceStatus.unknown) {
                return null
            }

            if (this.resourcesState.previewModels.filter(model => model.downloaded_file_bytes < model.total_file_bytes).length === 0) {
                return null
            }
            else {
                if (this.resourcesState.isDownloading === false) {
                    return <Button onClick={this.startDownloading}
                                    class="ml-auto text-green-600 border-green-600 hover:bg-green-600"
                                    title="Download Missing Models" />
                }
                else {
                    return <Button onClick={this.stopDownloading}
                                    class="ml-auto"
                                    title="Pause Downloads" />
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
 
        return <Modal class="w-3/4" closableWithBackground={true} title="Settings & Resources" close={this.$props.finish}>
            {renderDataPathInfo()}
    
            <div class="max-h-96 -mr-5 pr-5" style="overflow-y: overlay;">
            {renderAllResourcesInfo()}
            </div>

            <div class="flex mt-6 pt-6 -mx-6 px-6 items-center border-t border-gray-700">
                <span class="mr-auto text-sm opacity-100"><StatusEntry isDetailed={true} /></span>
                {renderAction()}
            </div>
        </Modal>
    }
})