using System.Data;
using MySqlConnector; // Driver específico para MariaDB/MySQL
using Dapper;
using MoonSharp.Interpreter;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;

namespace webapi.Services;

public class PerigeuDbService : IPerigeuDbService
{
    private readonly string _connectionString;

    public PerigeuDbService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new ArgumentNullException(nameof(configuration));
    }
    private IDbConnection GetConnection() => new MySqlConnection(_connectionString);

    public List<string> ListProcedures()
    {
        using var db = GetConnection();
        
        string query = @"select descricao from perigeuProcedures order by descricao desc";
        string startWith = "";
        var procedures = db.Query<string>(query, new { Filter = $"{startWith}%" });
        return procedures.ToList();
    }

    public List<LuaRoute> ListRoutes()
    {
        using var db = GetConnection();
        string query = "SELECT Id, Path, Script FROM perigeuLuaRoutes";
        var result = db.Query<LuaRoute>(query).ToList(); 
        return result ;
    }

    public LuaRoute CreateRoute(string path, string script)
    {
        throw new NotImplementedException();
    }

    public LuaRoute UpdateRoute(string path, string script)
    {
        throw new NotImplementedException();
    }

    public bool DeleteRoute(int id)
    {
        throw new NotImplementedException();
    }

    public Table Execute(string procedureName, Table parameters)
    {
        using var db = GetConnection();
        
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
        Script scriptContext = new Script();
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