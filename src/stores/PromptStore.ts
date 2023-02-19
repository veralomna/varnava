import Store from "./Store"
import { Output } from "./OutputStore"
import { MessagingClientEvent, messagingClient } from "@/utils/MessagingClient"

export enum PromptGridSize {
    small = "small",
    big = "big"
}

export interface Prompt {
    id : string
    createdAt : Date
    value : string
    outputs : Output[]
}

/* State */

export interface PromptState extends Object {
    prompts : Prompt[]
    promptsById : { [id : string] : Prompt }
    promptsByOutputId : { [id : string] : Prompt }
    promptsVisibilityById : { [id : string] : Boolean }
    promptsGridSizeById : { [id : string] : PromptGridSize }
    outputsById : { [id : string] : Output }
    isLoading : boolean
}

export class PromptStore extends Store<PromptState> {

    protected data() : PromptState {
        return {
            prompts : [],
            promptsById : {},
            promptsByOutputId : {},
            promptsVisibilityById: {},
            promptsGridSizeById: {},
            outputsById : {},
            isLoading : false
        }
    }

    public projectId : string

    constructor(projectId : string) {
        super()
        this.projectId = projectId
        this.fetch()

        messagingClient.addListener(MessagingClientEvent.outputUpdated, () => {
            this.fetch()
        })
    }

    public async updateProjectId(projectId : string) {
        this.projectId = projectId
        await this.fetch()
    }

    public async fetch() {
        this.state.isLoading = true

        try {
            const result = await (await this.fetchApi(`/project/${this.projectId}/prompts`)).json()
            const prompts = result["prompts"]

            this.state.prompts = prompts.map((item: Prompt) => {
                item["createdAt"] = new Date(item["createdAt"])
                this.state.promptsById[item.id] = item

                item.outputs.forEach(output => {
                    this.state.outputsById[output.id] = output
                    this.state.promptsByOutputId[output.id] = item
                })

                return item
            })

            this.state.promptsVisibilityById = JSON.parse(localStorage.getItem(`prompts-visibility-${this.projectId}`) || "{}")
            this.state.promptsGridSizeById = JSON.parse(localStorage.getItem(`prompts-grid-size-${this.projectId}`) || "{}")

            this.state.prompts = prompts
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public async add(value : string) {
        if (value.length === 0) {
            return
        }

        this.state.isLoading = true

        try {
            const result = await this.fetchApi(`/project/${this.projectId}/prompts/add`, {
                method : "POST",
                body : JSON.stringify({
                    value : value
                })
            })
            
            await this.fetch()
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public async generate(prompt : Prompt, 
                          settings : { [key : string] : any } = {}) {
        this.state.isLoading = true

        try {
            // Adding two outputs for the prompt.
            await this.fetchApi(`/projects/${this.projectId}/prompts/${prompt.id}/generate`, {
                method : "POST",
                body : JSON.stringify({
                    "settings" : settings
                })
            })

            await this.fetch()
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public getOutputById(id : string): Output {
        return this.state.outputsById[id]
    }

    public getPreviousOutput(id : string): Output | null {
        const prompt = this.state.promptsByOutputId[id]

        if (typeof prompt === "undefined") {
            return null
        }

        const index = prompt.outputs.findIndex(output => output.id == id)

        if (index === -1 || index - 1 < 0) {
            return null
        }

        return prompt.outputs[index - 1]
    }

    public getNextOutput(id : string): Output | null {
        const prompt = this.state.promptsByOutputId[id]

        if (typeof prompt === "undefined") {
            return null
        }

        const index = prompt.outputs.findIndex(output => output.id == id)

        if (index === -1 || index > prompt.outputs.length - 1) {
            return null
        }

        return prompt.outputs[index + 1]
    }

    public getPromptVisibility(id : string): Boolean {
        if (typeof this.state.promptsVisibilityById[id] === "undefined") {
            return true
        }
        
        return this.state.promptsVisibilityById[id]
    }

    public setPromptVisibility(id : string, isVisible : Boolean) {
        this.state.promptsVisibilityById[id] = isVisible
        localStorage.setItem(`prompts-visibility-${this.projectId}`, JSON.stringify(this.state.promptsVisibilityById))
    }

    public getPromptGridSize(id : string) {
        if (typeof this.state.promptsGridSizeById[id] === "undefined") {
            return PromptGridSize.big
        }

        return this.state.promptsGridSizeById[id]
    }

    public setPromptGridSize(id : string, gridSize : PromptGridSize) {
        this.state.promptsGridSizeById[id] = gridSize
        localStorage.setItem(`prompts-grid-size-${this.projectId}`, JSON.stringify(this.state.promptsGridSizeById))
    }

}