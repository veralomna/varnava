const { contextBridge, ipcRenderer, } = require("electron")

contextBridge.exposeInMainWorld("app", {
    /* Server endpoint */
    
    apiEndpoint : process.env["VITE_VARNAVA_API_URL"],
    platform : process.platform,

    /* Window controls */

    send: (action) => {
        ipcRenderer.send("control", action)
    },

    showOpenFileDialog: async () => {
        return await ipcRenderer.invoke("show-dialog")
    },

    /* Prerequisites */

    fetchPrerequisitesStatus: async () => {
        return await ipcRenderer.invoke("fetchPrerequisitesStatus")
    }

})