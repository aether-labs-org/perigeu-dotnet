using System.Data;
using Dapper;
using DuckDB.NET.Data;
using Microsoft.Extensions.Configuration;
using MoonSharp.Interpreter;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;
using perigeu_dotnet.Repositories;

using Route = perigeu_dotnet.Models.Route;
using Script = perigeu_dotnet.Models.Script;

namespace perigeu_dotnet.Services;

public class PerigeuDbService : IPerigeuDbService
{
    private readonly string _connectionString;

    public PerigeuDbService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
                            ?? throw new ArgumentNullException(nameof(configuration));
    }

    private IDbConnection GetConnection() => new DuckDBConnection(_connectionString);

    #region Procedures
    public List<string> ListProcedures()
    {
        using var db = GetConnection();
        db.Open();
        const string query = "SELECT descricao FROM perigeu_procedures ORDER BY descricao";
        var result = db.Query<string>(query).ToList();
        return result;
    }
    #endregion

    #region Routes
    public List<Route> ListRoutes()
    {
        using var connection = GetConnection();
        var repo = new RouteRepository(connection);
        return repo.List();
    }

    public Route GetRoute(long id)
    {
        using var connection = GetConnection();
        var repo = new RouteRepository(connection);
        return repo.GetById(id);
    }

    public Route CreateRoute(Route route)
    {
        using var connection = GetConnection();
        var repo = new RouteRepository(connection);
        return repo.Add(route);
    }

    public Route UpdateRoute(Route route)
    {
        using var connection = GetConnection();
        var repo = new RouteRepository(connection);
        return repo.Update(route);
    }

    public bool DeleteRoute(long id)
    {
        using var connection = GetConnection();
        var repo = new RouteRepository(connection);
        return repo.Delete(id);
    }
    #endregion

    #region Scripts

    public List<Script> ListScripts()
    {
        using var connection = GetConnection();
        var repo = new ScriptRepository(connection);
        return repo.List();
    }

    public Script GetScript(long id)
    {
        using var connection = GetConnection();
        var repo = new ScriptRepository(connection);
        return repo.GetById(id);
    }

    public Script CreateScript(Script scriptDao)
    {
        using var connection = GetConnection();
        var repo = new ScriptRepository(connection);
        return repo.Add(scriptDao);
    }

    public Script UpdateScript(Script scriptDao)
    {
        using var connection = GetConnection();
        var repo = new ScriptRepository(connection);
        return repo.Update(scriptDao);
    }

    public bool DeleteScriptDao(long id)
    {
        using var connection = GetConnection();
        var repo = new ScriptRepository(connection);
        return repo.Delete(id);
    }
    #endregion

    #region Utils
    public List<Util> ListUtils()
    {
        throw new NotImplementedException();
    }
    #endregion
    public Table Execute(string procedureName, Table parameters)
    {
        using var db = GetConnection();
        db.Open();

        var dbParams = new DynamicParameters();
        if (parameters != null)
        {
            foreach (var pair in parameters.Pairs)
            {
                dbParams.Add(pair.Key.String, pair.Value.ToObject());
            }
        }

        var procedureSql = db.QuerySingleOrDefault<string>(
            "SELECT parameters FROM perigeu_procedures WHERE descricao = @ProcedureName",
            new { ProcedureName = procedureName }
        );

        var commandText = string.IsNullOrWhiteSpace(procedureSql)
            ? procedureName
            : procedureSql;

        var resultRows = db.Query<dynamic>(
            commandText,
            dbParams,
            commandType: CommandType.Text
        ).ToList();

        // Monta a tabela de retorno do MoonSharp
        MoonSharp.Interpreter.Script scriptContext = new();
        Table luaResultTable = new Table(scriptContext);

        for (int i = 0; i < resultRows.Count; i++)
        {
            var row = resultRows[i] as IDictionary<string, object>;
            Table luaRow = new Table(scriptContext);

            if (row != null)
            {
                foreach (var cell in row)
                {
                    luaRow[cell.Key] = cell.Value;
                }
            }

            // Indexação do Lua (começa em 1)
            luaResultTable[i + 1] = luaRow;
        }

        return luaResultTable;
    }
}
