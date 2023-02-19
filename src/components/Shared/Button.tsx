import { defineComponent, ButtonHTMLAttributes } from "vue"

export interface Props extends ButtonHTMLAttributes {
    title? : string
    small? : boolean
    destructive? : boolean
}

export default (props : Props, context: { slots: { default: any } }) => {
  const noOp = () => {}

  let className = `leading-none tracking-tight font-semibold bg-transparent
                   ${props.destructive === true ? "text-red-600 border-red-600" : "text-blue-600 border-blue-600"}
                   border px-3 rounded transition-all`

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

      if (typeof props.disabled !== "undefined" && props.disabled !== false) {
        return
      }

      originalHandler(event)
    }
  }

  if (props.disabled) {
    className += " " + "opacity-25 cursor-default"
  }
  else {
    className += " " + `${props.destructive === true ? "hover:bg-red-700" : "hover:bg-blue-700"} hover:text-white hover:border-transparent`
  }

  if (props.class) {
    className += " " + props.class
    delete props.class
  }

  return (
    <a href="#" class={className} {...props}>
      {props.title ? (
        props.title
      ) : (
        (context.slots.default || noOp)()
      )}
    </a>
  )

}