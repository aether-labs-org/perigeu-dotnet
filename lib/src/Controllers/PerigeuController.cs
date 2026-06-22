using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using perigeu_dotnet.Interfaces;

namespace perigeu_dotnet.Controllers;

[ApiController]
[Route("[controller]")]
public class PerigeuController: Controller
{
    private IPerigeuDbService _perigeuDbService;

    public PerigeuController(IPerigeuDbService perigeuDbService)
    {
        this._perigeuDbService = perigeuDbService;
    }
    
    [HttpGet("hc")]
    public IActionResult HealthCheck()
    {
        return Ok("Serviço online");
    }    
    
    [HttpGet("Procedure")]    
    public async Task<IActionResult> ListProceduresAsync()
    {
        var procedures = this._perigeuDbService.ListProcedures(); 
        return Ok(procedures);
    }
    
    [HttpGet]    
    public async Task<IActionResult> ListRoutesAsync()
    {
        var routes = this._perigeuDbService.ListRoutes();
        return Ok(routes);
    }

    [HttpPost]    
    public async Task<IActionResult> CreateRouteAsync()
    {
        throw new NotImplementedException();
    }

    [HttpPut]    
    public async Task<IActionResult> UpdateRouteAsync()
    {
        throw new NotImplementedException();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteRouteAsync()
    {
        throw new NotImplementedException();
    }

    
}