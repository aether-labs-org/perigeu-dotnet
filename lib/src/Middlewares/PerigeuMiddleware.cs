using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.VisualBasic.CompilerServices;
using MoonSharp.Interpreter;
using MoonSharp.Interpreter.Serialization.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;
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
    private static List<perigeu_dotnet.Models.Script> _scripts;

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
                    
                    Script script = new Script( CoreModules.Preset_Complete | CoreModules.LoadMethods );
                    script.Globals["Path"] = path;
                    Table luaHeaderTable = new Table(script);
                    foreach (var header in context.Request.Headers)
                    {
                        luaHeaderTable[header.Key] = header.Value.ToString();
                    }
                    script.Globals["Headers"] = luaHeaderTable;
                    
                    if (context.Request.Method == "GET" || context.Request.Method == "DELETE")
                    {
                        Table luaQueryTable = new Table(script);
                        foreach (var param in context.Request.Query)
                        {
                            luaQueryTable[param.Key] = param.Value.ToString();
                        }
                        script.Globals["Query"] = luaQueryTable;
                    }

                    if (context.Request.Method == "POST" || context.Request.Method == "PATCH" ||
                        context.Request.Method == "PUT")
                    {
                        context.Request.EnableBuffering();
                        string bodyContent = await new StreamReader(context.Request.Body).ReadToEndAsync();
                        if (!string.IsNullOrWhiteSpace(bodyContent))
                        {
                            Table requestTable = JsonTableConverter.JsonToTable(bodyContent);
                            script.Globals["Body"] = requestTable;
                        }
                    }
                    
                    if (route.Utils is null)
                        route.Utils = new List<Util>();
                    
                    var utils = route.Utils.Select(item => item.Chave).ToList();
                    utils.Add("db");
                    utils.Add("cache");
                    utils.Add("log");
                    utils.Add("http");


                    if(utils.Contains("db"))                        
                        script.Globals["Execute"] = (Func<string,Table,Table>) _perigeuDbService.Execute;

                    if (utils.Contains("cache"))
                    {
                        script.Globals["CacheGet"] = (Func<string,Table>) this.CacheGet;
                        script.Globals["CacheSet"] = (Action<string,Table,int>) this.CacheSet;
                    }

                    if (utils.Contains("log"))
                    {
                        script.Globals["LogInfo"] = (Action<string,string>)this.LuaLogInfo;
                        script.Globals["LogWarning"] = (Action<string,string>)this.LuaLogWarning;
                        script.Globals["LogError"] = (Action<string,string>)this.LuaLogError;
                    }

                    if (utils.Contains("http"))
                    {
                        script.Globals["HttpGet"] = (Func<string,Table,Table>) this.HttpGet;
                        script.Globals["HttpSend"] = (Func<string,string,Table,Table>) this.HttpSend;
                        script.Globals["HttpDelete"] = (Func<string,Table,Table>) this.HttpDelete;
                    }

                    if (utils.Contains("file"))
                        throw new NotImplementedException();
                    
                    if (utils.Contains("mqtt"))
                        throw new NotImplementedException();

                    if (utils.Contains("signalr"))
                        throw new NotImplementedException();

                    foreach (var sc in route.Scripts ?? new List<Models.Script>())
                    {
                        script.DoString(sc.Body);
                    }
                    try
                    {
                        DynValue res = script.DoString(route.Script);
                        var json = res.Table.TableToJson();
                        if (json != null)
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