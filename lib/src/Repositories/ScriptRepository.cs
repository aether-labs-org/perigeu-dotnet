using System.Data;
using Dapper;
using perigeu_dotnet.Models;

namespace perigeu_dotnet.Repositories;

public class ScriptRepository
{
    private readonly IDbConnection _connection;

    public ScriptRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public List<Script> List()
    {
        _connection.Open();
        const string query = """
            SELECT id, chave, descricao, body
            FROM perigeu_scripts
            ORDER BY descricao, chave, id
            """;
        var scripts = _connection.Query<Script>(query).ToList();
        foreach (var script in scripts)
        {
            script.Dependencies = LoadDirectDependencies(script.Id);
        }

        return scripts;
    }

    public Script GetById(long id)
    {
        _connection.Open();

        const string scriptQuery = """
            SELECT id, chave, descricao, body
            FROM perigeu_scripts
            WHERE id = @Id
            """;
        var script = _connection.QueryFirstOrDefault<Script>(scriptQuery, new { Id = id });

        if (script == null)
            throw new Exception($"Script with id {id} not found");

        script.Dependencies = LoadDirectDependencies(script.Id);
        return script;
    }

    public Script Add(Script script)
    {
        _connection.Open();

        const string insertQuery = """
            INSERT INTO perigeu_scripts (chave, descricao, body)
            VALUES (@Chave, @Descricao, @Body)
            RETURNING id, chave, descricao, body;
            """;
        var created = _connection.QueryFirstOrDefault<Script>(insertQuery, script)
                      ?? throw new Exception("Insert failed.");

        SaveDependencies(created.Id, script.Dependencies);
        created.Dependencies = LoadDirectDependencies(created.Id);
        return created;
    }

    public Script Update(Script script)
    {
        _connection.Open();

        const string updateQuery = """
            UPDATE perigeu_scripts
            SET chave = @Chave,
                descricao = @Descricao,
                body = @Body
            WHERE id = @Id;
            """;
        var affectedRows = _connection.Execute(updateQuery, script);
        if (affectedRows == 0)
            throw new Exception($"Script with id {script.Id} not found");

        ReplaceDependencies(script.Id, script.Dependencies);
        return GetById(script.Id);
    }

    public bool Delete(long id)
    {
        _connection.Open();

        _connection.Execute("DELETE FROM perigeu_route_script_dep WHERE perigeu_script_id = @Id", new { Id = id });
        _connection.Execute("DELETE FROM perigeu_script_dep WHERE perigeu_script_id = @Id OR perigeu_script_dep_id = @Id", new { Id = id });
        var affectedRows = _connection.Execute("DELETE FROM perigeu_scripts WHERE id = @Id", new { Id = id });
        return affectedRows > 0;
    }

    private List<Script> LoadDirectDependencies(long scriptId)
    {
        const string query = """
            SELECT s.id, s.chave, s.descricao, s.body
            FROM perigeu_scripts s
            INNER JOIN perigeu_script_dep sd ON sd.perigeu_script_dep_id = s.id
            WHERE sd.perigeu_script_id = @ScriptId
            ORDER BY s.descricao, s.chave, s.id
            """;
        return _connection.Query<Script>(query, new { ScriptId = scriptId }).ToList();
    }

    private void SaveDependencies(long scriptId, IEnumerable<Script>? dependencies)
    {
        if (dependencies == null)
            return;

        foreach (var dependency in dependencies.Where(item => item.Id > 0))
        {
            _connection.Execute(
                """
                INSERT INTO perigeu_script_dep (perigeu_script_id, perigeu_script_dep_id)
                VALUES (@ScriptId, @DependencyId)
                """,
                new { ScriptId = scriptId, DependencyId = dependency.Id }
            );
        }
    }

    private void ReplaceDependencies(long scriptId, IEnumerable<Script>? dependencies)
    {
        _connection.Execute("DELETE FROM perigeu_script_dep WHERE perigeu_script_id = @ScriptId", new { ScriptId = scriptId });
        SaveDependencies(scriptId, dependencies);
    }
}
