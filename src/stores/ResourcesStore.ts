import { computed } from "vue"
import Store from "./Store"

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
    is_required : boolean
    total_file_bytes : number
    downloaded_file_bytes : number
}

export interface ResourcesState {
    resources : RemoteResource[]
    isDownloading : boolean
    downloadingPath : string | null
    dataPath : string,
    isDataPathDefault : boolean
}

export class ResourcesStore extends Store<ResourcesState> {

    protected data() : ResourcesState {
        return {
            resources : [],
            isDownloading : false,
            downloadingPath : null,
            dataPath : "",
            isDataPathDefault : false
        }
    }

    public get status() {
        return computed(() => {
            if (this.state.resources.length === 0) {
                return RemoteResourceStatus.unknown
            }

            if (this.state.resources.filter(resource => resource.downloaded_file_bytes < resource.total_file_bytes ).length > 0) {
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

    public async fetch() {
        try {
            const result = await (await this.fetchApi("/resources")).json()
            this.state.resources = result["resources"]
            this.state.isDownloading = result["isDownloading"]
            this.state.downloadingPath = result["downloadingPath"]
            this.state.isDataPathDefault = result["isDataPathDefault"]
            this.state.dataPath = result["dataPath"]
        }
        catch (error) {
            this.state.resources = []
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