import { spawnSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import { build } from "vite"
import builder, { Platform } from "electron-builder"

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootPath = path.join(__dirname, "..")

const buildBundle = async () => {
    /**
    * @type {import('electron-builder').Configuration}
    * @see https://www.electron.build/configuration/configuration
    */
    const options = {
        compression: "store",
        removePackageScripts: true,
        
        appId: "mn.vrl.varnava",
        copyright: "Copyright © VERALOMNA",

        directories: {
            output: "build/release/"
        },

        files: [
            "build/dist/**",
           
            {
                from: "scripts/app",
                to: "."
            }
        ],

        extraResources: [
            {
                from: "build/server.pyz",
                to: "app/server.pyz"
            }
        ],

        asar: false,
        npmRebuild: false,

        win: {
            target: ["nsis"],
        },

        nsis: {
            artifactName: "${productName}-${version}.${ext}",
            oneClick: true,
            perMachine: false,
            deleteAppDataOnUninstall: true,
            packElevateHelper: false
        }
    }

    await builder.build({
        targets: Platform.WINDOWS.createTarget(),
        config: options
    })
}

const buildFrontend = async () => {
    console.log("Building frontend")

    await build({
        root: rootPath,
        base: "./",
        configFile: path.join(rootPath, "vite.config.js"),
        mode: "production",
        build: {
            outDir: "build/dist",
            reportCompressedSize: false
        },
        logLevel: "info"
    })
}

const buildBackend = async () => {
    console.log("Building backend")

    const result = spawnSync("python", [
        "-m", "zipapp", path.join(rootPath, "server"),
        "-o", path.join(rootPath, "build", "server.pyz"),
        "-m", "server:run"
    ])

    console.log(result.output.toString())
}

await buildFrontend()
await buildBackend()
await buildBundle()