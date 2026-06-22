using System.Collections.Generic;
using MoonSharp.Interpreter;
using perigeu_dotnet.Models;

namespace perigeu_dotnet.Interfaces;

public interface IPerigeuDbService
{
    public List<string> ListProcedures();
    public Table Execute(string procedureName, Table parameters);
    public List<LuaRoute> ListRoutes();
    public LuaRoute CreateRoute(string path,string script);
    public LuaRoute UpdateRoute(string path,string script);
    public bool DeleteRoute(int id);
}