import fs from "fs"
import fetch from "node-fetch"
import path from "path"
import ProgressTracker from "./utils/progress.mjs"
import { pipeline } from "node:stream"
import { promisify } from "node:util"
import { execSync, spawn, spawnSync } from "child_process"

export class BackendInstaller {

    // All required Python packages
    requiredPackages = [
        {"name": "transformers", "version": "4.25.1"},
        {"name": "accelerate", "version": "0.15.0"}, 
        {"name": "diffusers", "version": "0.12.1"},
        {"name": "einops", "version": "0.6.0"},
        {"name": "ftfy", "version": "6.1.1"},
        {"name": "huggingface-hub", "version": "0.12.0rc0"},
        {"name": "ninja", "version": "1.10.2.4"},
        {"name": "peewee", "version": "3.15.4"},
        {"name": "Pillow", "version": "9.2.0"},
        {"name": "sanic", "version": "22.9.0"},  
        {"name": "sanic-ext", "version": "22.12.0"},
        {"name": "tqdm", "version": "4.64.1"}, 
        {"name": "mashumaro", "version": "3.3"},
        {"name": "torch", "command" : ["--pre", "torch", "torchaudio", "torchvision", "--index-url", "https://download.pytorch.org/whl/nightly/cu118"]},
    ]

    progress = new ProgressTracker()
    status = "loading"
    
    set progressTitle(value) {
        this.status = value
        this.progress.emit("update")
    }

    constructor() {
        this.dataPath = path.join(process.env["LOCALAPPDATA"], "veralomna", "varnava")
        this.logPath = path.join(this.dataPath, "log")

        this.pythonPath = path.join(this.dataPath, "python")
        this.pythonExecPath = path.join(this.pythonPath, "python.exe")
        this.pythonEnvPath = path.join(this.dataPath, "python-env")
        
        this.pythonScopedExecPath = path.join(this.pythonEnvPath, "Scripts", "python.exe")
        this.pipScopedExecPath = path.join(this.pythonEnvPath, "Scripts", "pip.exe")

        fs.mkdirSync(this.dataPath, {
            recursive: true
        })

        this.progress.on("update", () => {
            if (typeof process.parentPort === "undefined") {
                return
            }

            process.parentPort.postMessage({
                update : {
                    progress : this.progress.value,
                    status : this.status 
                }
            })
        })
 
        this.log("Creating backend server")
    }

    async install() {
        this.progressTitle = "downloading-executables"

        await this.downloadPython(this.progress.child(0.4))

        this.progressTitle = "preparing-environment"

        await this.createPythonEnvironment(this.progress.child(0.1))

        this.progressTitle = "downloading-dependencies"

        await this.downloadPythonPackages(this.progress.child(0.3))
        await this.downloadXformers(this.progress.child(0.19))

        this.progressTitle = "ready-to-launch"
        
        this.log("Installation is complete.")
    }

    async downloadPython(progress) {
        this.log("Checking if Python is installed already")

        const isPythonInstalled = fs.existsSync(this.pythonExecPath) && spawnSync(this.pythonExecPath, ["--version"]).stdout.toString().trim() === "Python 3.10.9"

        if (isPythonInstalled === true) {
            this.log("Python is already installed")
            progress.update(1.0)
            return
        }

        this.log("Downloading Python")

        const installerPath = path.join(this.dataPath, "conda-installer.exe")
        const url = "https://repo.anaconda.com/miniconda/Miniconda3-py310_23.1.0-1-Windows-x86_64.exe"
        
        progress.update(0.1)

        const response = await fetch(url)

        progress.update(0.6)

        const streamPipeline = promisify(pipeline)
        await streamPipeline(response.body, fs.createWriteStream(installerPath))

        spawnSync(installerPath, [
            "/RegisterPython=0",
            "/S",
            `/D=${this.pythonPath}`
        ])
         
        this.log("Python is unpacked and ready.")
                 
        progress.update(1.0)
    }

    async createPythonEnvironment(progress) {
        const isPythonEnvInstalled = fs.existsSync(this.pythonScopedExecPath) && spawnSync(this.pythonScopedExecPath, ["--version"]).stdout.toString().trim() === "Python 3.10.9"

        if (isPythonEnvInstalled === true) {
            this.log("Python virtual environment is already setup")
            progress.update(1.0)
            return
        }

        this.log("Creating virtual environment for python")

        const result = spawnSync(this.pythonExecPath, [
            "-m",
            "venv",
            this.pythonEnvPath
        ])

        progress.update(1.0)
    }

    async downloadPythonPackages(progress) {
        this.log("Checking if we need to download Python packages")

        const installedPackagesString = spawnSync(this.pipScopedExecPath, [
            "list", "--format", "json", "-l"
        ]).stdout.toString()

        const installedPackages = JSON.parse(installedPackagesString)

        const requiredPackageNames = this.requiredPackages.map(pkg => pkg.name)
        const installedPackageNames = installedPackages.map(pkg => pkg.name)
       
        const nonInstalledPackages = requiredPackageNames.filter(x => !installedPackageNames.includes(x));

        if (nonInstalledPackages.length === 0) {
            progress.update(1.0)
            this.log("All Python packages are installed.")
            return
        }
        
        this.log("Packages to be installed: ", nonInstalledPackages.join(", "))
  
        for (const index of requiredPackageNames.keys()) {
            const pkg = this.requiredPackages[index]
            
            if (installedPackageNames.includes(pkg.name) === true) {
                this.log(`Skipping installed ${pkg.name} package`)
                progress.update(index / (requiredPackageNames.length - 1))
                continue
            }

            this.log(`Installing package '${pkg.name}'.`)

            if (typeof pkg.command !== "undefined") {
                const result = spawnSync(this.pipScopedExecPath, ["install"].concat(pkg.command))

                this.log(result.output.toString()) 
            }
            else {
                const result = spawnSync(this.pipScopedExecPath, [
                    "install",
                    "-U",
                    `${pkg.name}==${pkg.version}`
                ])

                this.log(result.output.toString()) 
            }

            progress.update(index / (requiredPackageNames.length - 1))
        }

        progress.update(1.0)
    }

    async downloadXformers(progress) {
        this.log("Checking if xFormers is installed")        

        const result = spawnSync(this.pipScopedExecPath, [
            "show", "xformers"
        ]).output.toString()


        if (result.includes("Location") === true) {
            progress.update(1.0)
            this.log("xFormers is already installed.")
            return
        }

        progress.update(0.1)
        
        this.log("Downloading xFormers")
     
        const output = spawnSync(this.pipScopedExecPath, [
            "install", "-v", "-U", "git+https://github.com/facebookresearch/xformers.git@main#egg=xformers"
        ], {
            shell: process.platform === "win32" ? "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe" : undefined
        }).output.toString()

        console.log(output)

        progress.update(1.0)
    }   
    
    log(message) {
        const fullMessage = `${message} (${this.progress.value})`

        console.log(fullMessage)
        fs.appendFile(this.logPath, fullMessage + "\n", () => {})
    }
    

}

const installer = new BackendInstaller()
await installer.install()
