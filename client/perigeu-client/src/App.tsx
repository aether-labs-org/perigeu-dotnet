import {useState, useEffect, useRef} from 'react'
import './App.css'
import * as monaco from 'monaco-editor'

interface LuaScript {
    id: number
    path: string
    script: string
}

// 1. Corrigida para ser assíncrona e retornar os dados corretamente
async function GetLuaScripts(url: string): Promise<LuaScript[]> {
    try {
        const response = await fetch(`${url}/scripts`); // Ajuste o endpoint conforme sua API
        if (!response.ok) throw new Error("Erro ao buscar scripts");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function SetLuaScript(url: string): Promise<LuaScript> {}

function App() {
    const apiUrl: string = "http://localhost:8080"

    // 2. Correção da tipagem dos hooks usando Generics <...>
    const [listaDeScripts, setListaDeScripts] = useState<LuaScript[]>([])
    const [scriptAtual, setScriptAtual] = useState<LuaScript>({
        id: 0,
        path:"",
        script: `
--Parametros vindos no body da requisição
local body = Request

--Chamar procedure cadastrada no Perigeu
local response = Execute("perigeu_teste", params)  

--Retorno obrigatoriamente deve ser um Table sempre 
return response
        `,
    })

    // Refs para guardar as instâncias do container e do editor sem forçar re-renders
    const editorRef = useRef<HTMLDivElement>(null)
    const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

    // 3. Efeito para buscar os dados da API ao inicializar
    useEffect(() => {
        async function fetchScripts() {
            const scripts = await GetLuaScripts(apiUrl);
            setListaDeScripts(scripts);
        }

//        fetchScripts();
    }, [apiUrl]);

    // 4. Efeito para inicializar o Monaco Editor APENAS UMA VEZ quando a div surgir no DOM
    useEffect(() => {
        if (editorRef.current && !monacoInstanceRef.current) {
            monacoInstanceRef.current = monaco.editor.create(editorRef.current, {
                value: scriptAtual.script, // Passa apenas a string
                language: "lua",
                theme: "vs-dark", // Opcional: deixa o editor escuro
                automaticLayout: true,
            });
        }

        // Limpeza (cleanup) ao desmontar o componente para evitar vazamento de memória
        return () => {
            if (monacoInstanceRef.current) {
                monacoInstanceRef.current.dispose();
                monacoInstanceRef.current = null;
            }
        };
    }, []); // Array de dependências vazio garante que roda só uma vez

    // 5. Efeito para atualizar o texto do editor caso o scriptAtual mude externamente
    useEffect(() => {
        if (monacoInstanceRef.current && scriptAtual) {
            // Evita resetar o cursor se o valor já for o mesmo
            if (monacoInstanceRef.current.getValue() !== scriptAtual.script) {
                monacoInstanceRef.current.setValue(scriptAtual.script);
            }
        }
    }, [scriptAtual]);

    return (
        <>
            <link rel="stylesheet"
                  href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"></link>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
            <main className="container">
                <nav>
                    <div className="nav-wrapper">
                        <a href="#" className="brand-logo center">Perigeu</a>
                    </div>
                </nav>
                <br></br>
                <section id="scripts" className={"row"}>
                    <div className={"col s2"}>
                        <ul>
                            {/* Renderizando a lista real vinda da API */}
                            {listaDeScripts.map(script => (
                                <li key={script.id} onClick={() => setScriptAtual(script)} style={{cursor: 'pointer'}}>
                                    Script {script.id}
                                </li>
                            ))}
                            {listaDeScripts.length === 0 && <li>Nenhum script encontrado</li>}
                        </ul>
                    </div>
                    <div className={"col s10"}>
                        <div className="row">
                            <div className={"col s8"}>Script: {scriptAtual.id} <input type="text" value={scriptAtual.path} placeholder="/rota-do-seu-script"></input> </div>
                            <div className={"col s4"}>
                                <a href={"#"} className={"btn"} onClick={
                                    () => {
                                        SetLuaScript(scriptAtual)
                                        async function fetchScripts() {
                                            const scripts = await GetLuaScripts(apiUrl);
                                            setListaDeScripts(scripts);
                                        }
                                        //fetchScripts();
                                    }
                                }>Salvar</a> 
                                <a href={"#"} className={"btn"}>Resetar</a>
                            </div>
                        </div>
                        <div ref={editorRef} id="editor" style={{height: '500px', width: '100%'}}></div>
                    </div>
                </section>
            </main>


        </>
    )
}

export default App