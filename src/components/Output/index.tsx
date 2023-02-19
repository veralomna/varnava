import { defineComponent, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { settingsStore } from "@/stores/SettingsStore"
import { OutputStore } from "@/stores/OutputStore"
import Store from "@/stores/Store"
import { RemoteResourceStatus, resourcesStore } from "@/stores/ResourcesStore"
import { AlertActionOkay, useModal } from "@/stores/vue-modal"
import { PlusIcon, StarIcon, TrashIcon, ArrowDownCircleIcon } from "@heroicons/vue/24/solid"
import { StarIcon as HollowStarIcon } from "@heroicons/vue/24/outline"
import LinearProgress from "../Shared/LinearProgress"

export default defineComponent({

    setup(props, ctx) {
        const router = useRouter()
        const route = useRoute()
        const modal = useModal()

        const outputStore = new OutputStore(route.params.id, route.params.oid)

        watch(route, route => {
            outputStore.updateOutput(route.params.oid)
            outputStore.fetch()
        })
       
        const close = (event : Event) => {
            router.replace({
                name: "project-details",
                params: {
                    id: route.params.id
                }
            })
        }

        const closeWithBackdrop = (event : Event) => {
            const target = event.target as HTMLElement

            if (target.getAttribute("data-backdrop") !== "true") {
                return
            }

            close(event)
        }

        const scrollVariations = (event : WheelEvent) => {
            const target = event.currentTarget as HTMLElement
            target.scrollLeft += event.deltaY
        }

        const generateVariation = () => {
            if (resourcesStore.status.value !== RemoteResourceStatus.ready) {
                const description = resourcesStore.status.value === RemoteResourceStatus.loading 
                    ? "Please wait for all models to download first." 
                    : "Please download all models first."

                modal.presentAlert({
                    title: "Cannot create images",
                    description: description,
                    actions: [
                        AlertActionOkay
                    ]
                })
                return
            }
            
            outputStore.generateVariation()
        }

        const updateVariation = (index : number) => {
            outputStore.updateVariation(index)
        }

        const updateScale = (scale : number) => {
            outputStore.updateScale(scale)
        }

        const generateUpscale = () => {
            if (resourcesStore.status.value !== RemoteResourceStatus.ready) {
                const description = resourcesStore.status.value === RemoteResourceStatus.loading 
                    ? "Please wait for all models to download first." 
                    : "Please download all models first."

                modal.presentAlert({
                    title: "Cannot create image",
                    description: description,
                    actions: [
                        AlertActionOkay
                    ]
                })
                return
            }

            outputStore.generateUpscale()
        }

        const downloadOutput = async (url : string) => {   
            window.open(url, "_blank")
        }

        const toggleFavorite = async () => {
            const newFavorite = !outputStore.currentOutput.value?.isFavorite
            await outputStore.setFavorite(newFavorite)
        }

        return {
            closeWithBackdrop,
            close,
            scrollVariations,
            generateVariation,
            updateVariation,
            updateScale,
            generateUpscale,
            downloadOutput,
            toggleFavorite,
            outputState : outputStore.getState(),
            availableScales : outputStore.availableOutputScales,
            output : outputStore.currentOutput
        }
    },

    beforeMount() {
        // @ts-ignore
        document.querySelector("body").style.overflow = "hidden"
    },

    beforeUnmount() {
        // @ts-ignore
        document.querySelector("body").style.overflow = ""
    },

    render() {
        const outputUrl = `${Store.apiEndpoint}/outputs/${this.output?.url}?progress=${this.output?.progress}`
        
        const renderSettingsEntry = (name : string, value : string) => {
            return <li class="rounded flex text-left justify-leading pb-2">
                <div>
                    <span class="lowercase block opacity-50">{name}</span>
                    <strong class="whitespace-nowrap">{settingsStore.getSettingDisplayName(name, value)}</strong>
                </div>
            </li>
        }

        const renderImage = () => {
            const renderImageContents = () => {
                if (this.output === null) {
                    return <div class="w-full h-full text-white/50 font-sm object-contain flex justify-center items-center">
                        No upscaled version created yet.
                    </div>
                }

                return <img class="w-full h-full object-contain" src={outputUrl} alt="" />
            }

            const renderLoadingProgress = () => {
                if (this.output === null) {
                    return null
                }

                if (this.output?.progress > 0 || this.output?.progress < 1) {
                    return null
                }
    
                return <div class="absolute bottom-4 left-4 right-4">
                    <LinearProgress value={this.output?.progress || 0} />
                </div>
            }

            return <div class="w-full min-w-[76%] max-w-[76%] bg-gray-700/50 aspect-square drop-shadow-lg relative"> 
                {renderImageContents()}
                {renderLoadingProgress()}
            </div>
        }

        const renderMeta = () => {
            const renderScales = () => {
                return this.availableScales.map(scale => {
                    return <button onClick={() => { this.updateScale(scale) }} class={`w-full text-sm font-medium ${scale !== this.outputState.currentScale ? "opacity-50" : ""} hover:opacity-100 block py-2 border-white border-2 text-center rounded flex justify-center items-center`}>
                        {scale}×{scale}
                    </button>
                })
            }

            const renderSettings = () => {
                if (this.output === null || typeof this.output?.settings === "undefined") {
                    return null
                }

                return <ul class="justify-between font-mono text-sm w-full">
                    {renderSettingsEntry("internal_seed", `${this.output.seed}`)}
                    {Object.keys(this.output.settings).map(name => {
                        const value = this.output?.settings[name]

                        if (typeof value === "object") {
                            return
                        }

                        return renderSettingsEntry(name, value)
                    })}   
                </ul>
            }

            const renderActions = () => {
                if (this.output === null || this.output.progress < 1) {
                    return <div class="flex flex-col gap-4">
                        <span class="block leading-5 text-sm text-white/50">Upscaled version was not created yet. Press the button below to create it.</span>

                        <button onClick={this.generateUpscale} class="w-full gap-2 font-medium block px-4 py-2 bg-blue-700 hover:bg-blue-600 text-center rounded flex justify-center items-center">
                            <PlusIcon class="w-6 h-6" /> Create Image
                        </button>
                    </div>
                }

                return <div class="flex gap-4">
                    <button onClick={() => { this.downloadOutput(outputUrl) }} class="group w-full font-medium bg-blue-700 hover:bg-blue-600 gap-2 text-center rounded flex justify-center items-center p-2">
                        <ArrowDownCircleIcon class="group-hover:scale-110 transition-all w-6 h-6" />
                    </button>
                    <button onClick={this.toggleFavorite} class={`group w-full font-medium ${this.output.isFavorite === false ? "bg-blue-700 hover:bg-blue-600" : "bg-yellow-700 hover:bg-yellow-600"} gap-2 text-center rounded flex justify-center items-center p-2`}>
                    {this.output.isFavorite === false ? <HollowStarIcon class="group-hover:scale-110 transition-all w-6 h-6" /> : <StarIcon class="group-hover:scale-110 transition-all w-6 h-6" />}
                    </button>
                    <button class="group w-full font-medium bg-red-700 hover:bg-red-600 gap-2 text-center rounded flex justify-center items-center p-2">
                        <TrashIcon class="group-hover:scale-110 transition-all w-6 h-6" /> 
                    </button>

                </div>
            }

            return <ul class="pl-4 w-full flex flex-col">
                <li class="flex gap-4 border-b border-gray-700 pb-4 mb-4">
                   {renderScales()}
                </li>

                <li class="">
                    {renderSettings()}
                </li>

                <li class="mt-auto">
                    {renderActions()}
                </li>
            </ul>
        }

        return <div data-backdrop="true" onClick={this.closeWithBackdrop} class="transition flex backdrop-blur-xl fixed top-0 left-0 right-0 bottom-0 bg-neutral-900/75 z-[1000]">
            <div class="w-full mx-6 my-auto"> 
                <div class="flex items-center">
                    <h2 class="select-none text-4xl font-semibold mr-4 mb-4">Output Preview</h2>  
                    <a class="text-blue-500 hover:text-blue-400" href="#" onClick={this.close}>⤶ Back To Project</a>
                </div>
                <div class="rounded w-full bg-gray-800 px-4 py-4">
                    <div class="flex">
                        {renderImage()}
                        {renderMeta()}
                    </div>
                    <div onWheel={this.scrollVariations} class="relative h-24 w-full mt-4 overflow-x-auto overflow-y-hidden no-scrollbar">
                        <ul class="absolute top-0 left-0 flex gap-4">
                            <li onClick={this.generateVariation} class="select-none cursor-pointer w-24 h-24 border-2 opacity-50 hover:opacity-100 leading-5 rounded">
                                <span class="w-full h-full flex justify-center items-center text-center">
                                    Create<br /> Variation
                                </span>
                            </li>
                            {this.outputState.variations.map((variation, index) => {
                                return <li onClick={() => { this.updateVariation(index) }} class={`select-none cursor-pointer relative w-24 h-24 rounded ${index == this.outputState.currentVariationIndex ? "after:block" : "after:hidden hover:after:block"} after:rounded after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:left-0 after:border-2`}>
                                    <img class="w-full h-full object-contain" src={`${Store.apiEndpoint}/outputs/${variation.url}?progress=${variation.progress}`} alt="" />
                                </li>
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    }

})