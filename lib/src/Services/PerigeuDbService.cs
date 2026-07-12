using System.Data;
using MySqlConnector; // Driver específico para MariaDB/MySQL
using Dapper;
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

    private IDbConnection GetConnection() => new MySqlConnection(_connectionString);

    #region Procedures
    public List<string> ListProcedures()
    {
        using var db = GetConnection();
        string query = "SELECT Descricao FROM perigeu_procedures order by descricao";
        var result = db.Query<string>(query).ToList();
        return result;
    }
    #endregion

    #region Routes
    public List<Route> ListRoutes()
    {
        var repo = new RouteRepository(GetConnection());
        return repo.List();
    }

    public Route GetRoute(long id)
    {
        var repo = new RouteRepository(GetConnection());
        return repo.GetById(id);
    }

    public Route CreateRoute(Route route)
    {
        var repo = new RouteRepository(GetConnection());
        return repo.Add(route);
    }

    public Route UpdateRoute(Route route)
    {
        var repo = new RouteRepository(GetConnection());
        return repo.Update(route);
    }

    public bool DeleteRoute(long id)
    {
        var repo = new RouteRepository(GetConnection());
        return repo.Delete(id);
    }
    #endregion

    #region Scripts

    public List<Script> ListScripts()
    {
        throw new NotImplementedException();
    }

    public Script GetScript(long id)
    {
        throw new NotImplementedException();
    }

    public Script CreateScript(Script scriptDao)
    {
        throw new NotImplementedException();
    }

    public Script UpdateScript(Script scriptDao)
    {
        throw new NotImplementedException();
    }

    public bool DeleteScriptDao(long id)
    {
        throw new NotImplementedException();
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
        if(!this.ListProcedures().Contains(procedureName))
            throw new Exception($"Procedure {procedureName} does not exist");

        var dbParams = new DynamicParameters();
        if (parameters != null)
        {
            foreach (var pair in parameters.Pairs)
            {
                // O MariaDB mapeia os parâmetros ignorando o '@' no mapeamento do Dapper, 
                // mas você pode passar a chave pura do Lua (ex: se no Lua for 'id', no banco será '@id')
                dbParams.Add(pair.Key.String, pair.Value.ToObject());
            }
        }

        // Executa a Procedure no MariaDB
        var resultRows = db.Query<dynamic>(
            procedureName,
            dbParams,
            commandType: CommandType.StoredProcedure
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