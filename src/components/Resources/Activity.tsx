import { ButtonHTMLAttributes, defineComponent, ref, Transition } from "vue"
import { ClockIcon, ViewfinderCircleIcon } from '@heroicons/vue/24/solid'
import { Output, OutputType } from "@/stores/OutputStore"
import { activityStore } from "@/stores/ActivityStore"
import Store from "@/stores/Store"
import { DateTime } from "luxon"
import { OutputStatusIndicator } from "@/components/Output/OutputStatusIndicator"
import { useRouter } from "vue-router"

export interface Props extends ButtonHTMLAttributes {

}

export default defineComponent({

    setup(props : Props, ctx) {
        const router = useRouter()

        const isOpen = ref(true)

        activityStore.fetch()

        const showOutput = (output : Output) => {
            const projectId = output.prompt.project.id

            // Adding a 'pin' to output ID to make sure the route is updated every navigation 
            // even if the same output is selected.
            const outputId = `${output.parent?.id || output.id}:${new Date().getTime()}`
 
            router.push({
                name: "project-details", 
                params: { 
                    id: projectId,
                    focusedOutputId: outputId
                },
                
            })
        }

        const toggleOpen = (event : MouseEvent) => {
            if (isOpen.value === false) {
                isOpen.value = true
            }
            else {
                isOpen.value = false
            }
        }

        const onDocumentClick = (event : MouseEvent) => {
            const target = event.target as HTMLElement

            if (isOpen.value === false) {
                return
            }
  
            if (target.closest("[data-activity-list]") !== null) {
                return
            }

            if (target.closest("[data-activity-list-button]") !== null) {
                return
            }
 
            isOpen.value = false
        }

        document.addEventListener("click", onDocumentClick)

        return {
           activityState : activityStore.getState(),
           unfinishedOutputsCount : activityStore.unfinishedOutputsCount,
           isOpen,
           toggleOpen,
           onDocumentClick,
           showOutput
        }
    },

    beforeUnmount() {
        document.removeEventListener("click", this.onDocumentClick)
    },
    
    render() {
        const renderActivityEntry = (output : Output) => {
            const relativeTime = DateTime.fromJSDate(output.createdAt).toRelative({
                base: DateTime.local(),
                style: "short"
            })

            return <div class="flex flex-row p-2">
                <span class={`relative h-20 bg-cover aspect-[1] bg-black rounded`} style={`background-image: url("${Store.apiEndpoint}/outputs/${output.url}?progress=${output.progress}")`}>
                    {output.type === OutputType.upscale ? <span class="absolute right-1 top-1 tracking-tight text-3xs font-mono uppercase font-bold box-shadow-2xl bg-neutral-800/50 px-1">upscale</span> : null }
                </span>
                <div class="pl-4 flex flex-col items-end">
                    <strong class="text-sm w-full" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">{output.prompt.project.title}</strong>
                    <strong class="mt-0.5 leading-tight text-xs font-mono" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{output.prompt.value}</strong>
                    <div class="mt-auto w-full flex items-center justify-between">
                        <OutputStatusIndicator output={output} />
                        <span class="opacity-50 text-xs">{relativeTime}</span> 
                    </div>
                </div>
            </div>
        }
        
        const renderActivityList = () => {
            return <div data-activitiy-list="true" class={`${this.isOpen === true ? "visible opacity-100" : "invisible opacity-0"} transition-all absolute top-9 left-1/2 shadow-2xl shadow-black w-80`} style="transform: translateX(-50%)">
                <div class="relative left-1/2 -ml-2 w-4 border-solid border-b-neutral-800 border-b-8 border-x-transparent border-x-8 border-t-0" />
                <ul class="divide-y divide-neutral-700/50 divide-solid max-h-96 bg-neutral-800 rounded z-50 overflow-y-scroll" style="overflow:overlay;">
                {this.activityState.outputs.map(output => {
                    return <li onClick={() => { this.showOutput(output) }} class="px-2 hover:bg-neutral-700/25 cursor-pointer">
                        {renderActivityEntry(output)}
                    </li>
                })}
                </ul>
            </div>
        }
        
        const openedClassName = this.isOpen === true ? "bg-neutral-700" : "bg-neutral-800 hover:bg-neutral-700" 
        const hasUnfinishedClassName = this.unfinishedOutputsCount > 0 ? "text-orange-300" : ""

        return <div class="relative">
            <div data-activity-list-button="true" onClick={this.toggleOpen} class={`text-xs font-semibold cursor-pointer py-[6.5px] px-3 ${openedClassName} ${hasUnfinishedClassName} flex font-bold items-center rounded-lg`}>
                <ClockIcon class={`w-4 h-4 ${this.unfinishedOutputsCount > 0 ? "mr-1 animate-wiggle" : ""} transform-gpu`} /> {this.unfinishedOutputsCount > 0 ? this.unfinishedOutputsCount : ""}
            </div>
            {renderActivityList()}

        </div>
    }

})