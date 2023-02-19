import { computed, defineComponent, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Project, projectStore } from "@/stores/ProjectStore"
import { useModal } from "@/utils/vue-modal"
import ProjectEntry from "./ProjectEntry"
import AddProjectModal from "./AddProjectModal"
import { RemoteResourceStatus, resourcesStore } from "@/stores/ResourcesStore"

export default defineComponent({

    setup() {
        const router = useRouter()
        const route = useRoute()
        const modal = useModal()

        projectStore.fetch()

        const selectedProjectId = ref<string>(route.params.id as string || "")

        watch(() => route.params, params => {
            selectedProjectId.value = params.id as string || ""
        })

        watch(() => resourcesStore.status.value, status => {
            if (status !== RemoteResourceStatus.unknown) {
                projectStore.fetch()
            }
        })

        const addProject = () => {
            modal.present(AddProjectModal, {})
        }

        const selectProject = (id : string) => {
            router.push({ name: "project-details", params: { id } })
        }

        return {
            projectsState: projectStore.getState(),
            selectedProjectId,
            selectProject,
            addProject
        }
    },

    render() {
        const renderAddProjectEntry = () => {
            return <li onClick={() => this.addProject()} key="add-project" class="cursor-pointer hover:bg-blue-700 rounded-lg border-neutral-700 border border-dashed hover:border-solid">
                <ProjectEntry title="Create Project" subtitle="And Start Imagining" />
            </li>
        }

        const renderProjectEntry = (project : Project) => {
            const subtitle = `${project.outputsCount} images`

            return <li onClick={() => this.selectProject(project.id)} key={project.id} class="cursor-pointer bg-neutral-800 hover:bg-blue-800 rounded-lg border border-neutral-700">
                <ProjectEntry title={project.title} subtitle={subtitle} />
            </li>
        }

        return <ul class="grid grid-cols-3 gap-4 mt-14">  
            {renderAddProjectEntry()}
            {this.projectsState.projects.map((project : Project) => {
                return renderProjectEntry(project)
            })}
        </ul>
    }

})