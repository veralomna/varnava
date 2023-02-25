import Store from "@/stores/Store"

export enum MessagingClientEvent {
    outputUpdated = "output.updated",
    outputCreated = "output.created",
    resourcesUpdated  = "resources.update"
}

interface MessagingClientListener {
    name : MessagingClientEvent
    handler : CallableFunction
}

class MessagingClient {

    socket : WebSocket | null = null
    listeners : { [key : number] : MessagingClientListener } = {}
    lastListenerId : number = 1

    constructor() {
        this.connect()
    }
    
    connect() {
        if (this.socket !== null) {
            return
        }

        console.log("Connecting to updates web socket at", Store.apiEndpoint.replace("http", "ws") + "/updates")

        const socket = new WebSocket(Store.apiEndpoint.replace("http", "ws") + "/updates")

        socket.onopen = () => {
            this.socket = socket
            console.log("Connected to updates socket.")
        }

        socket.onerror = () => {
            console.log("Failed to connect to updates web socket. Retrying.")
            setTimeout(() => { this.connect() }, 1500)
        }

        socket.onmessage = event => {
            const message = JSON.parse(event.data)
   
            for (const [key, listener] of Object.entries(this.listeners)) {
                if (listener.name === message.name) {
                    listener.handler(message.payload)
                }
            }
          
        }

    }

    addListener(name : MessagingClientEvent, handler : CallableFunction): number {
        this.lastListenerId += 1

        this.listeners[this.lastListenerId] = {
            name: name,
            handler: handler
        }

        return this.lastListenerId
    }

    removeListener(id : number) {
        delete this.listeners[id]
    }
 
}

export const messagingClient = new MessagingClient()