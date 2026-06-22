using perigeu_dotnet.Controllers;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Middlewares;
using webapi.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuração dos serviços
builder.Services.AddScoped<IPerigeuDbService, PerigeuDbService>();
builder.Services.AddScoped<PerigeuMiddleware>();
builder.Services.AddControllers().AddApplicationPart(typeof(PerigeuController).Assembly);

var app = builder.Build();

// Configuração do Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    // builder.Services.AddOpenApi(); (Se for usar futuramente no .NET 10)
}

app.UseHttpsRedirection();
app.UseMiddleware<PerigeuMiddleware>();
app.MapControllers();

app.Run();