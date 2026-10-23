using System.Collections.Generic;
using System.Data;
using MoonSharp.Interpreter;
using perigeu_dotnet.Models;
using Script = perigeu_dotnet.Models.Script;

namespace perigeu_dotnet.Interfaces;

public interface IPerigeuDbService
{
    public IDbConnection CreateConnection();
    public List<string> ListProcedures();
    public Table Execute(string procedureName, Table parameters);
    public List<Route> ListRoutes();
    public Route GetRoute(long id);
    public Route CreateRoute(Route route);
    public Route UpdateRoute(Route route);
    public bool DeleteRoute(long id);
    public List<Script> ListScripts();
    public Script GetScript(long id);
    public Script GetScriptByKey(string chave);
    public Script CreateScript(Script scriptDao);
    public Script UpdateScript(Script scriptDao);
    public bool DeleteScriptDao(long id);
    public List<Util> ListUtils();
}
