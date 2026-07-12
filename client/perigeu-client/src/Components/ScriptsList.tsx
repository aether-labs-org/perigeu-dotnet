import { useState } from "react"
import type { Script } from "../Types/Script"

export default function ScriptList(){
    const [scripts,setScritps] = useState<Script[]>([])

    return (
        <>
            <div className="card">
                <ul>
                    {
                        scripts.length > 0 ?
                        scripts.map((script: Script) => {
                            return <li></li>
                        })
                        : <li>Sem Scripts Cadastrados</li>
                    }
                </ul>
            </div>
        </>
    )
}