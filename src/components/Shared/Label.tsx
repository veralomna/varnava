import { defineComponent, LabelHTMLAttributes } from "vue"

export interface Props extends LabelHTMLAttributes {
  title? : string
}

export default (props : Props, context: { slots: { default: any } }) => {

  const noOp = () => {}
  const className = "block text-gray-400 text-xxs font-semibold mb-1"

  return <label class={className}>
        {props.title ? (
          props.title
        ) : (
          (context.slots.default || noOp)()
        )}
  </label>

}