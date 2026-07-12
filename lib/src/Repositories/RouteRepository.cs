using System.Data;
using Dapper;
using perigeu_dotnet.Models;
using Route = perigeu_dotnet.Models.Route;

namespace perigeu_dotnet.Repositories;

public class RouteRepository
{
    private IDbConnection _connection;

    public RouteRepository(IDbConnection connection)
    {
        this._connection = connection;
    }
    
    public List<Route> List()
    {
        string query = "SELECT id, method,path,script FROM perigeu_routes order by path,method";
        var result = this._connection.Query<Route>(query).ToList();
        return result;
    }
    
    public Route GetById(long id)
    {
        string query = "SELECT id, method,path,script FROM perigeu_routes order by path";
        var route = this._connection.Query<Route>(query).ToList().FirstOrDefault();
        if (route == null)
            throw new Exception($"Route with id {id} not found");
        route.Scripts = this._connection.Query<Script>($"select id,descricao,chave,body from perigeu_scripts where id in (select perigeu_script_id from perigeu_route_script_dep where perigeu_route_id = {route?.Id})").ToList();
        return route;
    }
    
    public Route Add(Route route)
    {
        string query =
            "INSERT INTO perigeu_routes (path, script,method) VALUES (@Path, @Script,@Method);" +
            "SELECT * FROM perigeu_routes WHERE Id = LAST_INSERT_ID();";
        var result = this._connection.Query<Route>(query, new { Path = route.Path, Script = route.Script ,Method = route.Method}).ToList();
        if (result.Count == 0)
            throw new Exception($"Insert Failed!");
        return result.FirstOrDefault()!;
    }

    public Route Update(Route route)
    {
        string query = @"
            UPDATE perigeu_routes 
            SET path = @Path, script = @Script , method = @Method
            WHERE id = @Id;
            SELECT * FROM perigeu_routes WHERE id = @Id;
        ";
        var updatedRoute = this._connection.QueryFirstOrDefault<Route>(query, route);
        return updatedRoute!;
    }

    public bool Delete(long id)
    {
        string query = @"delete from perigeu_routes WHERE id = @Id";
        this._connection.Query(query, new {Id = id});
        return true;    
    }
}