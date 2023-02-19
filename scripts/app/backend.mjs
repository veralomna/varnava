import { spawn } from "child_process"
import getPort from "get-port"
import path from "path"
import { app, utilityProcess } from "electron"

export class BackendServer {

    // Informational state of a backend server.
    state = {
        progress : 0,
        status : "loading"
    }

    constructor(rootPath) {
        this.rootPath = rootPath
        this.dataPath = path.join(process.env["LOCALAPPDATA"], "veralomna", "varnava")
        this.pythonEnvPath = path.join(this.dataPath, "python-env")
        this.pythonScopedExecPath = path.join(this.pythonEnvPath, "Scripts", "python.exe")

        if (process.env.VARNAVA_ENV === "development") {
            this.installerScriptPath = path.join(this.rootPath, "scripts", "app", "backend-installer.cjs")
            this.serverScriptPath = path.join(this.rootPath, "server", "server.py")
        }
        else {
            this.installerScriptPath = path.join(app.getAppPath(), "backend-installer.cjs")
            this.serverScriptPath = path.join(app.getAppPath(), "server.pyz")
        }
    }

    async assignPort() {
        this.port = await getPort() 
    }
    
    async run() {
        const installer = utilityProcess.fork(this.installerScriptPath, {
            "stdio" : "pipe"
        })

        installer.on("message", message => {
            if (typeof message.update !== "undefined") {
                this.state = message.update

                if (this.state.status === "ready-to-launch") {
                    installer.kill()
                    this.runSync()
                }
            }
        })

        installer.stdout.on("data", data => {
            process.stdout.write(data.toString())
        })

        installer.stderr.on("data", data => {
            process.stderr.write(data.toString())
        })

        installer.on("error", () => {
            this.state.progress = 1.0
            this.state.status = "error"
        })
    }

    runSync() {
        // Launching server process

        const server = spawn(this.pythonScopedExecPath, [
            this.serverScriptPath,
        ], {
            env: {
                VARNAVA_SERVER_PORT : this.port,
                LOCALAPPDATA : process.env["LOCALAPPDATA"]
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
    }

}
