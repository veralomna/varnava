import { defineComponent, ref } from "vue"
import { Modal } from "@/stores/vue-modal"
import { Input, Button, Label } from "@/components/Shared"
import { Prompt } from "@/stores/PromptStore"
import { projectStore } from "@/stores/ProjectStore"

export default defineComponent({

    props: {
        prompt : {
            type : Object,
            required : true
        },
        project : {
            type : Object,
            required : true
        },
        onMove : {
            type : Function,
            required : true
        },
        finish : {
            type : Function,
            required : true,
        },
    },

    setup(props) {
        const value = props.prompt.value

        const selectedMoveDestinationProject = ref<string>(props.project.id)

        const move = async (event : Event) => {
            event.preventDefault()          
            await projectStore.movePrompt(props.prompt.id, selectedMoveDestinationProject.value)  
            props.onMove(props.prompt)
            props.finish()
        }

        const updateMoveDestinationProject = (event : Event) => {
            event.preventDefault()

            const target = event.target as HTMLSelectElement
            selectedMoveDestinationProject.value = target.value
        }

        return {
            prompt : props.prompt,
            projectId : props.project.id,
            projectState : projectStore.getState(),
            selectedMoveDestinationProject,
            updateMoveDestinationProject,
            move
        }
    },

    render() {
        return <Modal class="w-3/4" closableWithBackground={true} title="Edit Prompt Settings" close={this.$props.finish}>
            <form autocomplete="off">
                <div class="mb-4">
                    <span class="block border-l-2 font-mono text-sm px-4 py-1 bg-neutral-800">{this.prompt.value}</span>
                </div>

                <div class="mb-4">
                    <h3 class="">Move Prompt</h3>
                    <div class="flex mt-4">
                        <select onChange={this.updateMoveDestinationProject} class="w-full pl-2 border-r-[10px] border-neutral-500/0 rounded drop-shadow-md bg-gray-700 duration-300 hover:bg-gray-600 focus:bg-gray-600 focus:ring-0 text-white">
                            {this.projectState.projects.map(project => {
                                return <option value={project.id} selected={project.id === this.projectId}>{project.title} {project.id === this.projectId ? "(current)" : ""}</option>
                            })}
                        </select>
                        <Button class="ml-4 shrink-0" 
                                onClick={this.move}
                                disabled={this.selectedMoveDestinationProject === this.projectId}
                                title="Move Prompt" />
                    </div>
                </div>
            </form>
        </Modal>
    }
})