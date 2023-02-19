import { defineComponent, ref, watch } from "vue"
import { SettingsArrayEntry, SettingsEntry, SettingsEntryType, SettingsRangeEntry, settingsStore } from "@/stores/SettingsStore"
import { NoSymbolIcon } from "@heroicons/vue/24/solid"

export default defineComponent({

    props: {
        id : {
            type : String,
            required : true
        },
        isSmall : {
            type : Boolean,
            required : false,
            default: false
        },
        isDisabled : {
            type : Boolean,
            required : false,
            default : false
        }
    },

    beforeUnmount() {
        document.removeEventListener("click", this.onDocumentClick)
    },

    setup(props) {
        settingsStore.fetch()

        const localSettingsVisibility = ref<{ [key : string] : boolean }>({})
        const localSettings = ref<{ [key : string] : any }>({})

        const onDocumentClick = (event : MouseEvent) => {
            const target = event.target as HTMLElement

            if (target.closest("[data-current-menu-contents]") !== null) {
                return
            }

            if (target.closest("[data-current-menu]") !== null) {
                return
            }

            if (target.getAttribute("data-current-menu") !== "true") {
                event.preventDefault()

                Object.keys(localSettingsVisibility.value).forEach(name => {
                    localSettingsVisibility.value[name] = false
                })
            }
        }

        document.addEventListener("click", onDocumentClick)
        
        watch(() => [ settingsStore.getState().settings, props.id ], () => {
            localSettings.value = settingsStore.getLocalSettings(props.id)
        })

        return {
            localSettings,
            localSettingsVisibility,
            settingsState : settingsStore.getState(),
            additionalSettingsNames : ["method", "batch"],
            onDocumentClick
        }
    },

    render() {
        const onToggleSettingsMenu = (entry : SettingsEntry) => { 
            if (this.isDisabled === true) {
                return
            }

            return (event : MouseEvent) => {   
                const target = event.target as HTMLElement

                if (target.closest("[data-current-menu-contents]") !== null) {
                    return
                }
                
                if (this.localSettingsVisibility[entry.name] !== true) {
                    Object.keys(this.localSettingsVisibility).forEach(name => {
                        this.localSettingsVisibility[name] = false
                    })

                    this.localSettingsVisibility[entry.name] = true
                }
                else {
                    this.localSettingsVisibility[entry.name] = false
                }
            }
        }

        const onToggleAllMenu = (event : MouseEvent) => {
            if (this.isDisabled === true) {
                return
            }

            const target = event.target as HTMLElement

            if (target.closest("[data-current-menu-contents]") !== null) {
                return
            }

            if (this.localSettingsVisibility["__all__"] !== true) {
                Object.keys(this.localSettingsVisibility).forEach(name => {
                    this.localSettingsVisibility[name] = false
                })

                this.localSettingsVisibility["__all__"] = true
            }
            else {
                this.localSettingsVisibility["__all__"] = false
            }
        }

        const renderArrayContents = (entry : SettingsArrayEntry) => {
            const localValue = this.localSettings[entry.name]
            const isCustom = localValue !== entry.default

            const onChangeCustomValue = (event : Event) => {
                const target = event.target as HTMLInputElement

                if (target.value.length === 0) {
                    this.localSettings[entry.name] = entry.default
                    return
                }

                this.localSettings[entry.name] = target.value

                settingsStore.setLocalSettings(this.id, this.localSettings)
            }

            return <div class="w-full p-4 text-sm text-gray-400">
                {renderContentsHeader(entry)}
                <ul class="grid grid-cols-1 gap-4">
                    {entry.values.map((value => {
                        const isCurrent = value === localValue
                        const displayName = settingsStore.getSettingDisplayName(entry.name, value)

                        const onSelectPreset = (event : MouseEvent) => {
                            this.localSettings[entry.name] = value
                            settingsStore.setLocalSettings(this.id, this.localSettings)
                        }

                        return <li onClick={onSelectPreset} class={`${isCurrent === true ? "bg-blue-500 text-white" : "bg-gray-600 hover:bg-gray-500"} cursor-pointer text-center capitalize p-2 rounded`}>
                            {displayName}
                        </li>
                    }))}
                </ul>
                {entry.custom && <div class="mt-4 p-0 w-full">
                    <input value={isCustom === true ? localValue : ""} onInput={onChangeCustomValue} placeholder="Custom Value" class={`${isCustom === true ? "border-blue-500" : "border-gray-600"} focus:outline-none rounded border-2 py-2 px-2 w-full bg-gray-600 text-neutral-100`} type={entry.custom} />
                </div>}
            </div>
        }
        
        const renderAspectRatioContents = (entry : SettingsRangeEntry) => {
            const localValue = this.localSettings[entry.name]
           
            return <div class="w-full p-4 text-sm text-gray-400 font-mono">
                {renderContentsHeader(entry)}
                <ul class="grid grid-cols-2 gap-4">
                    {settingsStore.presetAspectRatios.map(preset => {
                        const isCurrent = localValue === (preset.width / preset.height)

                        const onSelectPreset = (event : MouseEvent) => {
                            this.localSettings[entry.name] = preset.width / preset.height
                            settingsStore.setLocalSettings(this.id, this.localSettings)
                        }
                    
                        return <li onClick={onSelectPreset} class={`${isCurrent === true ? "bg-blue-500 text-white" : "bg-gray-600 hover:bg-gray-500"} cursor-pointer text-center capitalize pt-4 pb-2 rounded`}>
                            <div class={`max-h-8 border-2 mb-2 mx-auto`} style={`aspect-ratio:${preset.width / preset.height}`} />
                            <span>{preset.width}x{preset.height}</span>
                        </li>
                    })}
                </ul>
            </div>
        }

        const renderRangeContents = (entry : SettingsRangeEntry) => {
            const localValue = this.localSettings[entry.name]

            const minDisplayValue = settingsStore.getSettingDisplayName(entry.name, entry.min)
            const maxDisplayValue = settingsStore.getSettingDisplayName(entry.name, entry.max)

            const onSliderUpdate = (event : Event) => {
                const target = event.target as HTMLInputElement
                this.localSettings[entry.name] = parseFloat(target.value)

                settingsStore.setLocalSettings(this.id, this.localSettings)
            }

            return <div class="w-full p-4 text-sm text-gray-400 font-mono">
                {renderContentsHeader(entry)}
                <input class="w-full" type="range" onInput={onSliderUpdate} step={entry.step} min={entry.min} max={entry.max} value={localValue} />
                <div class="flex">
                    <span>{minDisplayValue}</span>
                    <span class="ml-auto">{maxDisplayValue}</span>
                </div>
            </div>
        }

        const renderContentsHeader = (entry : SettingsEntry) => {
            const localValue = this.localSettings[entry.name]
            const isDefault = localValue === entry.default

            const onSetDefault = (event : Event) => {
                this.localSettings[entry.name] = entry.default

                settingsStore.setLocalSettings(this.id, this.localSettings)
            }

            const renderSetDefault = () => {
                return <NoSymbolIcon 
                           title="Set default value" 
                           onClick={onSetDefault} 
                           class={`${isDefault === true ? "hidden" : ""} hover:text-neutral-300 cursor-pointer ml-auto w-5 h-5`} />
           }

            return <h4 class="capitalize mb-3 flex">
                Configure {entry.name}
                {renderSetDefault()}
            </h4>
        }
        
        const renderContents = (entry : SettingsEntry) => {
            let render = (entry : SettingsEntry) : JSX.Element => { return <div>Unsupported Settings</div> }
         
            switch(entry.type) {

                case SettingsEntryType.array:
                    render = renderArrayContents
                    break

                case SettingsEntryType.range:
                    if (entry.name === "dimensions") {
                        render = renderAspectRatioContents
                    }
                    else {
                        render = renderRangeContents
                    }

                    break

            }

            return render(entry)
        }

        const renderSettingsButton = (entry : SettingsEntry) => {
            const localValue = this.localSettings[entry.name]
            const displayName = settingsStore.getSettingDisplayName(entry.name, localValue)
            const isDefault = localValue === entry.default
            const isVisible = this.localSettingsVisibility[entry.name] === true

            const contentClassName = `${this.localSettingsVisibility[entry.name] === true ? "visible" : "hidden"}\
                                        w-64 cursor-default absolute bg-gray-700 h-auto left-0 top-10 rounded z-50`

            let selectedClassName = isDefault === false ? "border-blue-500 text-blue-500" : "text-gray-400 border-gray-600"
            let visibleClassName = isVisible === true ? "brightness-150" : "hover:brightness-150"

            if (this.isDisabled === true) {
                visibleClassName = ""
                selectedClassName += " opacity-50 saturate-50"
            }
           
            return <li class="relative" data-current-menu={this.localSettingsVisibility[entry.name] === true} onClick={onToggleSettingsMenu(entry)}>
                <div class={`transition capitalize select-none cursor-pointer text-sm px-2 py-1 border-2 rounded ${selectedClassName} ${visibleClassName}`}>
                    {entry.name}
                    &nbsp;
                    <strong>
                        {displayName}
                    </strong>
                </div>
                <div data-current-menu-contents="true" class={contentClassName}>
                    {renderContents(entry)}
                </div>
            </li>
        }

        const renderAllSettings = () => {
            let allSettings = this.settingsState.settings
                .filter(entry => this.additionalSettingsNames.includes(entry.name) === true && entry.name !== "batch")

            return <div class="p-4 w-64 text-sm text-gray-400 flex-col max-h-96 overflow-y-scroll no-scrollbar">
                 {allSettings.map(entry => {
                    return <div class="rounded border border-gray-600">
                        {renderContents(entry)}
                    </div>
                 })}
            </div>
        }

        const renderAllButton = () => {
            const contentClassName = `${this.localSettingsVisibility["__all__"] === true ? "visible" : "hidden"}\
                                     cursor-default absolute bg-gray-700 h-auto right-0 top-10 rounded z-50`

            
            const isDefault = this.additionalSettingsNames.every(name => {
                const localValue = this.localSettings[name]
                const entry = this.settingsState.settings.filter(entry => entry.name === name)[0]
                return localValue === entry.default
            })

            const isVisible = this.localSettingsVisibility["__all__"] === true

            const visibleClassName = isVisible === true ? "brightness-150" : "hover:brightness-150"
            let selectedClassName = isDefault === false ? "border-blue-500 text-blue-500" : "text-gray-400 border-gray-600"

            if (this.isDisabled === true) {
                selectedClassName += " opacity-50 saturate-50"
            }

            return <li class="relative">
                <div data-current-menu={this.localSettingsVisibility["__all__"] === true} onClick={onToggleAllMenu} class={`transition capitalize select-none cursor-pointer text-sm px-2 py-1 border-2 rounded hover:brightness-150 ${visibleClassName} ${selectedClassName}`}>
                    More…
                </div>
                <div data-current-menu-contents="true" class={contentClassName}>
                    {renderAllSettings()}
                </div>
            </li>
        }

        if (this.settingsState.isLoading === true) {
            return null
        }

        return <ul class="mt-3 flex gap-2 font-mono">
            {this.settingsState.settings.filter(entry => this.additionalSettingsNames.includes(entry.name) === false).map(entry => {
                return renderSettingsButton(entry)
            })}
            {renderAllButton()}
        </ul>
    }

})