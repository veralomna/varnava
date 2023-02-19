import { computed, defineComponent, ref, Transition } from "vue"
import { RouterView, useRoute, useRouter } from "vue-router"
import { AlertActionOkay, useModal } from "@/stores/vue-modal"
import { projectStore } from "@/stores/ProjectStore"
import { PromptStore, Prompt, PromptGridSize } from "@/stores/PromptStore"
import { Output } from "@/stores/OutputStore"
import { AdjustmentsHorizontalIcon } from "@heroicons/vue/24/outline"
import { PromptEntry } from "./PromptEntry"
import EditProjectModal from "./EditProjectModal"
import PromptEditor from "@/components/Shared/PromptEditor"
import { settingsStore } from "@/stores/SettingsStore"
import { RemoteResourceStatus, resourcesStore } from "@/stores/ResourcesStore"
import useKeyDown from "@/stores/utils/useKeydown"

export default defineComponent({

    setup(props, ctx) {
        const router = useRouter()
        const route = useRoute()
        const modal = useModal()

        const projectId = ref<string>(route.params.id as string || "")
        const promptStore = new PromptStore(projectId.value)

        const prompt = ref("")

        if (projectStore.getState().projects.length == 0) {
            projectStore.fetch()
        }

        const project = computed(() => {
            return projectStore.getProjectById(projectId.value) || {}
        })

        useKeyDown([
            {
                key : "Escape",
                handler : () => {
                    if (route.name !== "output-details") {
                        return
                    }
                    console.log("WHY")
                    router.replace({
                        name: "project-details",
                        params: {
                            id: route.params.id
                        }
                    })
                } 
            },
            {
                key : "ArrowLeft",
                handler : () => {
                    if (route.name !== "output-details") {
                        return
                    }

                    const previousOutput = promptStore.getPreviousOutput(route.params.oid)

                    if (previousOutput !== null) {
                        router.replace({ name: "output-details", params: { "oid" : previousOutput.id } })
                    }
                }
            },
            {
                key : "ArrowRight",
                handler : () => {
                    if (route.name !== "output-details") {
                        return
                    }

                    const nextOutput = promptStore.getNextOutput(route.params.oid)

                    if (nextOutput !== null) {
                        router.replace({ name: "output-details", params: { "oid" : nextOutput.id } })
                    }
                }
            }
        ])

        const openHome = (event : MouseEvent) => {
            event.preventDefault()
            router.replace({ path: "/" })
        }

        const openProjectSettings = (event : MouseEvent) => {
            event.preventDefault()
            modal.present(EditProjectModal, { 
                project : project.value,
                onArchive : () => {
                    router.replace({ path: "/" })
                }
            })
        }

        const addPrompt = async () => {
            await promptStore.add(prompt.value)
            prompt.value = ""
        }

        const generateOutput = (prompt : Prompt, count : number) => {
            if (resourcesStore.status.value !== RemoteResourceStatus.ready) {
                const description = resourcesStore.status.value === RemoteResourceStatus.loading 
                    ? "Please wait for all models to download first." 
                    : "Please download all models first."

                modal.presentAlert({
                    title: "Cannot create images",
                    description: description,
                    actions: [
                        AlertActionOkay
                    ]
                })
                return
            }

            let settings = settingsStore.getLocalSettings(prompt.id)
            settings["batch"] = count

            promptStore.generate(prompt, settings)
        }

        const showOutput = (output : Output) => {
            router.push({ name: "output-details", params: { "oid" : output.id } })
        }

        const toggleGridSize = (prompt : Prompt) => {
            let currentState = promptStore.getPromptGridSize(prompt.id)

            if (currentState === PromptGridSize.small) {
                currentState = PromptGridSize.big
            }
            else {
                currentState = PromptGridSize.small
            }

            promptStore.setPromptGridSize(prompt.id, currentState)
        }

        const toggleCollapse = (prompt : Prompt) => {
            const currentState = promptStore.getPromptVisibility(prompt.id)
            promptStore.setPromptVisibility(prompt.id, !currentState)
        }

        const getPromptVisibility = (prompt : Prompt): Boolean => {
            const value = promptStore.getState().promptsVisibilityById[prompt.id]

            if (typeof value === "undefined") {
                return true
            }
            else {
                return value
            }
        }

        const getPromptGridSize = (prompt : Prompt) => {
            return promptStore.getPromptGridSize(prompt.id)
        }

        const updateProject = () => {
            promptStore.fetch()
            projectStore.fetch()
        }

        return {
            prompt,
            promptStore,
            projectId,
            project,
            promptState : promptStore.getState(),
            getPromptVisibility,
            getPromptGridSize,
            openHome,
            openProjectSettings,
            addPrompt,
            generateOutput,
            showOutput,
            toggleGridSize,
            toggleCollapse,
            updateProject
        }
    },

    beforeRouteUpdate(to, from, next) {
        this.promptStore.fetch()
        next()
    },

    render() {
        const renderTitle = () => {
            return <div class="flex items-center">
                <h2 class="text-4xl font-semibold mr-4">{this.project.title}</h2>   
                <a class="pt-2 text-blue-500 hover:text-blue-400" href="#" onClick={this.openHome}>⤶ All Projects</a>
                <a class="ml-auto pt-2" href="#" onClick={this.openProjectSettings}>
                    <AdjustmentsHorizontalIcon class=" w-6 h-6" />
                </a>
            </div>
        }

        const renderPrompts = () => {
            if (this.promptState.prompts.length === 0) {
                return <div class="mt-4 opacity-50 grow flex justify-center items-center">
                    No generated content yet.
                </div>
            }
            else {
                return <ul class="mt-6">
                    {this.promptState.prompts.map((prompt : Prompt) => {
                        return <li class="mb-6 pb-6 border-b border-neutral-800">
                            <PromptEntry isVisible={this.getPromptVisibility(prompt)} 
                                         gridSize={this.getPromptGridSize(prompt)} 
                                         onToggleGridSize={this.toggleGridSize} 
                                         onToggleCollapse={this.toggleCollapse} 
                                         onShowOutput={this.showOutput} 
                                         onAddMore={(count : number) => { this.generateOutput(prompt, count) }} 
                                         onMoveToOtherProject={this.updateProject}
                                         project={this.project} 
                                         prompt={prompt}></PromptEntry>
                        </li>
                    })}
                </ul>
            }
        }

        return <article class="flex flex-col h-full relative" style="padding-top: 48px; overflow: overlay; margin-right: -18px; padding-right: 18px;">
            {renderTitle()}
            <PromptEditor value={this.prompt} onSubmit={this.addPrompt} onChange={(value : string) => { this.prompt = value }} />
            {renderPrompts()}

            <RouterView />
        </article>
    }

})