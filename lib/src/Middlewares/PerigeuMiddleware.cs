using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MoonSharp.Interpreter;
using MoonSharp.Interpreter.Serialization.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace perigeu_dotnet.Middlewares;

public sealed class PerigeuMiddleware: IMiddleware
{
    private readonly IPerigeuDbService _perigeuDbService;
    private readonly IMemoryCache _cache;
    private static List<LuaRoute> _luaRoutes = new();
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
        PerigeuMiddleware._luaRoutes = this._perigeuDbService.ListRoutes();
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
        if (context.Request.Path.ToString().StartsWith("/perigeu/api") && context.Request.Method == "POST")
        {
            string path =  context.Request.Path.ToString().Remove(0, 12);
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
            foreach (var route in _luaRoutes)
            {
                if (route.Path == path)
                {
                    UserData.RegisterAssembly(System.Reflection.Assembly.GetExecutingAssembly());
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.ContentType = "text/json";
                    context.Request.EnableBuffering(); // Permite ler o body sem desestabilizar a stream
                    
                    string bodyContent = await new StreamReader(context.Request.Body).ReadToEndAsync();
                    
                    Script script = new Script( CoreModules.Preset_Complete | CoreModules.LoadMethods );

                    script.Globals["Path"] = path;
                    
                    script.Globals["Execute"] = (Func<string,Table,Table>) _perigeuDbService.Execute;

                    script.Globals["CacheGet"] = (Func<string,Table>) this.CacheGet;
                    script.Globals["CacheSet"] = (Action<string,Table,int>) this.CacheSet;
                    
                    script.Globals["LogInfo"] = (Action<string,string>)this.LuaLogInfo;
                    script.Globals["LogWarning"] = (Action<string,string>)this.LuaLogWarning;
                    script.Globals["LogError"] = (Action<string,string>)this.LuaLogError;
                    
                    script.Globals["HttpGet"] = (Func<string,Table,Table>) this.HttpGet;
                    script.Globals["HttpSend"] = (Func<string,string,Table,Table>) this.HttpSend;
                    script.Globals["HttpDelete"] = (Func<string,Table,Table>) this.HttpDelete;
                    
                    if (!string.IsNullOrWhiteSpace(bodyContent))
                    {
                        Table requestTable = JsonTableConverter.JsonToTable(bodyContent);
                        script.Globals["Body"] = requestTable; // Injeta a tabela globalmente
                    }
                    else
                    {
                        script.Globals["Body"] = new Table(script); // Envia tabela vazia se não houver body
                    }

                    try
                    {
                        DynValue res = script.DoString(route.Script);
                        await context.Response.WriteAsync(res.Table.TableToJson(), Encoding.UTF8);
                    }
                    catch (Exception e)
                    {
                        context.Response.StatusCode = 500;
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(new {error= e.Message}), Encoding.UTF8);
                    }
                    return;
                }
            }
        }
        await next(context);
    }
}