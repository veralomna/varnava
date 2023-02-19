import path from "path"

export const startFrontendServer = async (rootPath) => {
    const Vite = await import("vite")

    // Launching the app frontend
    const httpServer = await Vite.createServer({
        configFile: path.join(rootPath, "vite.config.js"),
        root: path.join(rootPath),
        mode: "development",
        server: {
            host: "0.0.0.0",
        }
    })
    
    await httpServer.listen()

    return httpServer
}