import { useState, useEffect, useRef } from 'react'
import './App.css'
import * as monaco from 'monaco-editor'

interface LuaScript {
    id: number
    path: string
    script: string
}

const TEMPLATE_DEFAULT = `
--[[
--Parametros vindos no body da requisição
Body

--
Path = rota

--Chamar procedure cadastrada no Perigeu
local response = Execute("perigeu_teste", body)  

--Usar Cache
local valor = CacheGet("key")
if next(valor) == nil then 
    valor = {mensagem= "logica da controller"}
    local expirationTimeInSeconds = 10
    CacheSet("key",valor,expirationTimeInSeconds)

--LOG
LogInfo(Path,"log de info")
LogWarning(Path,"log de aviso")
LogError(Path,"log de erro")

--Client Http
--todos os methodos retornam um Table da resposta 
HttpGet("url",{queryStringparameter=1})
HttpSend("url",{bodyParameter=1})
HttpDelete("url",{queryStringparameter=1})
]]

--Retorno obrigatoriamente deve ser sempre um objeto do tipo Table 
return {message = "WIP"}
`;

async function GetLuaScripts(url: string): Promise<LuaScript[]> {
    try {
        const response = await fetch(`${url}/Perigeu`);
        if (!response.ok) throw new Error("Erro ao buscar scripts");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function SaveLuaScript(url: string, script: LuaScript): Promise<LuaScript | null> {
    try {
        const response = await fetch(`${url}/Perigeu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(script)
        });
        if (!response.ok) throw new Error("Erro ao salvar o script");
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function DeleteLuaScript(url: string, id: number): Promise<boolean> {
    try {
        const response = await fetch(`${url}/Perigeu/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function App() {
    const apiUrl: string = "http://localhost:5000"

    const [listaDeScripts, setListaDeScripts] = useState<LuaScript[]>([])
    const [scriptAtual, setScriptAtual] = useState<LuaScript>({
        id: 0,
        path: "",
        script: TEMPLATE_DEFAULT,
    })

    // Guarda o estado original imutável do script selecionado para comparação
    const [scriptOriginal, setScriptOriginal] = useState<string>(TEMPLATE_DEFAULT)
    // Controla se a aba de Diff está aberta/expandida
    const [exibirDiff, setExibirDiff] = useState<boolean>(false)

    const editorRef = useRef<HTMLDivElement>(null)
    const diffEditorRef = useRef<HTMLDivElement>(null)

    const monacoInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const monacoDiffInstanceRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

    const carregarScripts = async () => {
        const scripts = await GetLuaScripts(apiUrl);
        setListaDeScripts(scripts);
    };

    useEffect(() => {
        carregarScripts();
    }, [apiUrl]);

    // Inicialização do Editor Padrão
    useEffect(() => {
        if (editorRef.current && !monacoInstanceRef.current) {
            monacoInstanceRef.current = monaco.editor.create(editorRef.current, {
                value: scriptAtual.script,
                language: "lua",
                theme: "vs-dark",
                automaticLayout: true,
                fontSize: 14,
                fontFamily: "'Fira Code', Consolas, Monaco, monospace",
            });

            monacoInstanceRef.current.onDidChangeModelContent(() => {
                const novoTexto = monacoInstanceRef.current?.getValue() || "";
                setScriptAtual(prev => ({ ...prev, script: novoTexto }));
            });
        }

        return () => {
            if (monacoInstanceRef.current) {
                monacoInstanceRef.current.dispose();
                monacoInstanceRef.current = null;
            }
        };
    }, []);

    // Inicialização do Editor de Diff (Executado dinamicamente quando expandido)
    useEffect(() => {
        if (exibirDiff && diffEditorRef.current && !monacoDiffInstanceRef.current) {
            monacoDiffInstanceRef.current = monaco.editor.createDiffEditor(diffEditorRef.current, {
                theme: "vs-dark",
                automaticLayout: true,
                readOnly: true, // Apenas para visualização
                fontSize: 14,
                fontFamily: "'Fira Code', Consolas, Monaco, monospace",
            });
        }

        if (monacoDiffInstanceRef.current) {
            // Cria os modelos comparativos (Esquerda: Original anterior | Direita: Atual modificado do editor)
            const originalModel = monaco.editor.createModel(scriptOriginal, "lua");
            const modifiedModel = monaco.editor.createModel(scriptAtual.script, "lua");

            monacoDiffInstanceRef.current.setModel({
                original: originalModel,
                modified: modifiedModel
            });
        }

        return () => {
            if (monacoDiffInstanceRef.current) {
                monacoDiffInstanceRef.current.dispose();
                monacoDiffInstanceRef.current = null;
            }
        };
    }, [exibirDiff, scriptOriginal, scriptAtual.id]);
    // Atualiza o painel do Diff se mudar o script selecionado ou se expandir a aba

    // Sincroniza o conteúdo do editor principal quando troca o script lateralmente
    useEffect(() => {
        if (monacoInstanceRef.current && scriptAtual) {
            if (monacoInstanceRef.current.getValue() !== scriptAtual.script) {
                monacoInstanceRef.current.setValue(scriptAtual.script);
            }
        }
    }, [scriptAtual.id]);

    const handleSelecionarScript = (script: LuaScript) => {
        setScriptAtual(script);
        setScriptOriginal(script.script); // Seta como o marco zero original
        setExibirDiff(false); // Reseta a aba recolhida ao mudar de script
    };

    const handleSalvar = async () => {
        const resultado = await SaveLuaScript(apiUrl, scriptAtual);
        if (resultado) {
            setScriptAtual(resultado);
            setScriptOriginal(resultado.script); // Atualiza o original pós-salvamento
            setExibirDiff(false);
            alert("Script salvo com sucesso!");
            carregarScripts();
        } else {
            alert("Erro ao salvar script.");
        }
    };

    const handleDeletar = async (id: number) => {
        if (confirm(`Deseja realmente apagar o script ${id}?`)) {
            const sucesso = await DeleteLuaScript(apiUrl, id);
            if (sucesso) {
                alert("Script removido!");
                if (scriptAtual.id === id) {
                    handleNovo();
                }
                carregarScripts();
            } else {
                alert("Erro ao deletar script.");
            }
        }
    };

    const handleNovo = () => {
        setScriptAtual({
            id: 0,
            path: "",
            script: TEMPLATE_DEFAULT
        });
        setScriptOriginal(TEMPLATE_DEFAULT);
        setExibirDiff(false);
    };

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />

            <main className="main-wrapper">
                <nav className="custom-nav">
                    <div className="nav-wrapper px2">
                        <a href="#" className="brand-logo left" style={{ paddingLeft: '20px' }}>
                            <i className="material-icons left">code</i>Perigeu
                        </a>
                    </div>
                </nav>

                <section id="scripts" className="row">
                    {/* Painel Lateral */}
                    <div className="col s12 m4">
                        <div className="custom-card">
                            <h5 className="section-title">Scripts Cadastrados</h5>
                            <ul className="collection custom-list">
                                {listaDeScripts.map(script => (
                                    <li
                                        key={script.id}
                                        className={`collection-item ${scriptAtual.id === script.id ? 'active-script' : ''}`}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    >
                                        <div>
                                            <strong style={{ color: '#fff' }}>ID: {script.id}</strong> <br />
                                            <span style={{ color: '#8a92a3', fontSize: '0.9rem' }}>{script.path || "(sem rota definido)"}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className="btn-small blue darken-2 waves-effect waves-light"
                                                onClick={() => handleSelecionarScript(script)}
                                                title="Editar"
                                            >
                                                <i className="material-icons">edit</i>
                                            </button>
                                            <button
                                                className="btn-small red darken-2 waves-effect waves-light"
                                                onClick={() => handleDeletar(script.id)}
                                                title="Excluir"
                                            >
                                                <i className="material-icons">delete</i>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {listaDeScripts.length === 0 && (
                                    <li className="collection-item center-align" style={{ color: '#5c6370' }}>
                                        Nenhum script encontrado
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Área do Editor */}
                    <div className="col s12 m8">
                        <div className="custom-card">
                            <div className="row" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="input-field col s12 l5" style={{ margin: 0 }}>
                                    <input
                                        id="path_input"
                                        type="text"
                                        value={scriptAtual.path}
                                        onChange={(e) => setScriptAtual({ ...scriptAtual, path: e.target.value })}
                                        placeholder="/minha-rota"
                                    />
                                    <label htmlFor="path_input" className="active">Rota do Script (Path)</label>
                                </div>
                                <div className="col s12 l7" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <span className={`chip ${scriptAtual.id === 0 ? 'green' : 'blue'} white-text`} style={{ margin: 0, fontWeight: 'bold' }}>
                                        {scriptAtual.id === 0 ? "Novo Script" : `ID: ${scriptAtual.id}`}
                                    </span>

                                    {/* Botão de Histórico/Diff (Só aparece para scripts salvos no banco) */}
                                    {scriptAtual.id > 0 && (
                                        <button
                                            className="btn orange darken-3 btn-flex waves-effect waves-light"
                                            onClick={() => setExibirDiff(!exibirDiff)}
                                        >
                                            <i className="material-icons">{exibirDiff ? "code" : "history"}</i>
                                            {exibirDiff ? "Ver Editor" : "Ver Alterações"}
                                        </button>
                                    )}

                                    <button className="btn green darken-1 btn-flex waves-effect waves-light" onClick={handleSalvar}>
                                        <i className="material-icons">save</i>Salvar
                                    </button>
                                    <button className="btn grey darken-1 btn-flex waves-effect waves-light" onClick={handleNovo}>
                                        <i className="material-icons">add</i>Novo
                                    </button>
                                </div>
                            </div>

                            <div className="editor-border" style={{ position: 'relative' }}>
                                {/* Container do Editor Comum (Escondido se o diff estiver ativo) */}
                                <div
                                    ref={editorRef}
                                    id="editor"
                                    style={{ height: '520px', width: '100%', display: exibirDiff ? 'none' : 'block' }}
                                ></div>

                                {/* Container da Aba de Diff (Montado dinamicamente lado a lado) */}
                                {exibirDiff && (
                                    <div
                                        ref={diffEditorRef}
                                        id="diff-editor"
                                        style={{ height: '520px', width: '100%' }}
                                    ></div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default App