import { computed } from "vue"
import Store from "./Store"
import { Prompt } from "./PromptStore"
import { settingsStore } from "./SettingsStore"
import { MessagingClientEvent, messagingClient } from "@/utils/MessagingClient"

export enum OutputType {
    preview = "preview",
    upscale = "upscale",
    variation = "variation"
}

export interface Output {
    id : string
    prompt : Prompt
    createdAt : Date
    seed : number
    type : OutputType
    url : string
    parent? : Output
    children : Output[]
    progress : number // 0 means waiting, (0, 1) means in process, 1 means fully completed
    settings : { [key : string] : any }
    isFavorite : boolean
    isArchived : boolean
}

/* State */

export interface OutputState extends Object {
    masterOutput : Output | null
    currentVariationIndex : number
    currentScale : number
    isInitialLoading : boolean
    isUpscaling : boolean
}

export class OutputStore extends Store<OutputState> {

    protected data() : OutputState {
        return {
            masterOutput: null,
            currentVariationIndex: 0,
            currentScale: 1,
            isInitialLoading: true,
            isUpscaling: false,
        }
    }

    public get currentOutput() {
        return computed(() => {
            const masterOutput = this.state.masterOutput

            if (masterOutput === null) {
                return null
            }

            if (this.state.currentScale === this.baseScale.value) {
                return masterOutput
            }
            else {
                if (typeof masterOutput.children === "undefined") {
                    return null
                }
                
                const upscaledOutputs = masterOutput.children.filter(output => {
                    return output.type === OutputType.upscale && output.settings.upscale?.dimension === this.state.currentScale
                })

                if (upscaledOutputs.length === 0) {
                    return null
                }

                return upscaledOutputs[0]
            } 
        })  
    }

    public get baseScale() {
        return computed(() => {
            return settingsStore.getState().constants.base_dimension
        })
    }

    public get availableOutputScales() {
        return computed(() => {
            return [
                settingsStore.getState().constants.base_dimension,
                settingsStore.getState().constants.upscaled_dimension
            ]
        })
    }

    public projectId : string
    public masterOutputId : string

    constructor(projectId : string, outputId : string) {
        super()
        this.projectId = projectId
        this.masterOutputId = outputId

        const fetchInitialData = async () => {
            this.state.isInitialLoading = true
            await settingsStore.fetch()
            await this.fetch()
            this.updateWithBestAvailableScale()
            this.state.isInitialLoading = false

            messagingClient.addListener(MessagingClientEvent.outputUpdated, (output : Output) => {
                if (output.id !== output.id && output.id !== this.currentOutput.value?.id) {
                    return
                }

                this.fetch()
            })
        }

        fetchInitialData()
    }

    public async fetch() {
        try {
            const result = await (await this.fetchApi(`/projects/${this.projectId}/output/${this.masterOutputId}`)).json()
            this.state.masterOutput = result["output"]
        }
        catch (error) {

        }
    }

    public updateOutput(id : string) {
        this.masterOutputId = id
    }

    public updateScale(scale : number) {
        this.state.currentScale = scale
    }

    public updateVariation(index : number) {
        this.state.currentVariationIndex = index
        this.updateWithBestAvailableScale()
    }

    public updateWithBestAvailableScale() {
        const masterOutput = this.state.masterOutput

        if (masterOutput === null) {
            return
        }

        const upscaledOutputs = masterOutput.children?.filter(output => output.type === OutputType.upscale)

        if (typeof upscaledOutputs === "undefined" || upscaledOutputs.length === 0) {
            this.state.currentScale = this.baseScale.value
        }
        else {
            const biggestScale = masterOutput.children.filter(output => {
                return output.type === OutputType.upscale
            }).reduce((result, next) => {
                if (next.settings.upscale?.dimension > result) {
                    result = next.settings.upscale?.dimension
                }
                
                return result
            }, this.baseScale.value)

            this.state.currentScale = biggestScale
        }
    }

    public async generateUpscale() {
        this.state.isUpscaling = true
        
        try {
            // Getting current prompt (variation at 0th index is always the first one)
            const masterOutput = this.state.masterOutput

            if (masterOutput === null) {
                return
            }

            let settings = masterOutput.settings
            settings["type"] = OutputType.upscale
            settings["batch"] = 1
            settings["upscale"] = {
                "dimension" : this.state.currentScale
            }
            
            // Adding upscale output
            await this.fetchApi(`/projects/${this.projectId}/prompts/${masterOutput.prompt.id}/generate`, {
                method : "POST",
                body: JSON.stringify({
                    parent_id : masterOutput.id,
                    settings: settings
                })
            })
        }
        catch (error) {

        }

        this.state.isUpscaling = false
    }

    public async setFavorite(isFavorite : Boolean) {
        try {
            // Getting current prompt (variation at 0th index is always the first one)
            const masterOutput = this.state.masterOutput

            if (masterOutput === null) {
                return
            }

            // We need to set favorite to each the base version and to the upscaled version if it exists
            const upscaledOutputs = masterOutput.children.filter(output => {
                return output.type === OutputType.upscale
            })

            const allOutputs = upscaledOutputs.concat([masterOutput])

            for (const output of allOutputs) {
                await this.fetchApi(`/projects/${this.projectId}/output/${output.id}/favorite`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        is_favorite : isFavorite
                    })
                }) 
            }

            await this.fetch()
        }
        catch (error) {

        }
    }

    public async setArchived(isArchived : Boolean) {
        try {
             // Getting current prompt (variation at 0th index is always the first one)
             const masterOutput = this.state.masterOutput

             if (masterOutput === null) {
                return
            }

            // We need to set favorite to each the base version and to the upscaled version if it exists
            const upscaledOutputs = masterOutput.children.filter(output => {
                return output.type === OutputType.upscale
            })

            const allOutputs = upscaledOutputs.concat([masterOutput])
            
            for (const output of allOutputs) {
                await this.fetchApi(`/projects/${this.projectId}/output/${output.id}/archive`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        is_archived : isArchived
                    })
                }) 
            }
        }
        catch (error) {
            console.log("Error", error)
        }
    }
  
}