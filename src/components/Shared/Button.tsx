import { defineComponent, ButtonHTMLAttributes } from "vue"
import Spinner from "./Spinner"

export interface Props extends ButtonHTMLAttributes {
    title? : string
    small? : boolean
    destructive? : boolean
    isLoading? : boolean
}

export default (props : Props, context: { slots: { default: any } }) => {
  const noOp = () => {}

  const isLoading = typeof props.isLoading !== "undefined" ? props.isLoading : false
  const isDisabled = typeof props.disabled !== "undefined" ? props.disabled : false

  let className = "select-none relative leading-none tracking-tight font-semibold bg-transparent border px-3 rounded transition-all"

  if (props.destructive == true) {
    className += " " + "text-red-600 border-red-600"
  }
  else {
    className += " " + "text-blue-600 border-blue-600"
  }

  if (props.small) {
    className += " " + "py-1 text-xs"
  }
  else {
    className += " " + "py-2 text"
  }

  if (props.onClick) {
    const originalHandler = props.onClick

    props.onClick = (event : MouseEvent) => {
      event.preventDefault()

      if (isLoading === true || isDisabled === true) {
        return
      }

      originalHandler(event)
    }
  }

  if (isDisabled === true || isLoading === true) {
    className += " " + "opacity-50 cursor-default saturate-0"
  }
  else {
    className += " " + `${props.destructive === true ? "hover:bg-red-700" : "hover:bg-blue-700"} hover:text-white hover:border-transparent cursor-pointer`
  }

  if (props.class) {
    className += " " + props.class
    delete props.class
  }

  const renderContent = () => {
    if (typeof props.title !== "undefined") {
      return props.title
    } 

    return (context.slots.default || noOp)()
  }

  const renderLoadingIndicator = () => {
    if (isLoading === false) {
      return null
    }

    return <div class="absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-2/4">
      <Spinner class="w-4 h-4" />
    </div>
  }

  return <div class={className} {...props}>
      <span class={`${isLoading === true ? "invisible" : ""} drop-shadow-sm flex items-center justify-center`}>{renderContent()}</span>
      {renderLoadingIndicator()}
  </div>

}