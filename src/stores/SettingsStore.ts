import Store from "./Store"

export interface SettingsConstants {
    base_dimension : number
    upscaled_dimension : number
}

export enum SettingsEntryType {
    range = "range",
    array = "array"
}

export interface SettingsEntry {
    name : string
    type : SettingsEntryType
    default : number | string
    custom? : string
}

export interface SettingsRangeEntry extends SettingsEntry {
    min : number
    max : number
    step : number
}

export interface SettingsArrayEntry extends SettingsEntry {
    values : string[]
    displayNames? : { [name : string] : string }
}

export interface SettingsAspectRatio {
    width : number
    height : number
}

/* State */

export interface SettingsState extends Object {
    settings : SettingsEntry[]
    constants : SettingsConstants
    isLoading : boolean
}

export class SettingsStore extends Store<SettingsState> {

    protected data() : SettingsState {
        return {
            settings : [],
            constants: {
                base_dimension: 0,
                upscaled_dimension: 0
            },
            isLoading : false,
        }
    }

    public presetAspectRatios : SettingsAspectRatio[] = [
        {
            width: 1,
            height: 1
        }, 
        {
            width: 9,
            height: 16
        },
        {
            width: 16,
            height: 9
        },
        {
            width: 4,
            height: 3
        },
        {
            width: 3,
            height: 4
        }
    ]

    protected displayNames : { [key : string] : CallableFunction } = {
        "dimensions" : (value : number) : string => {
            const presets = this.presetAspectRatios.filter(existingValue => {
                return existingValue.width / existingValue.height === value
            })

            if (presets.length === 0) {
                return `${value}`
            }

            return `${presets[0].width}x${presets[0].height}`
        },

        "seed" : (value : number) : string => {
            if (value.toString().length > 6) {
                return `${value.toString().slice(0, 6)}…`
            }

            return `${value}`
        },
        
        "strength" : (value : number) : string => {
            return Math.round(value * 100) + "%"
        },

        "method" : (value : string) : string => {
            if (typeof value === "undefined") {
                return value
            }

            return value.toLocaleUpperCase()
        }
    }

    public async fetch() {
        this.state.isLoading = true

        try {
            const result = await (await this.fetchApi(`/settings/prompts`)).json()
            this.state.settings = result["settings"]
            this.state.constants = result["constants"]
        }
        catch (error) {

        }

        this.state.isLoading = false
    }

    public getLocalSettings(id : string): { [key : string] : any } {
        const rawSettings = localStorage.getItem(`settings_${id}`) || "{}"
        let settings = JSON.parse(rawSettings)

        if (Object.keys(settings).length === 0) {
            // First time there is no settings, so populating default values.
            this.state.settings.forEach(entry => {
                if (entry.type === SettingsEntryType.range) {
                    settings[entry.name] = entry.default
                }
                else if (entry.type === SettingsEntryType.array) {
                    settings[entry.name] = (entry as SettingsArrayEntry).values[0]
                }
            })
        }
        
        return settings
    }

    public setLocalSettings(id : string, settings : { [key : string] : any }) {
        localStorage.setItem(`settings_${id}`, JSON.stringify(settings))
    }

    public getSettingDisplayName(settingName : string, settingValue : any) {
        // Server human readable values
        const providedDisplayName = this.state.settings
            .filter(entry => entry.name === settingName)
            // @ts-ignore
            .map(entry => entry.displayNames && entry.displayNames[settingValue])[0]

        if (typeof providedDisplayName !== "undefined") {
            return providedDisplayName
        }

        // Our own human readable values
        if (typeof this.displayNames[settingName] === "undefined") {
            return settingValue
        }

        return this.displayNames[settingName](settingValue)
    }

}

export const settingsStore = new SettingsStore()