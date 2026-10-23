using System.Data;
using Dapper;
using perigeu_dotnet.Models;
using Route = perigeu_dotnet.Models.Route;

namespace perigeu_dotnet.Repositories;

public class RouteRepository
{
    private readonly IDbConnection _connection;

    public RouteRepository(IDbConnection connection)
    {
        this._connection = connection;
    }
    
    public List<Route> List()
    {
        const string query = "SELECT id, method, path, script FROM perigeu_routes ORDER BY path, method";
        var result = this._connection.Query<Route>(query).ToList();
        return result;
    }
    
    public Route GetById(long id)
    {
        const string query = "SELECT id, method, path, script FROM perigeu_routes WHERE id = $Id";
        var route = this._connection.QueryFirstOrDefault<Route>(query, new { Id = id });
        if (route == null)
            throw new Exception($"Route with id {id} not found");
        route.Scripts = this._connection.Query<Script>(
            """
            SELECT s.id, s.descricao, s.chave, s.body
            FROM perigeu_scripts s
            INNER JOIN perigeu_route_script_dep rsd ON rsd.perigeu_script_id = s.id
            WHERE rsd.perigeu_route_id = $RouteId
            ORDER BY rsd.ordem, s.id
            """,
            new { RouteId = route.Id }
        ).ToList();
        return route;
    }
    
    public Route Add(Route route)
    {
        const string query = """
            INSERT INTO perigeu_routes (path, script, method)
            VALUES ($Path, $Script, $Method)
            RETURNING id, method, path, script;
            """;
        var result = this._connection.QueryFirstOrDefault<Route>(
            query,
            new { Path = route.Path, Script = route.Script, Method = route.Method }
        );
        if (result == null)
            throw new Exception("Insert failed.");

        SaveScripts(result.Id, route.Scripts);
        result.Scripts = LoadScripts(result.Id);
        return result;
    }

    public Route Update(Route route)
    {
        const string query = """
            UPDATE perigeu_routes
            SET path = $Path, script = $Script , method = $Method
            WHERE id = $Id;
            """;
        this._connection.Execute(query, route);
        ReplaceScripts(route.Id, route.Scripts);
        return this.GetById(route.Id);
    }

    public bool Delete(long id)
    {
        _connection.Execute("DELETE FROM perigeu_route_script_dep WHERE perigeu_route_id = $Id", new { Id = id });
        _connection.Execute("DELETE FROM perigeu_route_utils_dep WHERE perigeu_route_id = $Id", new { Id = id });
        const string query = "DELETE FROM perigeu_routes WHERE id = $Id";
        var affectedRows = this._connection.Execute(query, new { Id = id });
        return affectedRows > 0;
    }

    private List<Script> LoadScripts(long routeId)
    {
        return this._connection.Query<Script>(
            """
            SELECT s.id, s.descricao, s.chave, s.body
            FROM perigeu_scripts s
            INNER JOIN perigeu_route_script_dep rsd ON rsd.perigeu_script_id = s.id
            WHERE rsd.perigeu_route_id = $RouteId
            ORDER BY rsd.ordem, s.id
            """,
            new { RouteId = routeId }
        ).ToList();
    }

    private void SaveScripts(long routeId, IEnumerable<Script>? scripts)
    {
        if (scripts == null)
            return;

        var orderedScripts = scripts
            .Where(item => item.Id > 0)
            .DistinctBy(item => item.Id)
            .ToList();

        for (var index = 0; index < orderedScripts.Count; index++)
        {
            var script = orderedScripts[index];
            _connection.Execute(
                """
                INSERT INTO perigeu_route_script_dep (perigeu_route_id, perigeu_script_id, ordem)
                VALUES ($RouteId, $ScriptId, $Order)
                """,
                new { RouteId = routeId, ScriptId = script.Id, Order = index + 1 }
            );
        }
    }

    private void ReplaceScripts(long routeId, IEnumerable<Script>? scripts)
    {
        _connection.Execute("DELETE FROM perigeu_route_script_dep WHERE perigeu_route_id = $RouteId", new { RouteId = routeId });
        SaveScripts(routeId, scripts);
    }
}
