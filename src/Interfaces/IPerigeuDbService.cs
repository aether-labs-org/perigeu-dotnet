using MoonSharp.Interpreter;
using perigeu_dotnet.Models;

namespace perigeu_dotnet.Interfaces;

public interface IPerigeuDbService
{
    public List<string> ListProcedures(string startWith = "");
    public Table Execute(string procedureName, Table parameters);
    public List<LuaRoutes> ListRoutes();
}