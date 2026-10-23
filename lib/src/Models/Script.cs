using System.Text.Json.Serialization;

namespace perigeu_dotnet.Models;

public record Script
{
    public long Id { get; init; }
    [JsonPropertyName("key")]
    public string Chave { get; init; } = string.Empty;
    [JsonPropertyName("descricao")]
    public string Descricao { get; init; } = string.Empty;
    [JsonPropertyName("body")]
    public string Body { get; init; } = string.Empty;
    [JsonPropertyName("dependencies")]
    public List<Script> Dependencies { get; set; } = new();
}
