import { createApp, defineComponent } from "vue"
import { provideModal } from "@/utils/vue-modal"
import { router } from "@/router"

import "@/utils/MessagingClient"
import "@/assets/css/base.css"

import App from "@/components/App"

const app = createApp(defineComponent({

    setup() { 
        provideModal(app)
    },

    render() {
        return <App />
    }
    
}))

app.use(router)
app.mount("#app")