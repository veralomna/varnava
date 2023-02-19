import path from "path"
import getPort from "get-port"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { startFrontendServer } from "./app/frontend.mjs"
import { getDataPath } from "./app/utils/paths.mjs"

const rootPath = path.join(fileURLToPath(new URL(".", import.meta.url)), "..")

// Server port
const port = await getPort() 

// Getting server port to run it on.
const server = spawn("python", [
    path.join(rootPath, "server", "server.py"),
], {
    env: {
        VARNAVA_SERVER_PORT : port,
        VARNAVA_DATA_PATH : getDataPath()
    }
})

server.stdout.on("data", data => {
    const value = data.toString()
    process.stdout.write(value)

    if (value.includes("Ready") === true) {
        this.state.progress = 1.0
        this.state.status = "running-server"
    }
})

server.stderr.on("data", data => {
    process.stderr.write(data.toString())
})

// Setting environment variables about the context of our run.
process.env["VITE_VARNAVA_API_URL"] = `http://127.0.0.1:${port}`
process.env["VITE_VARNAVA_HOST"] = "web"

// Running frontend server
const httpServer = await startFrontendServer(rootPath)

console.log(`Frontend url: ${httpServer.resolvedUrls.local}.`)
console.log(`Backend url: ${process.env["VITE_VARNAVA_API_URL"]}/.`)