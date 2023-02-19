import { DateTime } from "luxon"
import { Project } from "@/stores/ProjectStore"

interface Props {
    title : string
    subtitle? : string
}

const ProjectItem = (props : Props) => {
    const className = `p-6 box-border select-none`

    const renderSubtitle = () => {
        if (props.subtitle != null) {
            return <h3 class="text-sm text-gray-400 leading-tight">{props.subtitle}</h3>
        }
        else {
            return null;
        }
    }

    return <div class={className}>
        <h2 class="text-xl font-semibold tracking-tight flex justify-between">
            {props.title} 
        </h2>
        {renderSubtitle()}
    </div>
}

export default ProjectItem