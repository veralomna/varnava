import { HTMLAttributes } from "vue"

export interface Props extends HTMLAttributes {
    value? : number
    isIndefinite? : boolean
}

export default (props : Props) => {
    const indefiniteClassName = (typeof props.isIndefinite === "undefined" || props.isIndefinite === true) ? "animate-spin" : ""

    const backWidth = 11
    const frontWidth = 11
    const backColor = "stroke-white/50"
    const frontColor = "stroke-white"

    const offsetValue = 283 - (283 * (props.value || 0.4))

    return <div class={`relative ${props.class} ${indefiniteClassName}`}>
         <svg class={`absolute top-0 left-0 ${backColor}`} stroke-width={backWidth} viewBox="0 0 100 100" fill="transparent">
            <circle cx="50" cy="50" r="45" shape-rendering="geometricPrecision"></circle>
        </svg>
        <svg class={`transition absolute top-0 left-0 ${frontColor}`} style="transform: rotate(-90deg);" stroke-linecap="rounded" stroke-width={frontWidth} stroke-dashoffset={offsetValue} viewBox="0 0 100 100">
            <circle style="fill: none; stroke-dasharray: 283;" cx="50" cy="50" r="45" shape-rendering="geometricPrecision"></circle>
        </svg>
    </div>
}