using perigeu_dotnet.Controllers;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Middlewares;
using webapi.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuração dos serviços
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IPerigeuDbService, PerigeuDbService>();
builder.Services.AddScoped<PerigeuMiddleware>();
builder.Services.AddControllers().AddApplicationPart(typeof(PerigeuController).Assembly);
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddPolicy("DesenvolvimentoCORS", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Adicione aqui a URL/Porta exata do seu Frontend
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configuração do Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    // builder.Services.AddOpenApi(); (Se for usar futuramente no .NET 10)
}
app.UseCors("DesenvolvimentoCORS");
app.UseHttpsRedirection();
app.UseMiddleware<PerigeuMiddleware>();
app.MapControllers();

app.Run();