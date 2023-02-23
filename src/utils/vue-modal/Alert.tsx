import Modal from "./Modal" 
import { defineComponent, PropType } from "vue"
import { Button } from "@/components/Shared"

export interface AlertAction {
  name: string
  type: "normal" | "destructive" | "positive"
}

export interface AlertInfo {
  title : string
  description? : string
  actions: AlertAction[]
}

export const AlertActionOkay : AlertAction = {
  name: "Okay",
  type: "positive"
}

export const AlertActionCancel : AlertAction = {
  name: "Cancel",
  type: "normal"
}

export const Alert = defineComponent({ 

  props: {
    finish: {
      type: Function,
      required: true,
    },
    info : {
      type: Object as PropType<AlertInfo>,
      required: true
    }
  },

  render() {
    const info = this.$props.info
  
    return <Modal showsCloseButton={false} class="w-1/2" close={this.$props.finish} closableWithBackground={false} title={info.title}>
      <div class="content-box max-w-16">
        {info.description && (
          <p>{info.description}</p>
        )}
        <div class="mt-4 flex justify-end align-center">
          
          {info.actions.map(action => {
            let isDestructive = false

            if (action.type === "destructive") {
              isDestructive = true
            }

            return <Button title={action.name} destructive={isDestructive} class="ml-4" onClick={() => this.$props.finish(action)} />
          })}
        </div>
      </div>
    </Modal>
  }

})