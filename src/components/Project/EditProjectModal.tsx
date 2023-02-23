import { defineComponent, ref } from "vue"
import { Modal } from "@/utils/vue-modal"
import { Input, Button, Label } from "@/components/Shared"
import { projectStore } from "@/stores/ProjectStore"

export default defineComponent({

    props: {
        project : {
            type : Object,
            required: true
        },
        onArchive : {
            type : Function
        },
        finish : {
            type : Function,
            required : true,
        },
    },

    setup(props) {
        const title = ref(props.project.title)
  
        const update = async (event : Event) => {
            event.preventDefault()

            const updatedProject = props.project
            updatedProject.title =title

            await projectStore.update(updatedProject)
        }

        const archive = async (event : Event) => {
            event.preventDefault()
            
            if (confirm("Are you sure you want to archive the project?")) {
                await projectStore.archive(props.project)

                if (props.onArchive) {
                    props.onArchive()
                }
                
                props.finish()
            }

        }

        return {
            projectState : projectStore.getState(),
            title,
            update,
            archive
        }
    },

    render() {
        return <Modal class="w-124" closableWithBackground={true} title="Edit Project" close={this.$props.finish}>
            <form autocomplete="off">
                <div class="mb-4">
                    <Label title="Project Title" for="title" />
                    <Input fullwidth value={this.title} onInputValue={value => this.title = value} name="title" type="text" />
                </div>

                <div class="flex">
                    <Button onClick={this.archive}
                            destructive={true}
                            title="Archive Project" />

                    <Button onClick={this.update}
                            disabled={this.title.trim().length === 0 || this.projectState.isLoading == true}
                            class="ml-auto"
                            title="Update" />
                </div>
            </form>
        </Modal>
    }
})