import { reactive, readonly } from "vue"

export default abstract class Store<T extends Object> {

    static apiEndpoint = (() => {
        if (typeof window.app.apiEndpoint !== "undefined") {
            return window.app.apiEndpoint
        }
        else {
            return import.meta.env.VITE_VARNAVA_API_URL
        }
    })()

    static isInApp = (() => {
        return typeof window.app.apiEndpoint !== "undefined"
    })()

    protected state : T

    constructor() {
        let data = this.data()
        this.setup(data)

        this.state = reactive(data) as T
    }

    protected abstract data() : T

    protected setup(data : T) : void {
        //Implemented by concrete classes
    }
    
    public getState(): T {
        return readonly(this.state) as T
    }

    protected async fetchApi(input : string, options : any = {}) {
        return await window.fetch(`${Store.apiEndpoint}${input}`, options)
    }

}