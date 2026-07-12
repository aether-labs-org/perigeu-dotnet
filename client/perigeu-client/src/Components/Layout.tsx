import Doc from "./Doc"
import RouteCodeEditor from "./RouteCodeEditor"
import RoutesList from "./RoutesList"
import ScriptCodeEditor from "./ScriptCodeEditor"
import ScriptsList from "./ScriptsList"
import { useEffect } from "react"

export default function Layout() {
    useEffect(()=>{
    },[])


    function changeTab(index: number){
        if(index == 1 ){
            document.getElementById("tabRotas")!.hidden = false
            document.getElementById("tabScripts")!.hidden = true
            document.getElementById("tabDoc")!.hidden = true
        } else if (index == 2) {
            document.getElementById("tabRotas")!.hidden = true
            document.getElementById("tabScripts")!.hidden = false
            document.getElementById("tabDoc")!.hidden = true
        } else if (index == 3) {
            document.getElementById("tabRotas")!.hidden = true
            document.getElementById("tabScripts")!.hidden = true
            document.getElementById("tabDoc")!.hidden = false
        }
    }

    return (
        <>
            <nav className="nav bg-dark">
                <div className="nav-left">
                    <a href="" className="brand text-light" >
                        Perigeu
                    </a>
                </div>
                <div className="nav-right">
                    <a onClick={() => { changeTab(1)}} className="text-light">Rotas</a>
                    <a onClick={() => { changeTab(2)}} className="text-light">Scripts</a>
                    <a onClick={() => { changeTab(3)}} className="text-light">Documentação</a>
                </div>
            </nav>
            <br />
            <main className="container">
                <div id="tabRotas">
                    <div className="row" >
                        <div className="card is-full-width bg-grey" style={{minWidth:"70vw"}}>
                            <div className="row">
                                <h1 className="text-light">Rotas</h1>
                            </div>
                            <div className="row">
                                <div className="col-4">
                                    <RoutesList></RoutesList>
                                </div>
                                <div className="col-8">
                                    <RouteCodeEditor></RouteCodeEditor>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="tabScripts" hidden>
                    <div className="row">
                        <div className="card is-full-width bg-grey" style={{minWidth:"70vw"}}>
                            <div className="row">
                                <h1 className="text-light">Scripts</h1>
                            </div>
                            <div className="row">
                                <div className="col-4">
                                    <ScriptsList></ScriptsList>
                                </div>
                                <div className="col-8">
                                    <ScriptCodeEditor></ScriptCodeEditor>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div id="tabDoc" hidden>
                    <Doc></Doc>    
                </div>                    
            </main>
        </>
    )
}