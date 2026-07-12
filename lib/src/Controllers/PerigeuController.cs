using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MoonSharp.Interpreter;
using perigeu_dotnet.Interfaces;
using perigeu_dotnet.Models;
using Script = perigeu_dotnet.Models.Script;

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
    public async Task<IActionResult> UpsertRouteAsync([FromBody] Route route)
    {
        if (route.Id == 0)
        {
            var createReturn =this._perigeuDbService.CreateRoute(route);
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

    [HttpGet("Script")]
    public async Task<IActionResult> ListScripts()
    {
        throw new NotImplementedException();
    }

    [HttpGet("Script/{id:long}")]
    public async Task<IActionResult> GetScript(long id)
    {
        throw new NotImplementedException();
    }
    
    [HttpPost("Script")]
    public async Task<IActionResult> UpsertScript([FromBody] Script script)
    {
        if(script.Id == 0)
            return Ok(this._perigeuDbService.CreateScript(script));
        return Ok(this._perigeuDbService.UpdateScript(script));
    }
    
    [HttpDelete("Script/{id:long}")]
    public async Task<IActionResult> DeleteScript(long id)
    {
        throw new NotImplementedException();
    }
    
    [HttpGet("Util")]
    public async Task<IActionResult> ListUtils()
    {
        throw new NotImplementedException();
    }

}