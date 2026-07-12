import type { Script } from "./Script"
import type { Util } from "./Util"

export type Route = {
    id: number 
    method: string
    path: string 
    script: string 
    scripts: Script[],
    utils: Util[]
}