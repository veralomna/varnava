import { defineComponent, ref, computed, PropType } from "vue"
import { Modal } from "@/utils/vue-modal"
import { Input, Button, Label } from "@/components/Shared"
import { projectStore } from "@/stores/ProjectStore"

export default defineComponent({

    props: {
        finish : {
            type: Function,
            required: true,
        },
    },

    setup(props) {
        const title = ref("")

        const submit = async (event : Event) => {
            event.preventDefault()

            await projectStore.add({
                title: title.value
            })

            props.finish()
        }

        return {
            projectState : projectStore.getState(),
            title,
            submit
        }
    },

    render() {
        return <Modal class="w-124" closableWithBackground={true} title="Add Project" close={this.$props.finish}>
            <form autocomplete="off">
                <div class="mb-4">
                    <Label title="Project Title" for="title" />
                    <Input fullwidth value={this.title} onInputValue={value => this.title = value} name="title" type="text" />
                </div>

                <div class="flex">
                    <Button onClick={this.submit}
                            disabled={this.title.trim().length === 0 || this.projectState.isLoading == true}
                            class="ml-auto"
                            title="Add" />
                </div>
            </form>
        </Modal>
    }
})