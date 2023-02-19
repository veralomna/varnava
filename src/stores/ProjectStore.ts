import Store from "./Store"
import { Prompt } from "./PromptStore"

export interface Project {
    id : string
    createdAt : Date
    title : string
    outputsCount : number
}

/* State */

export interface ProjectState extends Object {
    projects : Project[]
    projectsById : { [id : string] : Project }
    isLoading : boolean
    isPublishing : boolean
}

export class ProjectStore extends Store<ProjectState> {

    protected data() : ProjectState {
        return {
            projects : [],
            projectsById : {},
            isLoading : false,
            isPublishing : false
        }
    }

    public getProjectById(id : string) : Project {
        return this.state.projectsById[id]
    }

    public async fetch() {
        this.state.isLoading = true

        try {
            const result = await (await this.fetchApi("/projects")).json()
            const projects = result["projects"]

            this.state.projects = projects.map((item: Project) => {
                item["createdAt"] = new Date(item["createdAt"])
                this.state.projectsById[item.id] = item
                return item
            })
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public async add(project : Partial<Project>) {
        this.state.isPublishing = true

        try {
            const result = await this.fetchApi("/projects/add", { 
                method: "POST",
                body: JSON.stringify({
                    "title" : project.title
                })
            })

            this.fetch()
        }
        catch (error) {

        }
    
        this.state.isPublishing = false
    }

    public async update(project : Partial<Project>) {
        this.state.isLoading = true

        try {
            await this.fetchApi(`/projects/${project.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    title: project.title
                })
            })

            this.fetch()
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public async archive(project : Partial<Project>) {
        this.state.isLoading = true

        try {
            await this.fetchApi(`/projects/${project.id}`, {
                method: "DELETE"
            })

            this.fetch()
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public async movePrompt(promptId : Prompt, destinationProjectId : string) {
        try {
            await this.fetchApi(`/project/${destinationProjectId}/prompts/move`, {
                method: "POST",
                body: JSON.stringify({
                    "prompt_id" : promptId
                })
            })

            await this.fetch()
        }
        catch (error) {

        }
    }

}

export const projectStore = new ProjectStore()