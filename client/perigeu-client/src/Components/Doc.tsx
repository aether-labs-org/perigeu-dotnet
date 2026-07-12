export default function Doc() {
    const utils = `
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
HttpSend("POST","url",{bodyParameter=1})
HttpDelete("url",{queryStringparameter=1})
]]

    
    `
    return (<>
    <main className="container">
        <div className="card">
            <ul>
                <li>
                    Rotas
                    <section>
    OBS: retorno obrigatoriamente deve ser do tipo Table  <br />
    Para acessar os dados da requisição segue os objetos: <br /><br />
    
    <b>Path</b>: string da rota acessada<br />
    <b>Query</b>: dicionario chave valor da query string <br />
    <b>Body</b>: Table com o corpo da requisição <br />
    <b>Headers</b>: dicionario chave valor dos headers <br />

                    </section>
                </li>
                <hr />
                <li>
                    Scripts 
                    <section>
                        WIP
                    </section>
                </li>
                <li>
                    Lua 
                    <section>
                        WIP
                    </section>
                </li>
                <li>
                    Utils
                    <section>
                        <pre>
                        {utils}

                        </pre>
                    </section>
                </li>
            </ul>
        </div>
    </main>
    </>)
} 