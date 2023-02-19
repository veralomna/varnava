import EventEmitter from "events"

export default class ProgressTracker extends EventEmitter {

    // Value from 0 to 1
    get value() {
        if (this.children.length === 0) {
            return (this.current / this.total)
        }
        else {
            return this.children.reduce((result, child) => {
                return child.tracker.value * child.fraction + result
            }, 0)
        }
    }

    current = 0
    total = 1
    
    children = []

    child(fraction) {
        const tracker = new ProgressTracker(fraction)
        this.children.push({ tracker, fraction })
        
        tracker.on("update", () => {
            this.emit("update")
        })

        return tracker
    }

    update(current) {
        this.current = current
        
        this.emit("update")
    }

}