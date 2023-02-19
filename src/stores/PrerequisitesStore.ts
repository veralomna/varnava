import Store from "./Store"

export enum PrerequisitesStatus {
    loading = "loading",
    downloadingExecutables = "downloading-executables",
    preparingEnvironment = "preparing-environment",
    downloadingDependencies = "downloading-dependencies",
    launchingServer = "ready-to-launch",
    running = "running-server",
    error = "error"
}

export interface PrerequisitesState {
    status : PrerequisitesStatus
    progress : number
}

export class PrerequisitesStore extends Store<PrerequisitesState> {

    protected data() : PrerequisitesState {
        return {
            status : PrerequisitesStatus.loading,
            progress : 0.0 
        }
    }

    public async fetch() {
        if (typeof window.app.fetchPrerequisitesStatus === "undefined") {
            return
        }

        const result = await window.app.fetchPrerequisitesStatus()
        this.state.status = result["status"]
        this.state.progress = result["progress"]

        if (this.state.status !== PrerequisitesStatus.running) {
            setTimeout(() => {
                prerequisitesStore.fetch()
            }, 500)
        }
    }

}

export const prerequisitesStore = new PrerequisitesStore()