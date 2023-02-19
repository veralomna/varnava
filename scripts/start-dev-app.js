import path from "path"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import electron from "electron"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const electronServer = spawn(electron, [
    path.join(__dirname, "app", "app.cjs")
], {
    env: {
        VARNAVA_ENV : "development",
        LOCALAPPDATA : process.env["LOCALAPPDATA"]
    }
})

electronServer.stdout.on("data", data => 
    process.stdout.write("[ELC]" + data.toString())
)

electronServer.stderr.on("data", data => 
    process.stderr.write("[ELC]" + data.toString())
)

electronServer.on("exit", () => {
    process.exit()
})