using Microsoft.AspNetCore.Mvc;

namespace webapi.Controllers;

[ApiController]
[Route("/api")]
public class HealthCheck : ControllerBase
{
    [HttpGet("hc")]
    public IActionResult Hc()
    {
        return Ok("teste");
    }
}