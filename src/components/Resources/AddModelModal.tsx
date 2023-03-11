import { defineComponent, ref } from "vue"
import { Modal } from "@/utils/vue-modal"
import { Button, Input } from "@/components/Shared"
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/outline"
import Store from "@/stores/Store"
import { RemoteResourceStatus, RemoteResource, resourcesStore, DataPathUpdateStatus } from "@/stores/ResourcesStore"

export default defineComponent({

    props: {
        finish : {
            type: Function,
            required: true,
        },
        modal : Object
    },

    setup(props) {
        const id = ref("")
        const error = ref<string | null>(null)

        const openHub = (event : Event) => {
            const url = "https://huggingface.co/models?pipeline_tag=text-to-image&library=diffusers&sort=downloads"

            if (Store.isInApp === true) {
                window.app.open(url)
            }
            else {
                window.open(url, "_blank")
            }
        }

        const updateModelId = (event : Event) => {
            const target = event.target as HTMLInputElement

            id.value = target.value
            error.value = null
        }

        const submitModelId = async (event : Event) => {
            try {
                error.value = null

                await resourcesStore.addModel(id.value)

                props.finish()
            }
            catch (e) {
                error.value = e
            }
        }

        return {
            id,
            error,
            resourcesState : resourcesStore.getState(),
            openHub,
            updateModelId,
            submitModelId
        }
    },

    render() {
        return <Modal class="w-2/3" closableWithBackground={true} title="Add Model" close={this.finish}>
            <div class="text-sm leading-6">
                You can find all available models on 
                <a onClick={this.openHub} class="underline text-blue-600 hover:text-blue-500 ml-1 flex-inline items-center" href="#">
                    the HuggingFace hub
                    <ArrowTopRightOnSquareIcon class="inline-block ml-0.5 w-4 h-4 relative bottom-0.5" />
                </a>.
                <br />
                Paste the name of the model in the field below:
            </div>
            <div class="mt-2 flex">
                <input value={this.id} placeholder="stabilityai/stable-diffusion-2-1" onInput={this.updateModelId} class="block w-full focus:outline-none bg-gray-700 py-1.5 px-4 rounded" />
                <Button isLoading={this.resourcesState.isAdding} onClick={this.submitModelId} disabled={this.id.length === 0} class="shrink-0 ml-4" title="Add Model" />
            </div>
            {this.error ? <div class="mt-2 text-sm text-red-600">{this.error}</div> : null}
        </Modal>
    }

})