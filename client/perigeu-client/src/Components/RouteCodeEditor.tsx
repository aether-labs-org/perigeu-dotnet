import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react"
import Editor from "@monaco-editor/react"
import type { Route } from "../Types/Route";
import type { Script } from "../Types/Script";
import { SaveRoute,DeleteRoute } from "../Services/PerigeuService";

const TEMPLATE_DEFAULT = `
return {message = "WIP"}
`;

const defaultRoute: Route = {
    id:0,
    method:"GET",
    path:"",
    script:TEMPLATE_DEFAULT,
    scripts:[],
    utils: []
}

export default function RouteCodeEditor(){
    const [route,setRoute] = useState<Route>() 
    const [scriptsList,setScritpsList] = useState<Script[]>([])
    const [scriptsSelecionados,setScriptsSelecionados] = useState<string[]>([])
 
    const handleEditorChange = (value: string | undefined) => {
        if(!route) return 
        setRoute({...route,script: value ?? ""});
    };

    const setRouteEvent = (e: Event) => {
        let customEvent = e as CustomEvent<Route> 
        setRoute(customEvent.detail)
        let temp: string[]  = customEvent.detail.scripts.map(item => String(item.id))
        setScriptsSelecionados(temp)
    }

    useEffect(() => {
        setRoute(defaultRoute)
        window.addEventListener("setRoute",setRouteEvent)
        return () => {
            window.removeEventListener("setRoute",setRouteEvent)
        }
    },[])

    function setMethod(e: ChangeEvent<HTMLSelectElement>){
        if(!route) return 
        setRoute({...route,method: e.target.value})
    }

    //#region fetch
    const save = async () => {
        if(!route) return
        let newroute = await SaveRoute(route)
        let e = new CustomEvent("loadRoutes")
        window.dispatchEvent(e)
        if(!newroute) return
        setRoute(newroute)
    }

    //#endregion

    return (
        <>
            <div className="card">
                <div className="row">
                    <div className="col is-left ">
                        {route?.id === 0 ? (
                            <p className="text-left">Nova Rota:</p>
                        ) : (
                            <p>id: {route?.id} {route?.path}</p>
                        )}
                    </div>
                    <div className="col is-right">
                        <a className="button outline primary" onClick={save}>salvar</a>
                        <a className="button outline secondary" onClick={(_) => {
                                setRoute(defaultRoute)
                            }
                        }>novo</a>
                    </div>
                </div>
                <div className="row">
                    <div className="row">
                        <div className="col-4">
                            <label>Method:</label>
                            <select value={route?.method} onChange={setMethod} >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>                            
                            </select>
                        </div>
                        <div className="col-8">
                            <label htmlFor="">Path:</label>
                            <input type="text" value={route?.path} onChange={
                                (e: ChangeEvent<HTMLInputElement>) => {
                                    if(!route) return
                                    setRoute({...route,path: e.target.value})}
                                }  
                                placeholder="/teste" 
                            />
                        </div>
                    </div>
                </div>
                <div className="row">
                    <select 
                        value={scriptsSelecionados || []}
                        multiple 
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            const valoresSelecionados = Array.from(e.target.selectedOptions).map(option => option.value);
                            setScriptsSelecionados(valoresSelecionados);
                            if (!route) return;
                            const scriptsFiltrados = scriptsList.filter((script) => {
                                return scriptsSelecionados.includes(String(script.id));
                            });
                            setRoute({
                                ...route,
                                scripts: scriptsFiltrados
                            });
                        }}
                    >
                        {scriptsList.length > 0 ? (
                            scriptsList.map((script: Script) => (
                                <option key={script.id} value={script.id}>
                                    {script.key}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Sem Scripts Encontrados!</option>
                        )}
                    </select>
                </div>
            </div>
            <br></br>

            <div className="card">
                <Editor
                    height="100vh"                  // Altura do editor
                    defaultLanguage="lua"    // Linguagem padrão (html, css, python, json, etc.)
                    theme="vs-dark"                 // Tema: "light" ou "vs-dark"
                    value={route?.script}                    // Valor controlado pelo estado
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