import { AlertActionOkay, useModal } from "@/utils/vue-modal"
import { defineComponent, ref, watch } from "vue"
import SettingsEditor from "./SettingsEditor"

export default defineComponent({

    props: {
        value : {
            type : String,
            required : true
        },
        onChange : {
            type : Function
        },
        onSubmit : {
            type : Function
        },
    },

    setup(props, ctx) {
        const modal = useModal()

        const textarea = ref<HTMLTextAreaElement>()
        
        watch(() => props.value, (value) => {
            if (value.length === 0 && typeof textarea.value !== "undefined") {
                textarea.value.value = ""
            }
            else {
                textarea.value.value = value
            }
        })

        const change = (event : Event) => {
            props.onChange && props.onChange((event.target as HTMLTextAreaElement).value)
        }

        const submit = (event : Event) => {
            if (textarea.value?.value.length === 0) {
                modal.presentAlert({
                    title: "Invalid prompt",
                    description: "Prompt value must not be empty 🤔.",
                    actions: [
                        AlertActionOkay
                    ]
                })
                return
            }

            props.onSubmit && props.onSubmit()
        }

        return {
            textarea,
            change,
            submit
        }
    },

    render() {
        const className = "relative overflow-y-auto no-scrollbar focus:outline-none\
                           focus:border-gray-700 border-gray-800 border w-full h-16 px-4 py-2\
                           resize-none rounded bg-gray-800 font-medium font-mono tracking-tight"

        return <div class="w-full">
            <div class="flex items-middle mt-4">
                <textarea placeholder="Enter prompt here" onInput={this.change} class={className} ref="textarea" ></textarea>

                <button onClick={this.submit} class="transition-all ml-4 bg-blue-700 hover:bg-blue-600 disabled:saturate-50 px-4 rounded font-medium">
                    Create
                </button>
            </div>
        </div>
    }

})