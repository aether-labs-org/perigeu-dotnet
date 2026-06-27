using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;

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
    public async Task<IActionResult> UpsertRouteAsync([FromBody] LuaRoute route)
    {
        if (route.Id == 0)
        {
            var createReturn =this._perigeuDbService.CreateRoute(route.Path, route.Script);
            return Ok(createReturn);
        }

        var updateReturn = this._perigeuDbService.UpdateRoute(route);
        return Ok(updateReturn);
    }
    
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteRouteAsync([FromRoute] long id)
    {
        if(this._perigeuDbService.DeleteRoute(id))
            return Ok();
        return NotFound();
    }

    
}