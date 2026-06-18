using System.Text;
using MoonSharp.Interpreter;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;

namespace perigeu_dotnet.Middlewares;

public class PerigeuMiddleware: IMiddleware
{
    private IPerigeuDbService _perigeuDbService;
    private static List<LuaRoutes> _luaRoutes = new();

    public PerigeuMiddleware(IPerigeuDbService perigeuDbService)
    {
        this._perigeuDbService = perigeuDbService;
    }

    public void LoadScripts()
    {
        PerigeuMiddleware._luaRoutes = this._perigeuDbService.ListRoutes();
    }
    
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.Request.Path.ToString().StartsWith("/perigeu") && context.Request.Method == "POST")
        {
            string path =  context.Request.Path.ToString().Remove(0, 8);
            if (path == "/load")
                this.LoadScripts();
            foreach (var route in _luaRoutes)
            {
                if (route.Path == path)
                {
                    UserData.RegisterAssembly();
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.ContentType = "text/json";
                    Script script = new Script();
                    script.Globals["Execute"] = (Func<string,Table,Table>) _perigeuDbService.Execute;
                    DynValue res = script.DoString(route.Script);
                    await context.Response.WriteAsync(res.String, Encoding.UTF8);
                    break;
                }
            }
        }
        await next(context);
    }
}