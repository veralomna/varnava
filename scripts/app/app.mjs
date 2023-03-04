import path from "path"
import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from "electron"
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
    backgroundColor: "#171717",
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 24, y: 15 },
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

const makeMainMenu = () => {
  if (process.platform !== "darwin") {
    return
  }

  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteAndMatchStyle" },
        { role: "delete" },
        { role: "selectAll" },
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: "toggleDevTools" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
        { type: "separator" },
        { role: "window" }
      ]
    },
  ])

  Menu.setApplicationMenu(menu)
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

  // Making main menu on macOS
  makeMainMenu()

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

  ipcMain.handle("open", async (channel, link) => {
    shell.openExternal(link)
  })

  /* Global app messages */

  app.on("activate", () => {
    mainWindow.show()
  })

  app.on("quit", () => {
    server.shutdownSync()
  })

  app.on("window-all-closed", () => {
    app.quit()
  })

}

(async () => {
  await runApp()
})()