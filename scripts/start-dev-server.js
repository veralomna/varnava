import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import { startFrontendServer } from "./app/frontend.mjs"
import getPort from "get-port"

const rootPath = path.join(fileURLToPath(new URL(".", import.meta.url)), "..")

// Server port
const port = await getPort() 

// Getting server port to run it on.
spawn("python", [
    path.join(rootPath, "server", "server.py"),
], {
    env: {
        VARNAVA_SERVER_PORT : port,
        LOCALAPPDATA : process.env["LOCALAPPDATA"]
    }
})

// Setting environment variables about the context of our run.
process.env["VITE_VARNAVA_API_URL"] = `http://127.0.0.1:${port}`
process.env["VITE_VARNAVA_HOST"] = "web"

// Running frontend server
const httpServer = await startFrontendServer(rootPath)

console.log(`Frontend url: ${httpServer.resolvedUrls.local}.`)
console.log(`Backend url: ${process.env["VITE_VARNAVA_API_URL"]}/.`)