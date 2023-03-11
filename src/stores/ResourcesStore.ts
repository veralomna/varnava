import { messagingClient, MessagingClientEvent } from "@/utils/MessagingClient"
import { computed } from "vue"
import Store from "./Store"

export enum RemoteResourceKind {
    preview = "Preview",
    upscale = "Upscale"
}

export enum DataPathUpdateStatus {
    updated = "updated",
    pathNotFound = "path-not-found",
    pathNotDirectory = "path-not-directory"
}

export enum RemoteResourceStatus {
    unknown = "unknown",
    needToLoad = "need-to-load",
    loading = "loading",
    ready = "ready"
}

export interface RemoteResource {
    name : string
    path : string
    revision : string
    total_file_bytes : number
    downloaded_file_bytes : number
}

export interface ResourcesState {
    previewModels : RemoteResource[]
    upscaleModels : RemoteResource[]
    dataPath : string,
    isDownloading : boolean
    isAdding : boolean
    isRemoving : boolean
}

export class ResourcesStore extends Store<ResourcesState> {

    protected data() : ResourcesState {
        return {
            previewModels : [],
            upscaleModels : [],
            dataPath: "",
            isDownloading : false,
            isAdding : false,
            isRemoving : false
        }
    }

    public get status() {
        return computed(() => {
            if (this.state.previewModels.length === 0) {
                return RemoteResourceStatus.unknown
            }

            if (this.state.previewModels.filter(model => model.downloaded_file_bytes === model.total_file_bytes ).length === 0) {
                // Still need to download at least one model
                if (this.state.isDownloading === false) {
                    return RemoteResourceStatus.needToLoad
                }
                else {
                    return RemoteResourceStatus.loading
                }
            }
            
            return RemoteResourceStatus.ready
        })
    }

    public constructor() {
        super()

        messagingClient.addListener(MessagingClientEvent.resourcesUpdated, () => {
            this.fetch()
        })
    }

    public isResourceReady(kind : RemoteResourceKind) {
        const models = kind === RemoteResourceKind.preview ? this.state.previewModels : this.state.upscaleModels

        const model = models.filter(model => model.name === kind)[0]

        if (model.downloaded_file_bytes < model.total_file_bytes) {
            return false
        }

        return true
    }

    public async fetch() {
        try {
            const result = await (await this.fetchApi("/resources")).json()
            this.state.previewModels = result["preview_models"] ?? []
            this.state.upscaleModels = result["upscale_models"] ?? []
            this.state.isDownloading = result["is_downloading"] ?? false
            this.state.dataPath = result["data_path"] ?? ""
        }
        catch (error) {
            this.state.previewModels = []
            this.state.upscaleModels = []
        }
    }

    public async addModel(id : String) {
        this.state.isAdding = true

        const result = await(await this.fetchApi("/resources/add", {
            method : "POST",
            body : JSON.stringify({
                "id" : id
            })
        })).json()

        this.state.isAdding = false

        if (typeof result["error"] !== "undefined") {
            throw result["error-details"]["text"]
        }
    }

    public async deleteModel(id : String) {
        this.state.isRemoving = true

        const result = await(await this.fetchApi("/resources/remove", {
            method : "POST",
            body : JSON.stringify({
                "id" : id
            })
        })).json()

        this.state.isRemoving = false
    }

    public async startDownloading() {
        try {
            await this.fetchApi("/resources/downloads/start")
        }
        catch (error) {

        }
    }
    
    public async stopDownloading() {
        try {
            await this.fetchApi("/resources/downloads/stop")
        }
        catch (error) {

        }
    }

    public async removeDownloads() {
        try {
            await this.fetchApi("/resources/remove_downloads")
        }
        catch (error) {

        }
    }

    public async updateDataPath(path : string): Promise<DataPathUpdateStatus> {
        try {
            const response = await this.fetchApi("/resources/data-path/update", {
                method: "POST",
                body: JSON.stringify({
                    path
                })
            })

            const result = await response.json()

            if (typeof result.error !== "undefined") {
                // We are having an error, returning it.
                return result.error
            }
            else {
                this.fetch()
                return DataPathUpdateStatus.updated
            }
        }
        catch (error) {
            return DataPathUpdateStatus.pathNotFound
        }
    }

}

export const resourcesStore = new ResourcesStore()