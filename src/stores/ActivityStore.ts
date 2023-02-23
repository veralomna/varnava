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
            return this.state.outputs.filter(output => output.progress !== 1).length
        })
    }

    constructor() {
        super()

        messagingClient.addListener(MessagingClientEvent.outputCreated, output => {
            this.fetch()
        })

        messagingClient.addListener(MessagingClientEvent.outputUpdated, output => {
            this.fetch()
        })
    }

    public async fetch() {
        this.state.isLoading = true

        try {
            const result = await (await this.fetchApi(`/outputs/1`)).json()
            const outputs = result["outputs"]
                
            this.state.outputs = outputs.map((item: Output) => {
                item["createdAt"] = new Date(item["createdAt"])
                return item
            })
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

}

export const activityStore = new ActivityStore()