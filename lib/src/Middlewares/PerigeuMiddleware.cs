using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using MoonSharp.Interpreter;
using MoonSharp.Interpreter.Serialization.Json;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;

namespace perigeu_dotnet.Middlewares;

public class PerigeuMiddleware: IMiddleware
{
    private IPerigeuDbService _perigeuDbService;
    private static List<LuaRoute> _luaRoutes = new();

    public PerigeuMiddleware(IPerigeuDbService perigeuDbService)
    {
        this._perigeuDbService = perigeuDbService;
        LoadScripts();
    }

    public void LoadScripts()
    {
        PerigeuMiddleware._luaRoutes = this._perigeuDbService.ListRoutes();
    }
    
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
//        Console.WriteLine(context.Request.Path.ToString());
        if (context.Request.Path.ToString().StartsWith("/perigeu/api") && context.Request.Method == "POST")
        {
            string path =  context.Request.Path.ToString().Remove(0, 12);
            Console.WriteLine(path);
            if (path == "/load")
            {
                this.LoadScripts();
                return;
            }
            if (path == "/list")
            {
                var routes = _perigeuDbService.ListRoutes().Select(item => item.Path).ToList();
                Console.WriteLine(string.Join(",", routes));
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
                    
                    script.Globals["Execute"] = (Func<string,Table,Table>) _perigeuDbService.Execute;
                    if (!string.IsNullOrWhiteSpace(bodyContent))
                    {
                        Table requestTable = JsonTableConverter.JsonToTable(bodyContent);
                        script.Globals["Request"] = requestTable; // Injeta a tabela globalmente
                    }
                    else
                    {
                        script.Globals["Request"] = new Table(script); // Envia tabela vazia se não houver body
                    }
                    
                    DynValue res = script.DoString(route.Script);
                    await context.Response.WriteAsync(res.Table.TableToJson(), Encoding.UTF8);
                    return;
                }
            }
        }
        await next(context);
    }
}