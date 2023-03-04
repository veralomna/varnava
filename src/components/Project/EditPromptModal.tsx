import { defineComponent, ref } from "vue"
import { Modal } from "@/utils/vue-modal"
import { Button } from "@/components/Shared"
import { projectStore } from "@/stores/ProjectStore"
import Dropdown, { DropdownItem } from "@/components/Shared/Dropdown"

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

        const updateMoveDestinationProject = (value) => {
            selectedMoveDestinationProject.value = value
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
                        <Dropdown onChange={this.updateMoveDestinationProject} title={this.projectState.projectsById[this.selectedMoveDestinationProject].title}>
                            {this.projectState.projects.map(project => {
                                return <DropdownItem isSelected={project.id === this.selectedMoveDestinationProject} value={project.id} title={project.title} />
                            })}
                        </Dropdown>
  
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