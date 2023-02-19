import Store from "./Store"
import { Output } from "./OutputStore"
import { MessagingClientEvent, messagingClient } from "@/utils/MessagingClient"
import { computed } from "vue"

/* State */

export interface ActivityState extends Object {
    outputs : Output[]
    isLoading : boolean
}

export class ActivityStore extends Store<ActivityState> {

    protected data() : ActivityState {
        return {
            outputs : [],
            isLoading : false
        }
    }

    public get unfinishedOutputsCount() {
        return computed(() => {
            return this.state.outputs.filter(output => output.progress < 1).length
        })
    }

    constructor() {
        super()

        messagingClient.addListener(MessagingClientEvent.outputCreated, (output : Output) => {
            this.state.outputs.unshift(this.processOutput(output))
        })

        messagingClient.addListener(MessagingClientEvent.outputUpdated, (output : Output) => {
            const index = this.state.outputs.findIndex(existingOutput => output.id === existingOutput.id)
            
            if (index === -1) {
                return
            }

            this.state.outputs[index] = this.processOutput(output)
        })
    }

    public async fetch() {
        this.state.isLoading = true

        try {
            const result = await (await this.fetchApi(`/outputs/1`)).json()
            const outputs = result["outputs"]
                
            this.state.outputs = outputs.map((output: Output) => this.processOutput(output))
        }
        catch (error) {

        }

        this.state.isLoading = false
    }
    
    protected processOutput(output : Output): Output {
        let processedOutput = output

        processedOutput["createdAt"] = new Date(processedOutput["createdAt"])
        processedOutput["url"] = processedOutput["url"].replace("\\", "/")

        return processedOutput
    }

}

export const activityStore = new ActivityStore()