namespace perigeu_dotnet.Models;

public record Script
{
    public long Id { get; init; }
    public string Chave { get; init; } = string.Empty;
    public string Descricao { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public List<Script> Dependencies { get; set; } = new();
}
