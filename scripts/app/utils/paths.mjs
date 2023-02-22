import path from "path"

export const getDataPath = () => {
    if (process.platform === "win32") {
        return process.env["LOCALAPPDATA"]
    }
    else {
        return path.join(process.env["HOME"], "Library")
    }
}