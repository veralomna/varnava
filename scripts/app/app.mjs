import path from "path"
import { app, BrowserWindow, ipcMain, dialog } from "electron"
import { fileURLToPath } from "url"
import Store from "electron-store"
import { BackendServer } from "./backend.mjs"
import { startFrontendServer } from "./frontend.mjs"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const rootPath = path.join(__dirname, "..", "..")

const makeMainWindow = async () => {
 
  const store = new Store({
    name: "veralomna-varnava"
  })

  const instanceLock = app.requestSingleInstanceLock()

  if (!instanceLock) {
    app.quit()
    return
  }

  await app.whenReady()

  const mainWindow = new BrowserWindow({
    width: 980,
    height: 1000,
    minWidth: 800,
    minHeight: 500,
    autoHideMenuBar : true,
    title: "VARNAVA",
    backgroundColor: "#000000",
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: path.resolve(path.join(__dirname, "ipc.mjs"))
    }
  })

  mainWindow.setBounds(store.get("bounds"))

  mainWindow.on("resize", () => {
    store.set("bounds", mainWindow.getBounds())
  })

  mainWindow.on("move", () => {
    store.set("bounds", mainWindow.getBounds())
  })

  return mainWindow
}

const runApp = async () => {
  // Starting server
  const server = new BackendServer(rootPath)
  await server.assignPort()

  // Basic environment variables
  process.env["VITE_VARNAVA_HOST"] = "app"
  process.env["VITE_VARNAVA_API_URL"] = `http://127.0.0.1:${server.port}`

  // Creating window
  const mainWindow = await makeMainWindow()

  if (process.env.VARNAVA_ENV === "development") {
    // Launching front end server to allow quick debugging
    const frontendServer = await startFrontendServer(rootPath)
    mainWindow.loadURL(`http://localhost:${frontendServer.config.server.port}`)
  }
  else {
    // Using packaged front end
    mainWindow.loadFile(path.join(app.getAppPath(), "build", "dist", "index.html"))
  }

  // Running server
  server.run()

  /* IPC messages */

  ipcMain.on("control", (event, args) => {
    if (args === "minimise") {
      mainWindow.minimize()
    }
    else if (args === "maximise") {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
    else {
      mainWindow.close()
    }
  })

  ipcMain.handle("show-dialog", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Select data directory for Varnava",
      properties: ["openDirectory", "dontAddToRecent"]
    })

    return result.filePaths[0]
  })

  ipcMain.handle("fetchPrerequisitesStatus", async () => {
    return server.state
  })

  /* Global app messages */

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit()
    }
  })

}

(async () => {
  await runApp()
})()