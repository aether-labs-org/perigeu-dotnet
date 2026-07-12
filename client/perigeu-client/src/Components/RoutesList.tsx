import { useEffect, useState } from "react"
import type { Route } from "../Types/Route"
import { DeleteRoute, GetRoutes } from "../Services/PerigeuService"

export default function RoutesList() {
    let [routes,setRoutes] = useState<Route[]>([])

    const loadRoutes = async () => {
        let response = await GetRoutes()
        if(response){
            setRoutes(response)
        }
    }
    const deleteRoute = async (id:number) => {
        await DeleteRoute(id)
        await loadRoutes()
    }

    useEffect(() => {
        loadRoutes()
        window.addEventListener("loadRoutes",loadRoutes)
        return () => {
            window.removeEventListener("loadRoutes",loadRoutes)
        }
    },[])

    return (
        <>
            <div className="card" id="route-list">
                <ul>
                    {   routes.length > 0 ?
                        routes.map((route: Route) => {
                            return <li key={route.id}>
                                <div className="card">
                                    <div className="row">
                                        <div className="col">
                                            <b>{route.id}<br/>{route.path} <br />{route.method} </b> 
                                        </div>
                                        <div className="col">
                                            <div className="row">
                                                <a className="button outline" onClick={() => {
                                                    let e = new CustomEvent<Route>("setRoute",{detail: route})
                                                    window.dispatchEvent(e)
                                                }}>Editar</a>
                                            </div>
                                            <div className="row">
                                                <a className="button error" onClick={() => {deleteRoute(route.id)}}>Excluir</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        }) 
                        : <li>Sem Rotas Cadastradas</li>
                    }
                </ul>
            </div>
        </>
    )
}