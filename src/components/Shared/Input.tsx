import { defineComponent, ButtonHTMLAttributes, InputHTMLAttributes } from "vue"

export interface Props extends InputHTMLAttributes {
  multiline? : boolean
  fullwidth? : boolean
  onInputValue? : (value : string) => void
}

export default (props : Props) => {
  const isMultiline = props.multiline || false
  const isFullWidth = props.fullwidth || false

  let className = "transition-all bg-neutral-700 resize-none outline-none text-sm border border-gray-700 px-2 py-2 rounded focus:border-neutral-500"
  
  const handleInput = (event : Event) => {
    const target = event.target

    if (!target) {
        return
    }
    
    const value = (target as HTMLInputElement).value 
   
    props.onInputValue && props.onInputValue(value)    
    props.onInput && props.onInput(event)
  }

  if (props.class) {
    className += " " + props.class
    delete props.class
  }

  if (isFullWidth) {
    className += " " + "w-full"
  }

  if (isMultiline) {
    return <textarea class={className} {...props} onInput={handleInput}>{props.value || ""}</textarea>
  }
  else {
    return <input class={className} {...props} onInput={handleInput} />
  }
}