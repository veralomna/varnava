import { Output } from "@/stores/OutputStore"
import Spinner from "@/components/Shared/Spinner"

enum OutputStatusIndicatorSize {
    small = "small",
    big = "big"
}

export interface Props {
    output : Output
    size? : "small" | "big"
}

export const OutputStatusIndicator = (props : Props) => {
    const size = typeof props.size === "undefined" ? "small" : props.size

    let spinnerSize = size === "big" ? "w-3.5 h-3.5" : "w-3 h-3"

    let label = "queued"
    let color = "bg-gray-700"
    let progress : JSX.Element | null = <Spinner class={spinnerSize} />

    if (props.output.progress > 0 && props.output.progress < 1) {
        label = "creating"
        color = "bg-orange-800"
        progress = <Spinner isIndefinite={false} value={props.output.progress} class={spinnerSize}  />
    }
    else if (props.output.progress >= 1) {
        label = "finished"
        color = "bg-green-900"
        progress = null
    }

    return <strong class={`flex items-center justify-center ${size === "big" ? "gap-1.5 text-xs px-2 py-1" : "gap-1.5 text-2xs px-1.5 py-0.5"} uppercase font-bold  ${color} rounded`}>
        {progress}
        {label}
    </strong>
}