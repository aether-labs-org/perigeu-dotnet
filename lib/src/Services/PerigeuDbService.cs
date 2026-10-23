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
    private readonly DuckDBConnection _connection;

    public PerigeuDbService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
                            ?? throw new InvalidOperationException(
                                "ConnectionStrings:DefaultConnection não foi configurada. " +
                                "Use uma string do DuckDB, por exemplo: 'Data Source=perigeu.duckdb'.");

        if (connectionString.Contains("server=", StringComparison.OrdinalIgnoreCase) ||
            connectionString.Contains("port=", StringComparison.OrdinalIgnoreCase) ||
            connectionString.Contains("uid=", StringComparison.OrdinalIgnoreCase) ||
            connectionString.Contains("pwd=", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "A connection string atual ainda está no formato do MariaDB/MySQL. " +
                "Troque por DuckDB, por exemplo: 'Data Source=perigeu.duckdb'.");
        }

        _connection = new DuckDBConnection(connectionString);
        _connection.Open();
    }

    public IDbConnection CreateConnection() => _connection;

    #region Procedures
    public List<string> ListProcedures()
    {
        const string query = "SELECT descricao FROM perigeu_procedures ORDER BY descricao";
        var result = _connection.Query<string>(query).ToList();
        return result;
    }
    #endregion

    #region Routes
    public List<Route> ListRoutes()
    {
        var repo = new RouteRepository(_connection);
        return repo.List();
    }

    public Route GetRoute(long id)
    {
        var repo = new RouteRepository(_connection);
        return repo.GetById(id);
    }

    public Route CreateRoute(Route route)
    {
        var repo = new RouteRepository(_connection);
        return repo.Add(route);
    }

    public Route UpdateRoute(Route route)
    {
        var repo = new RouteRepository(_connection);
        return repo.Update(route);
    }

    public bool DeleteRoute(long id)
    {
        var repo = new RouteRepository(_connection);
        return repo.Delete(id);
    }
    #endregion

    #region Scripts

    public List<Script> ListScripts()
    {
        var repo = new ScriptRepository(_connection);
        return repo.List();
    }

    public Script GetScript(long id)
    {
        var repo = new ScriptRepository(_connection);
        return repo.GetById(id);
    }

    public Script GetScriptByKey(string chave)
    {
        var repo = new ScriptRepository(_connection);
        return repo.GetByKey(chave);
    }

    public Script CreateScript(Script scriptDao)
    {
        var repo = new ScriptRepository(_connection);
        return repo.Add(scriptDao);
    }

    public Script UpdateScript(Script scriptDao)
    {
        var repo = new ScriptRepository(_connection);
        return repo.Update(scriptDao);
    }

    public bool DeleteScriptDao(long id)
    {
        var repo = new ScriptRepository(_connection);
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
        var dbParams = new DynamicParameters();
        if (parameters != null)
        {
            foreach (var pair in parameters.Pairs)
            {
                dbParams.Add(pair.Key.String, pair.Value.ToObject());
            }
        }

        var procedureSql = _connection.QuerySingleOrDefault<string>(
            "SELECT parameters FROM perigeu_procedures WHERE descricao = $ProcedureName",
            new { ProcedureName = procedureName }
        );

        var commandText = string.IsNullOrWhiteSpace(procedureSql)
            ? procedureName
            : procedureSql;

        var resultRows = _connection.Query<dynamic>(
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

    public void Dispose()
    {
        _connection.Dispose();
    }
}
