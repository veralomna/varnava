import { Prompt } from "@/stores/PromptStore"
import { Output } from "@/stores/OutputStore"
import { PlusCircleIcon, MinusCircleIcon, SquaresPlusIcon, Squares2X2Icon, Square2StackIcon, StarIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { StarIcon as OutlineStartIcon } from "@heroicons/vue/24/outline"
import SettingsEditor from "@/components/Shared/SettingsEditor"
import { PromptGridSize } from "@/stores/PromptStore"
import { Project } from "@/stores/ProjectStore"
import { useModal } from "@/stores/vue-modal"
import EditPromptModal from "./EditPromptModal"
import { Transition } from "vue"
import LinearProgress from "../Shared/LinearProgress"
import Store from "@/stores/Store"

interface Props {
    prompt : Prompt
    project : Project
    gridSize : PromptGridSize
    isVisible : Boolean
    onAddMore : Function
    onShowOutput : Function
    onMoveToOtherProject : Function
    onToggleCollapse : Function
    onToggleGridSize : Function
}

export const PromptEntry = (props : Props) => {
    const modal = useModal()

    const renderGridSizeToggle = () => {
        if (props.gridSize === "small") {
            return <Squares2X2Icon class="w-6 h-6 hover:opacity-75" />
        }
        else {
            return <Square2StackIcon class="w-6 h-6 hover:opacity-75" />
        }
    }

    const renderFavoriteToggle = () => {
        return null
        //if (props.gridSize === "small") {
         //   return <OutlineStartIcon class="w-6 h-6 hover:opacity-75" />
        //}
        //else {
        //    return <Square2StackIcon class="w-6 h-6" />
        //}
    }

    const renderOptions = () => {
        return <EllipsisVerticalIcon onClick={() => { modal.present(EditPromptModal, { prompt : props.prompt, project : props.project, onMove : props.onMoveToOtherProject }) }} class="w-6 h-6 hover:opacity-75" />
    }

    const renderActions = () => {
        return <div class="ml-auto grow-0 shrink-0 flex flex-col items-end">
            <div class="flex gap-2">
                <a onClick={() => { }} href="#">
                    {renderFavoriteToggle()}
                </a>
                <a onClick={() => { props.onToggleGridSize(props.prompt) }} href="#">
                    {renderGridSizeToggle()}
                </a>
                <a href="#">
                    {renderOptions()}
                </a>
            </div>
            <div class="mt-auto grid grid-cols-2 font-regular gap-3 leading-5 text-lg font-medium font-mono">
                <button class="block px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-center rounded flex justify-center items-center" onClick={event => { event.preventDefault(); props.onAddMore(1) }}>
                    <SquaresPlusIcon class="rotate-180 w-5 h-5 mr-2" /> 1
                </button>
                <button class="block px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-center rounded flex justify-center items-center" onClick={event => { event.preventDefault(); props.onAddMore(2) }}>
                    <SquaresPlusIcon class="rotate-180 w-5 h-5 mr-2" /> 2
                </button>
            </div>
        </div>
    }

    const renderStats = () => {
        return <div class="ml-auto pl-4 grow-0 shrink-0 flex items-end">
            <div class="text-neutral-400 text-lg font-medium font-mono px-4 py-2 bg-neutral-800 text-center rounded flex justify-center items-center leading-5">
                <Squares2X2Icon class="w-5 h-5 mr-2" /> {props.prompt.outputs.length}
            </div>
        </div>
    }

    const renderPromptValue = () => {
        return <div class={`backdrop-blur-md flex sticky ${Store.isInApp === true ? "top-[-3px] py-2" : "top-[-19px] py-2"} bg-neutral-900/[.9] z-50`}> 
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

            return <StarIcon class="absolute top-4 right-4 w-6 h-6 fill-white drop-shadow-md" />
        }

        const renderLoadingProgress = () => {
            if (output.progress === 1) {
                return null
            }

            return <div class="absolute bottom-4 left-4 right-4">
                <LinearProgress value={output.progress} />
            </div>
        }
        
        return <div onClick={() => { props.onShowOutput(output) }} class="relative cursor-pointer bg-neutral-800 aspect-square flex justify-center items-center rounded">
            {output.progress > 0 &&
                <img class="rounded object-contain w-full h-full" alt="" src={`${Store.apiEndpoint}/outputs/${output.url}?date=${output.progress}`} />
            }
            {renderFavoriteIndicator()}
            {renderLoadingProgress()}
        </div>
    }
    
    return <div class="group">
        {renderPromptValue()}
        <Transition name="fade">
            {renderOutputs()}
        </Transition>
    </div>
}
