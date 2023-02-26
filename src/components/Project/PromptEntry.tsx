import { Prompt } from "@/stores/PromptStore"
import { Output } from "@/stores/OutputStore"
import { PlusCircleIcon, MinusCircleIcon, SquaresPlusIcon, DocumentDuplicateIcon, StarIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import SettingsEditor from "@/components/Shared/SettingsEditor"
import { PromptGridSize } from "@/stores/PromptStore"
import { Project } from "@/stores/ProjectStore"
import { useModal } from "@/utils/vue-modal"
import EditPromptModal from "./EditPromptModal"
import { Transition } from "vue"
import Store from "@/stores/Store"
import { OutputStatusIndicator } from "@/components/Output/OutputStatusIndicator"
import { settingsStore } from "@/stores/SettingsStore"

interface Props {
    prompt : Prompt
    project : Project
    gridSize : PromptGridSize
    index : number
    isVisible : Boolean
    onAddMore : Function
    onShowOutput : Function
    onMoveToOtherProject : Function
    onToggleCollapse : Function
    onToggleGridSize : Function
    onCopyPrompt : Function
}

export const PromptEntry = (props : Props) => {
    const modal = useModal()

    const renderGridSizeToggle = () => {
        const renderLabel = () => {
            if (props.gridSize === "small") {
                return "4"
            }
            else {
                return "2"
            }
        }
    
        return <span class="hover:opacity-75 mt-0.5 border-[1.5px] border-white w-5 h-5 text-xs rounded-md text-white font-bold flex items-center justify-center">{renderLabel()}</span>
    }

    const renderCopyPrompt = () => {
        return <DocumentDuplicateIcon class="hover:opacity-75 mt-0.5 w-5 h-5" />
    }

    const renderOptions = () => {
        return <EllipsisVerticalIcon onClick={() => { modal.present(EditPromptModal, { prompt : props.prompt, project : props.project, onMove : props.onMoveToOtherProject }) }} class="w-6 h-6 hover:opacity-75" />
    }

    const renderActions = () => {
        return <div class="select-none ml-auto pl-2 grow-0 shrink-0 flex flex-col items-end">
            <div class="flex gap-2">
                <a class="mr-1.5" onClick={() => { props.onCopyPrompt(props.prompt) }} href="#">
                    {renderCopyPrompt()}
                </a>
                <a onClick={() => { props.onToggleGridSize(props.prompt) }} href="#">
                    {renderGridSizeToggle()}
                </a>
                <a href="#">
                    {renderOptions()}
                </a>
            </div>
            <div class="mt-auto font-regular gap-3 leading-5 text-lg font-medium font-mono">
                <button class="block px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-center rounded flex justify-center items-center" onClick={event => { event.preventDefault(); props.onAddMore(1) }}>
                    <SquaresPlusIcon class="rotate-180 w-5 h-5" />
                </button>
            </div>
        </div>
    }

    const renderStats = () => {
        return <div class="ml-auto pl-4 grow-0 shrink-0 flex items-end">
            <div class="text-neutral-400 font-medium px-3 py-1 bg-neutral-800 rounded">
                {props.prompt.outputs.length} {props.prompt.outputs.length > 1 ? "images" : "image"}
            </div>
        </div>
    }

    const renderPromptValue = () => {
        return <div style={`z-index: ${10000 - props.index};`} class={`backdrop-blur-md flex sticky ${Store.isInApp === true ? "top-[-3px] py-2" : "top-[-19px] py-2"} bg-neutral-900/[.9]`}> 
            <div class="flex flex-col justify-between">
                <h2 class="text-s font-mono tracking-tight leading-5"> 
                    <a onClick={() => { props.onToggleCollapse(props.prompt) }} class="cursor-pointer hover:brightness-75" href="#">
                        {
                            props.isVisible === true ? 
                            <MinusCircleIcon class="w-5 h-5 mr-2 inline-block relative bottom-0.5" /> :
                            <PlusCircleIcon class="w-5 h-5 mr-2 inline-block relative bottom-0.5" /> 
                        }
                    </a>
                    <span>{props.prompt.value}</span>
                </h2>
                <SettingsEditor isDisabled={props.isVisible === false} id={props.prompt.id} />
            </div>
            {props.isVisible === true ? 
                renderActions() : 
                renderStats()
            }
        </div>
    }

    const renderOutputs = () => {
        if (props.isVisible === false) {
            return null
        }

        let className = "pt-4 grid grid-flow-row-dense grid-cols-4 gap-5"

        if (props.gridSize == PromptGridSize.big) {
            className = "pt-4 grid grid-flow-row-dense grid-cols-2 gap-5"
        }

        if (props.prompt.outputs.length === 0) {
            return <div class="h-36 opacity-50 flex justify-center items-center select-none">
                No generated content here yet.
            </div>
        }

        return <div class={className}>
            {props.prompt.outputs.map(output => {
                return renderOutput(output)
            })}
        </div>
    }

    const renderOutput = (output : Output) => {
        const renderFavoriteIndicator = () => {
            if (output.isFavorite === false) {
                return null
            }

            return <StarIcon class="absolute top-4 right-4 w-6 h-6 fill-white box-shadow-md" />
        }

        const renderLoadingProgress = () => {
            if (output.progress === 1) {
                return null
            }

            return <div class="absolute left-2 top-2">
                <OutputStatusIndicator size="big" output={output} />
            </div>
        }
        
        return <div data-output-id={output.id} onClick={() => { props.onShowOutput(output) }} class="group/output relative cursor-pointer bg-neutral-800 aspect-square flex justify-center items-center rounded">
            {output.progress > 0 &&
                <img class="rounded object-contain w-full h-full" alt="" src={`${Store.apiEndpoint}/outputs/${output.url}?progress=${output.progress}`} />
            }
            {renderFavoriteIndicator()}
            {renderLoadingProgress()}
        </div>
    }
    
    return <div>
        {renderPromptValue()}
        <Transition name="fade">
            {renderOutputs()}
        </Transition>
    </div>
}
