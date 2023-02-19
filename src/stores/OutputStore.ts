import { computed } from "vue"
import Store from "./Store"
import { Prompt } from "./PromptStore"
import { settingsStore } from "./SettingsStore"

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
    children : Output[]
    progress : number // 0 means waiting, (0, 1) means in process, 1 means fully completed
    settings : { [key : string] : any }
    isFavorite : boolean
    isArchived : boolean
}

/* State */

export interface OutputState extends Object {
    currentVariationIndex : number
    currentScale : number
    variations : Output[]
    isInitialLoading : boolean
    isUpscaling : boolean
    isVariating : boolean
}

export class OutputStore extends Store<OutputState> {

    protected data() : OutputState {
        return {
            currentVariationIndex: 0,
            currentScale: 1,
            variations: [],
            isInitialLoading: true,
            isUpscaling: false,
            isVariating: false
        }
    }

    public get currentOutput() {
        return computed(() => {
            const baseOutput = this.state.variations[this.state.currentVariationIndex]

            if (this.state.currentScale === this.baseScale.value) {
                return baseOutput
            }
            else {
                if (typeof baseOutput?.children === "undefined") {
                    return null
                }
                
                const upscaledOutputs = baseOutput.children.filter(output => {
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
        }

        fetchInitialData()
    }

    public async fetch() {
        try {
            const result = await (await this.fetchApi(`/projects/${this.projectId}/output/${this.masterOutputId}`)).json()

            // Getting all variations including the original output.
            let output = result["output"]
            let variations = output.children.filter((child : Output)  => child.type == OutputType.variation)

            variations = [output].concat(variations.map((child : Output) => {
                child["createdAt"] = new Date(child["createdAt"])
                return child
            }))

            this.state.variations = variations
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
        const baseOutput = this.state.variations[this.state.currentVariationIndex]
        const upscaledOutputs = baseOutput.children?.filter(output => output.type === OutputType.upscale)

        if (typeof upscaledOutputs === "undefined" || upscaledOutputs.length === 0) {
            this.state.currentScale = this.baseScale.value
        }
        else {
            const biggestScale = baseOutput.children.filter(output => {
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
            const masterOutput = this.state.variations[0]
            const currentOutput = this.state.variations[this.state.currentVariationIndex]

            let settings = currentOutput.settings
            settings["type"] = OutputType.upscale
            settings["batch"] = 1
            settings["upscale"] = {
                "dimension" : this.state.currentScale
            }
            
            // Adding upscale output
            await this.fetchApi(`/projects/${this.projectId}/prompts/${masterOutput.prompt.id}/generate`, {
                method : "POST",
                body: JSON.stringify({
                    parent_id : currentOutput.id,
                    settings: settings
                })
            })
            
            this.checkProgress()
        }
        catch (error) {

        }

        this.state.isUpscaling = false
    }

    public async generateVariation() {
        this.state.isVariating = true

        try {
            // Getting current prompt (variation at 0th index is always the first one)
            const masterOutput = this.state.variations[0]

            let settings = masterOutput.settings
            settings["type"] = OutputType.variation
            settings["batch"] = 1

            // Adding upscale output
            await this.fetchApi(`/projects/${this.projectId}/prompts/${masterOutput.prompt.id}/generate`, {
                method : "POST",
                body: JSON.stringify({
                    parent_id : masterOutput.id,
                    settings: settings
                })
            })
            
            this.checkProgress()
        }
        catch (error) {

        }

        this.state.isVariating = false
    }

    public async setFavorite(isFavorite : Boolean) {
        try {
            // Getting current prompt (variation at 0th index is always the first one)
            const currentOutput = this.state.variations[this.state.currentVariationIndex]

            // We need to set favorite to each the base version and to the upscaled version if it exists
            const upscaledOutputs = currentOutput.children.filter(output => {
                return output.type === OutputType.upscale
            })

            const allOutputs = upscaledOutputs.concat([currentOutput])

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

    protected async checkProgress() {
        await this.fetch()

        function flattenChildren(outputs : Output[]) {
            return outputs.reduce((result, next) => {
                result.push(next)

                if (next.children && next.children.length > 0) {
                    result = result.concat(flattenChildren(next.children))
                }

                return result
            }, [])
        }
        
        const allOutputs = flattenChildren(this.state.variations)

        if (allOutputs.filter(output => { return output.progress < 1 }).length > 0) {       
            setTimeout(() => {
                this.checkProgress()
            }, 500)
        }
    }

  
}