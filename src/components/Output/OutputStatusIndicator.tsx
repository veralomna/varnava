import { Output } from "@/stores/OutputStore"
import Spinner from "@/components/Shared/Spinner"

export interface Props {
    output : Output
}

export const OutputStatusIndicator = (props : Props) => {
    let label = "queued"
    let color = "bg-gray-700"
    let progress : JSX.Element | null = <Spinner class="w-3 h-3"  />

    if (props.output.progress > 0 && props.output.progress < 1) {
        label = "creating"
        color = "bg-orange-800"
        progress = <Spinner isIndefinite={false} value={props.output.progress} class="w-3 h-3"  />
    }
    else if (props.output.progress === 1) {
        label = "finished"
        color = "bg-green-900"
        progress = null
    }

    return <strong class={`flex items-center justify-center gap-1.5 uppercase tracking-tight font-bold text-3xs px-1.5 py-0.5 ${color} rounded`}>
        {progress}
        {label}
    </strong>
}