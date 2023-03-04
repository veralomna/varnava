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
    models : RemoteResource[]
    availableModelPaths : string[]
    dataPath : string,
    isDownloading : boolean
    isUpdatingModel : boolean
}

export class ResourcesStore extends Store<ResourcesState> {

    protected data() : ResourcesState {
        return {
            models : [],
            availableModelPaths : [],
            dataPath: "",
            isDownloading : false,
            isUpdatingModel : false 
        }
    }

    public get status() {
        return computed(() => {
            if (this.state.models.length === 0) {
                return RemoteResourceStatus.unknown
            }

            if (this.state.models.filter(model => model.downloaded_file_bytes < model.total_file_bytes ).length > 0) {
                // Still need to download resources
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
        const model = this.state.models.filter(model => model.name === kind)[0]

        if (model.downloaded_file_bytes < model.total_file_bytes) {
            return false
        }

        return true
    }

    public async fetch() {
        try {
            const result = await (await this.fetchApi("/resources")).json()
            this.state.models = result["models"]
            this.state.dataPath = result["dataPath"]
            this.state.isDownloading = result["isDownloading"]

            if (this.state.availableModelPaths.length === 0) {
                this.state.availableModelPaths = [this.state.models[0].path]
                this.fetchAllModels()
            }
        }
        catch (error) {
            this.state.models = []
        }
    }

    protected async fetchAllModels() {
        if (this.state.availableModelPaths.length >= 2) {
            return
        }
       
        try {
            const result = await (await this.fetchApi("/resources/list_models")).json()
            this.state.availableModelPaths = result["models"]
        }
        catch (error) {
            this.state.availableModelPaths = []
        }
    }

    public async updatePreviewModel(path : String): Promise<Boolean> {
        this.state.isUpdatingModel = true

        try {
            const result = await (await this.fetchApi("/resources/update_preview_model_path", {
                method: "POST",
                body: JSON.stringify({
                    path
                })
            })).json()

            this.state.isUpdatingModel = false

            return result["status"] === "ok"
        }
        catch (error) {
            this.state.isUpdatingModel = false
            return false
        }

    }

    public async startDownloading() {
        try {
            await this.fetchApi("/resources/start_downloading")
        }
        catch (error) {

        }
    }
    
    public async stopDownloading() {
        try {
            await this.fetchApi("/resources/stop_downloading")
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
            const response = await this.fetchApi("/resources/update_data_path", {
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