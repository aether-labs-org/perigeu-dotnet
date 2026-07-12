import { Editor } from "@monaco-editor/react"
import type { Script } from "../Types/Script"
import { useEffect, useState, type ChangeEvent } from "react"


export default function ScriptCodeEditor(){
    const defaultScript : Script = {
        id: 0,
        key: "",
        descricao: "",
        body: `
local Classe = {}

Classe.propriedadeEstatica = 1 

function Classe.metodoEstatico() 
    return Classe.propriedadeEstatica
end  

--Construtor
function Classe:new()
    local instancia = {
        propriedadeInstancia = 2
    }
    setmetatable(instancia,{ __index = self })
    return instancia
end 


function Classe:metodoDeInstancia()
    return self.propriedadeInstancia
end

        `
    } 

    const [currentScript,setCurrentScript] = useState<Script>(defaultScript)

    const setCurrentScriptEvent = (e: Event) => {
        setCurrentScript((e as CustomEvent<Script>).detail)
    }

    useEffect(() => {        
        window.addEventListener("setCurrentScript",setCurrentScriptEvent)
        return () => {
            window.removeEventListener("setCurrentScript",setCurrentScriptEvent)
        }
    },[])

    const handleEditorChange = (value: string | undefined) => {
        if(!currentScript) return
        setCurrentScript({...currentScript,body: value ?? ""})
    }

    return (
        <>
            <div className="card">
                <div className="row">
                    {
                        currentScript.id > 0 ? 
                        <p>id: {currentScript.id}</p>
                        : <p>Novo Script</p>
                    }
                </div>
                <div className="row">
                    <div className="col-8">
                        <label >Chave:</label>
                        <input type="text" placeholder="Identificador" value={currentScript.key} onChange={(e: ChangeEvent<HTMLInputElement>) => {setCurrentScript({...currentScript,key: e.target.value})}}/>
                    </div>
                    <div className="col-4 is-center">
                        <a className="button outline primary">salvar</a>
                        <a className="button outline">novo</a>                
                    </div>
                </div>
                <div className="row">
                        <label >Descrição:</label>
                        <input type="text" value={currentScript.descricao} onChange={(e: ChangeEvent<HTMLInputElement>) => {setCurrentScript({...currentScript,descricao: e.target.value})}}/>
                </div>
            </div>
            <br />
            <div className="card">
                <Editor
                    height="100vh"                  // Altura do editor
                    defaultLanguage="lua"    // Linguagem padrão (html, css, python, json, etc.)
                    theme="vs-dark"                 // Tema: "light" ou "vs-dark"
                    value={currentScript.body}                   // Valor controlado pelo estado
                    onChange={handleEditorChange}   // Evento de mudança
                    options={{
                        fontSize: 14,
                        minimap: { enabled: true },   // Ativa/desativa o minimapa da direita
                        automaticLayout: true,        // Faz o editor se reajustar se a janela mudar de tamanho
                        wordWrap: "on"                // Quebra de linha automática
                    }}
                />
            </div>
        </>
    )
}