import { HTMLAttributes } from "vue"

export interface Props extends HTMLAttributes {
    value : number
}

export default (props : Props) => {
    return <div class={`relative w-full h-1.5 rounded bg-neutral-600 overflow-hidden ${props.class}`}>
        <span style={`width:${props.value*100}%`} class="transition-all bg-blue-600 absolute top-0 left-0 bottom-0"></span>
    </div>
}