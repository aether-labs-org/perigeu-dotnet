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
        _connection.Open();
        const string query = "SELECT id, method, path, script FROM perigeu_routes ORDER BY path, method";
        var result = this._connection.Query<Route>(query).ToList();
        return result;
    }
    
    public Route GetById(long id)
    {
        _connection.Open();
        const string query = "SELECT id, method, path, script FROM perigeu_routes WHERE id = @Id";
        var route = this._connection.QueryFirstOrDefault<Route>(query, new { Id = id });
        if (route == null)
            throw new Exception($"Route with id {id} not found");
        route.Scripts = this._connection.Query<Script>(
            """
            SELECT s.id, s.descricao, s.chave, s.body
            FROM perigeu_scripts s
            INNER JOIN perigeu_route_script_dep rsd ON rsd.perigeu_script_id = s.id
            WHERE rsd.perigeu_route_id = @RouteId
            ORDER BY rsd.ordem, s.id
            """,
            new { RouteId = route.Id }
        ).ToList();
        return route;
    }
    
    public Route Add(Route route)
    {
        _connection.Open();
        const string query = """
            INSERT INTO perigeu_routes (path, script, method)
            VALUES (@Path, @Script, @Method)
            RETURNING id, method, path, script;
            """;
        var result = this._connection.QueryFirstOrDefault<Route>(
            query,
            new { Path = route.Path, Script = route.Script, Method = route.Method }
        );
        if (result == null)
            throw new Exception("Insert failed.");
        return result;
    }

    public Route Update(Route route)
    {
        _connection.Open();
        const string query = """
            UPDATE perigeu_routes
            SET path = @Path, script = @Script , method = @Method
            WHERE id = @Id;
            """;
        this._connection.Execute(query, route);
        return this.GetById(route.Id);
    }

    public bool Delete(long id)
    {
        _connection.Open();
        const string query = "DELETE FROM perigeu_routes WHERE id = @Id";
        var affectedRows = this._connection.Execute(query, new { Id = id });
        return affectedRows > 0;
    }
}
