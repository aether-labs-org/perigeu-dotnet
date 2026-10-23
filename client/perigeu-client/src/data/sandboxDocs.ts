export type SandboxSection = {
    title: string;
    summary: string;
    items: string[];
    example: string;
};

export const sandboxSections: SandboxSection[] = [
    {
        title: "Contexto da request",
        summary: "O runtime injeta dados da requisição diretamente no ambiente Lua.",
        items: [
            "`Path` com o caminho atual.",
            "`Headers` com os headers recebidos.",
            "`Query`, `QueryParams` e `QueryString` como aliases para query string.",
            "`Body` com o payload da request quando existir."
        ],
        example: `if Body ~= nil then
    LogInfo(Path, "body recebido")
end`,
    },
    {
        title: "Scripts e módulos",
        summary: "Scripts podem depender de outros scripts, que são carregados só uma vez por request.",
        items: [
            "`Require(\"chave\")` resolve um script por chave e devolve a table retornada.",
            "A ordem de carregamento é topológica, sem duplicar dependências.",
            "Ciclos são detectados e rejeitados no runtime."
        ],
        example: `local repo = Require("meuRepositorio")
local service = Require("meuServico")`,
    },
    {
        title: "JSON",
        summary: "Helpers para serializar e desserializar payloads Lua.",
        items: [
            "`JsonEncode(table)` transforma table em JSON.",
            "`JsonDecode(json)` transforma JSON em table."
        ],
        example: `local payload = JsonDecode('{"id":1,"name":"Perigeu"}')`,
    },
    {
        title: "Data e tempo",
        summary: "Funções para timestamps, formatação e ajustes rápidos de data.",
        items: [
            "`Now()` e `UtcNow()` devolvem ISO-8601.",
            "`FormatDate(value, format)` formata uma data existente.",
            "`AddDays(value, days)` e `AddHours(value, hours)` facilitam janelas de tempo."
        ],
        example: `local expiresAt = AddHours(UtcNow(), 2)`,
    },
    {
        title: "Configuração e ambiente",
        summary: "Ajuste comportamento sem hardcode no script.",
        items: [
            "`Config(chave)` busca valores na tabela `perigeu_config`.",
            "`Env(nome)` lê variáveis de ambiente do processo."
        ],
        example: `local featureFlag = Config("feature_flag")`,
    },
    {
        title: "Banco de dados",
        summary: "Helpers de acesso ao DuckDB com suporte a transação.",
        items: [
            "`Execute` e `DbQuery` executam SQL e retornam rows como table.",
            "`DbQueryOne` pega a primeira linha encontrada.",
            "`ExecuteScalar` e `DbExecuteScalar` retornam valor escalar.",
            "`DbBeginTransaction`, `DbCommit` e `DbRollback` controlam transações."
        ],
        example: `DbBeginTransaction()
local rows = DbQuery("select * from users where id = @Id", { Id = 1 })
DbCommit()`,
    },
    {
        title: "Cache",
        summary: "Cache em memória por chave, ideal para evitar recomputação.",
        items: [
            "`CacheGet(key)` busca o valor salvo.",
            "`CacheSet(key, table, expirationSeconds)` grava com TTL."
        ],
        example: `local cached = CacheGet("users:list")`,
    },
    {
        title: "Log e HTTP",
        summary: "Ferramentas para observabilidade e integração externa.",
        items: [
            "`LogInfo`, `LogWarning` e `LogError` escrevem no logger.",
            "`HttpGet`, `HttpSend` e `HttpDelete` fazem chamadas externas."
        ],
        example: `HttpSend("POST", "https://example.com", { name = "teste" })`,
    },
];
