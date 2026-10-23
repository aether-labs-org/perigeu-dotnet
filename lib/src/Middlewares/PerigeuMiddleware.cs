using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MoonSharp.Interpreter;
using MoonSharp.Interpreter.Serialization.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;
using perigeu_dotnet.Repositories;
using JsonSerializer = System.Text.Json.JsonSerializer;
using Script = MoonSharp.Interpreter.Script;

namespace perigeu_dotnet.Middlewares;

public sealed class PerigeuMiddleware: IMiddleware
{
    private readonly IPerigeuDbService _perigeuDbService;
    private readonly IMemoryCache _cache;
    private static List<Route> _Routes = new();
    private readonly ILogger<PerigeuMiddleware> _logger;
    private readonly HttpClient _client;

    public PerigeuMiddleware(IPerigeuDbService perigeuDbService,IMemoryCache cache, ILogger<PerigeuMiddleware> logger,HttpClient client)
    {
        this._perigeuDbService = perigeuDbService;
        this._cache = cache;
        this._logger = logger;
        this._client = client;
        LoadScripts();
    }

    public void LoadScripts()
    {
        PerigeuMiddleware._Routes = this._perigeuDbService.ListRoutes();
    }

    private sealed class LuaSandboxRuntime : IDisposable
    {
        private readonly PerigeuMiddleware _owner;
        private readonly IDbConnection _connection;
        private readonly Script _luaScript;
        private readonly Dictionary<long, Table?> _moduleCache = new();
        private readonly Dictionary<string, Table?> _moduleCacheByKey = new(StringComparer.OrdinalIgnoreCase);
        private readonly HashSet<long> _loadedScripts = new();
        private readonly HashSet<long> _loadingScripts = new();
        private IDbTransaction? _transaction;

        public LuaSandboxRuntime(PerigeuMiddleware owner, IPerigeuDbService dbService)
        {
            _owner = owner;
            _connection = dbService.CreateConnection();
            _luaScript = new Script(CoreModules.Preset_Complete | CoreModules.LoadMethods);
            RegisterHelpers();
        }

        public async Task ExecuteRouteAsync(Route route, string path, HttpContext context)
        {
            RegisterRequestContext(path, context);
            RegisterRouteUtils(route);
            LoadScriptTree(route.Scripts);

            try
            {
                DynValue res = _luaScript.DoString(route.Script);
                if (res.Type == DataType.Table)
                {
                    var json = res.Table.TableToJson();
                    if (json != null)
                        await context.Response.WriteAsync(json, Encoding.UTF8);
                    return;
                }

                if (!res.IsNil())
                {
                    await context.Response.WriteAsync(JsonConvert.SerializeObject(res.ToObject()), Encoding.UTF8);
                }
            }
            catch (Exception e)
            {
                context.Response.StatusCode = 500;
                await context.Response.WriteAsync(JsonConvert.SerializeObject(new { error = e.Message }), Encoding.UTF8);
            }
        }

        private void RegisterHelpers()
        {
            _luaScript.Globals["JsonEncode"] = (Func<Table, string>)JsonEncode;
            _luaScript.Globals["JsonDecode"] = (Func<string, Table>)JsonDecode;
            _luaScript.Globals["Now"] = (Func<string>)Now;
            _luaScript.Globals["UtcNow"] = (Func<string>)UtcNow;
            _luaScript.Globals["FormatDate"] = (Func<string, string, string>)FormatDate;
            _luaScript.Globals["AddDays"] = (Func<string, int, string>)AddDays;
            _luaScript.Globals["AddHours"] = (Func<string, int, string>)AddHours;
            _luaScript.Globals["Config"] = (Func<string, string?>)Config;
            _luaScript.Globals["Env"] = (Func<string, string?>)Env;
            _luaScript.Globals["Require"] = (Func<string, Table?>)Require;
            _luaScript.Globals["DbQuery"] = (Func<string, Table, Table>)DbQuery;
            _luaScript.Globals["DbExecute"] = (Func<string, Table, Table>)DbQuery;
            _luaScript.Globals["DbQueryOne"] = (Func<string, Table, Table>)DbQueryOne;
            _luaScript.Globals["DbExecuteScalar"] = (Func<string, Table, Table>)DbExecuteScalar;
            _luaScript.Globals["QueryOne"] = (Func<string, Table, Table>)DbQueryOne;
            _luaScript.Globals["ExecuteScalar"] = (Func<string, Table, Table>)DbExecuteScalar;
            _luaScript.Globals["DbBeginTransaction"] = (Action)BeginTransaction;
            _luaScript.Globals["DbCommit"] = (Action)Commit;
            _luaScript.Globals["DbRollback"] = (Action)Rollback;
        }

        private void RegisterRequestContext(string path, HttpContext context)
        {
            _luaScript.Globals["Path"] = path;

            Table luaHeaderTable = new Table(_luaScript);
            foreach (var header in context.Request.Headers)
            {
                luaHeaderTable[header.Key] = header.Value.ToString();
            }
            _luaScript.Globals["Headers"] = luaHeaderTable;

            if (context.Request.Method is "GET" or "DELETE")
            {
                Table luaQueryTable = new Table(_luaScript);
                foreach (var param in context.Request.Query)
                {
                    luaQueryTable[param.Key] = param.Value.ToString();
                }
                _luaScript.Globals["QueryParams"] = luaQueryTable;
                _luaScript.Globals["QueryString"] = luaQueryTable;
                _luaScript.Globals["Query"] = luaQueryTable;
            }

            if (context.Request.Method is "POST" or "PATCH" or "PUT")
            {
                context.Request.EnableBuffering();
                string bodyContent = new StreamReader(context.Request.Body).ReadToEnd();
                if (!string.IsNullOrWhiteSpace(bodyContent))
                {
                    Table requestTable = JsonTableConverter.JsonToTable(bodyContent);
                    _luaScript.Globals["Body"] = requestTable;
                }
            }
        }

        private void RegisterRouteUtils(Route route)
        {
            var utils = (route.Utils ?? new List<Util>()).Select(item => item.Chave).ToList();
            utils.Add("db");
            utils.Add("cache");
            utils.Add("log");
            utils.Add("http");

            if (utils.Contains("db"))
            {
                _luaScript.Globals["Execute"] = (Func<string, Table, Table>)DbQuery;
                _luaScript.Globals["DbQuery"] = (Func<string, Table, Table>)DbQuery;
                _luaScript.Globals["DbExecute"] = (Func<string, Table, Table>)DbQuery;
                _luaScript.Globals["DbQueryOne"] = (Func<string, Table, Table>)DbQueryOne;
                _luaScript.Globals["DbExecuteScalar"] = (Func<string, Table, Table>)DbExecuteScalar;
                _luaScript.Globals["QueryOne"] = (Func<string, Table, Table>)DbQueryOne;
                _luaScript.Globals["ExecuteScalar"] = (Func<string, Table, Table>)DbExecuteScalar;
                _luaScript.Globals["DbBeginTransaction"] = (Action)BeginTransaction;
                _luaScript.Globals["DbCommit"] = (Action)Commit;
                _luaScript.Globals["DbRollback"] = (Action)Rollback;
            }

            if (utils.Contains("cache"))
            {
                _luaScript.Globals["CacheGet"] = (Func<string, Table>)_owner.CacheGet;
                _luaScript.Globals["CacheSet"] = (Action<string, Table, int>)_owner.CacheSet;
            }

            if (utils.Contains("log"))
            {
                _luaScript.Globals["LogInfo"] = (Action<string, string>)_owner.LuaLogInfo;
                _luaScript.Globals["LogWarning"] = (Action<string, string>)_owner.LuaLogWarning;
                _luaScript.Globals["LogError"] = (Action<string, string>)_owner.LuaLogError;
            }

            if (utils.Contains("http"))
            {
                _luaScript.Globals["HttpGet"] = (Func<string, Table, Table>)_owner.HttpGet;
                _luaScript.Globals["HttpSend"] = (Func<string, string, Table, Table>)_owner.HttpSend;
                _luaScript.Globals["HttpDelete"] = (Func<string, Table, Table>)_owner.HttpDelete;
            }

            if (utils.Contains("file"))
                throw new NotImplementedException();

            if (utils.Contains("mqtt"))
                throw new NotImplementedException();

            if (utils.Contains("signalr"))
                throw new NotImplementedException();
        }

        private void LoadScriptTree(IEnumerable<Models.Script>? rootScripts)
        {
            foreach (var script in rootScripts ?? Enumerable.Empty<Models.Script>())
            {
                LoadScriptById(script.Id);
            }
        }

        private Table? LoadScriptById(long scriptId)
        {
            if (_loadedScripts.Contains(scriptId))
                return _moduleCache.TryGetValue(scriptId, out var cachedModule) ? cachedModule : null;

            if (!_loadingScripts.Add(scriptId))
                throw new InvalidOperationException($"Circular script dependency detected for script id {scriptId}");

            try
            {
                var repository = new ScriptRepository(_connection);
                var script = repository.GetById(scriptId);

                foreach (var dependency in script.Dependencies)
                {
                    LoadScriptById(dependency.Id);
                }

                var result = _luaScript.DoString(script.Body);
                _loadedScripts.Add(scriptId);

                if (result.Type == DataType.Table)
                {
                    _moduleCache[scriptId] = result.Table;
                    if (!string.IsNullOrWhiteSpace(script.Chave))
                    {
                        _luaScript.Globals[script.Chave] = result.Table;
                        _moduleCacheByKey[script.Chave] = result.Table;
                    }
                    return result.Table;
                }

                _moduleCache[scriptId] = null;
                if (!string.IsNullOrWhiteSpace(script.Chave))
                    _moduleCacheByKey[script.Chave] = null;
                return null;
            }
            finally
            {
                _loadingScripts.Remove(scriptId);
            }
        }

        private Table? LoadScriptByKey(string chave)
        {
            if (_moduleCacheByKey.TryGetValue(chave, out var cachedModule))
                return cachedModule;

            throw new InvalidOperationException(
                $"Script '{chave}' não foi carregado para esta rota. " +
                "Adicione-o como dependência da rota ou como dependência de outro script já carregado.");
        }

        private Table? Require(string chave) => LoadScriptByKey(chave);

        private Table DbQuery(string sql, Table parameters) => ExecuteTableQuery(sql, parameters);

        private Table DbQueryOne(string sql, Table parameters)
        {
            var rows = ExecuteTableQuery(sql, parameters);
            var firstRow = rows.Get(1);
            return firstRow.Type == DataType.Table ? firstRow.Table : new Table(_luaScript);
        }

        private Table DbExecuteScalar(string sql, Table parameters)
        {
            var commandParameters = ToDynamicParameters(parameters);
            var value = _connection.ExecuteScalar(sql, commandParameters, transaction: _transaction);
            var result = new Table(_luaScript);
            result["value"] = value;
            return result;
        }

        private Table ExecuteTableQuery(string sql, Table parameters)
        {
            var commandParameters = ToDynamicParameters(parameters);
            var resultRows = _connection.Query<dynamic>(sql, commandParameters, transaction: _transaction).ToList();

            var luaResultTable = new Table(_luaScript);
            for (int i = 0; i < resultRows.Count; i++)
            {
                var row = resultRows[i] as IDictionary<string, object>;
                var luaRow = new Table(_luaScript);

                if (row != null)
                {
                    foreach (var cell in row)
                    {
                        luaRow[cell.Key] = cell.Value;
                    }
                }

                luaResultTable[i + 1] = luaRow;
            }

            return luaResultTable;
        }

        private DynamicParameters ToDynamicParameters(Table parameters)
        {
            var dbParams = new DynamicParameters();
            if (parameters == null)
                return dbParams;

            foreach (var pair in parameters.Pairs)
            {
                dbParams.Add(pair.Key.String, pair.Value.ToObject());
            }

            return dbParams;
        }

        private void BeginTransaction()
        {
            if (_transaction != null)
                return;

            _transaction = _connection.BeginTransaction();
        }

        private void Commit()
        {
            _transaction?.Commit();
            _transaction?.Dispose();
            _transaction = null;
        }

        private void Rollback()
        {
            _transaction?.Rollback();
            _transaction?.Dispose();
            _transaction = null;
        }

        private static string JsonEncode(Table table) => table.TableToJson();

        private static Table JsonDecode(string json) => JsonTableConverter.JsonToTable(json);

        private static string Now() => DateTimeOffset.Now.ToString("o", CultureInfo.InvariantCulture);

        private static string UtcNow() => DateTimeOffset.UtcNow.ToString("o", CultureInfo.InvariantCulture);

        private static string FormatDate(string value, string format)
        {
            if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
                return value;

            return parsed.ToString(format, CultureInfo.InvariantCulture);
        }

        private static string AddDays(string value, int days)
        {
            if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
                return value;

            return parsed.AddDays(days).ToString("o", CultureInfo.InvariantCulture);
        }

        private static string AddHours(string value, int hours)
        {
            if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
                return value;

            return parsed.AddHours(hours).ToString("o", CultureInfo.InvariantCulture);
        }

        private string? Config(string key)
        {
            const string query = "SELECT valor FROM perigeu_config WHERE chave = $Key LIMIT 1";
            return _connection.QueryFirstOrDefault<string>(query, new { Key = key }, transaction: _transaction);
        }

        private static string? Env(string key) => Environment.GetEnvironmentVariable(key);

        public void Dispose()
        {
            Rollback();
        }
    }

    public Table CacheGet(string key)
    {
        if (this._cache.TryGetValue(key, out string? result))
        {
            return JsonTableConverter.JsonToTable(result);
        }
        return JsonTableConverter.JsonToTable("{}");
    }
    public void CacheSet(string key, Table table,int expiration)
    {
        this._cache.Set(key,table.TableToJson(),TimeSpan.FromSeconds(expiration));
    }
    public void LuaLogInfo(string route, string message) => _logger.LogInformation("{Route}: {Message}", route,message);
    public void LuaLogWarning(string route,string message) => _logger.LogWarning("{Route}: {Message}", route,message);
    public void LuaLogError(string route,string message) => _logger.LogError("{Route}: {Message}", route,message);

    public static string AppendJsonToUrl(string baseUrl, string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return baseUrl;

        var jObject = JObject.Parse(json);
        var sb = new StringBuilder(baseUrl);
        bool hasQuery = baseUrl.Contains("?");

        foreach (var property in jObject.Properties())
        {
            if (property.Value == null || property.Value.Type == JTokenType.Null)
                continue;

            sb.Append(hasQuery ? "&" : "?");
            hasQuery = true;

            string key = Uri.EscapeDataString(property.Name);
            string value = Uri.EscapeDataString(property.Value.ToString());

            sb.Append($"{key}={value}");
        }

        return sb.ToString();
    }
    
    public Table HttpGet(string url, Table query)
    {
        var urlCompleta = AppendJsonToUrl(url, query.TableToJson());
        var response = _client.GetAsync(urlCompleta).GetAwaiter().GetResult();
        return JsonTableConverter.JsonToTable(JsonConvert.SerializeObject(response));
    }
    
    public Table HttpSend(string method, string url, Table body)
    {
        var request = new HttpRequestMessage(new HttpMethod(method.ToUpper()), url);
        if (body != null)
        {
            var json = JsonSerializer.Serialize(body);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        var response = _client.SendAsync(request).GetAwaiter().GetResult();
        return JsonTableConverter.JsonToTable(JsonConvert.SerializeObject(response));    }
    
    public Table HttpDelete(string url, Table query)
    {
        var urlCompleta = AppendJsonToUrl(url, query.TableToJson());
        var response = _client.DeleteAsync(urlCompleta).GetAwaiter().GetResult();
        return JsonTableConverter.JsonToTable(JsonConvert.SerializeObject(response));
        
    }
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.Request.Path.ToString().StartsWith("/api"))
        {
            string path =  context.Request.Path.ToString().Remove(0, 4);
            if (path == "/load")
            {
                this.LoadScripts();
                return;
            }
            if (path == "/list")
            {
                var routes = _perigeuDbService.ListRoutes().Select(item => item.Path).ToList();
                if (routes.Count > 0)
                {
                    await context.Response.WriteAsync(JsonSerializer.Serialize(routes), Encoding.UTF8);
                    await next(context);
                    return;
                }
            }
            foreach (var route in _Routes)
            {
                if (route.Path == path & route.Method == context.Request.Method)
                {
                    UserData.RegisterAssembly(System.Reflection.Assembly.GetExecutingAssembly());
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.ContentType = "text/json";
                    using var runtime = new LuaSandboxRuntime(this, _perigeuDbService);
                    await runtime.ExecuteRouteAsync(route, path, context);
                    return;
                }
            }
        }
        await next(context);
    }
}
