import { computed, defineComponent, ref, Transition, watch } from "vue"
import { RouterView, useRoute, useRouter } from "vue-router"
import { AlertActionOkay, useModal } from "@/utils/vue-modal"
import { projectStore } from "@/stores/ProjectStore"
import { PromptStore, Prompt, PromptGridSize } from "@/stores/PromptStore"
import { Output } from "@/stores/OutputStore"
import { AdjustmentsHorizontalIcon } from "@heroicons/vue/24/outline"
import { PromptEntry } from "./PromptEntry"
import EditProjectModal from "./EditProjectModal"
import PromptEditor from "@/components/Shared/PromptEditor"
import { settingsStore } from "@/stores/SettingsStore"
import { RemoteResourceStatus, RemoteResourceKind, resourcesStore } from "@/stores/ResourcesStore"
import useKeyDown from "@/utils/useKeydown"

export default defineComponent({

    setup(props, ctx) {
        const router = useRouter()
        const route = useRoute()
        const modal = useModal()

        let projectId = ref<string>(route.params.id as string || "")
        let promptStore = new PromptStore(projectId.value)

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

        const copyPrompt = async (existingPrompt : Prompt) => {
            prompt.value = existingPrompt.value

            document.getElementById("promptsContainer")?.scrollTo({
                top: -100,
                left: 0,
                behavior: "smooth"
            })
        }

        const generateOutput = (prompt : Prompt, count : number) => {
            if (resourcesStore.isResourceReady(RemoteResourceKind.preview) === false) {
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

        const highlightFocusedOutput = (newValue : string) => {
            const value = newValue.split(":")[0]

            const element = document.querySelector(`[data-output-id="${value}"]`)

            if (element === null) {
                return
            }

            const intersectionObserver = new IntersectionObserver(entries => {
                let [entry] = entries

                if (entry.isIntersecting === false) {
                    return
                }

                element.style = "filter: brightness(1.7); animation: smallwiggle 0.1s infinite; transition: all 0.3s ease-out;"

                setTimeout(() => {
                    element.style = "transition: all 0.3s ease-out;"
                }, 500)
        
                intersectionObserver.disconnect()
            })
     
            intersectionObserver.observe(element)
              
            element?.scrollIntoView({
                behavior: "auto",
                block: "center"
            })
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
            copyPrompt,
            generateOutput,
            showOutput,
            toggleGridSize,
            toggleCollapse,
            updateProject,
            highlightFocusedOutput
        }
    },

    beforeRouteUpdate(to, from, next) {
        const projectId = to.params.id
        const focusedOutputId = to.params.focusedOutputId

        if (projectId != this.projectId) {
            this.promptStore.updateProjectId(projectId)
            this.projectId = projectId
        }

        this.promptStore.fetch()

        setTimeout(() => {
            if (typeof focusedOutputId === "undefined") {
                return
            }

            this.highlightFocusedOutput(focusedOutputId)
        }, 100)
        
        next()
    },

    render() {
        const renderTitle = () => {
            return <div class="flex items-center">
                <h2 class="text-4xl font-semibold mr-4">{this.project.title}</h2>   
                <a class="pt-2 text-blue-500 hover:text-blue-400" href="#" onClick={this.openHome}>⤶ All Projects</a>
                <a class="ml-auto pt-2" href="#" onClick={this.openProjectSettings}>
                    <AdjustmentsHorizontalIcon class="hover:opacity-75 w-6 h-6" />
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
                                         onCopyPrompt={this.copyPrompt}
                                         onAddMore={(count : number) => { this.generateOutput(prompt, count) }} 
                                         onMoveToOtherProject={this.updateProject}
                                         project={this.project} 
                                         prompt={prompt}></PromptEntry>
                        </li>
                    })}
                </ul>
            }
        }

        return <article id="promptsContainer" class="flex flex-col h-full relative" style="padding-top: 48px; overflow: overlay; margin-right: -18px; padding-right: 18px;">
            {renderTitle()}
            <PromptEditor value={this.prompt} onSubmit={this.addPrompt} onChange={(value : string) => { this.prompt = value }} />
            {renderPrompts()}

            <RouterView />
        </article>
    }

})