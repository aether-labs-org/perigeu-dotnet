using MoonSharp.Interpreter;

namespace perigeu_dotnet.Models;

public class Route
{
    public long Id {get; set;}
    public string Method {get; set;}
    public string Path {get; set;}
    public string Script {get; set;}
    public List<Script>? Scripts {get; set;}
    public List<Util>? Utils {get; set;}
}