import { api, type ScanResponse } from "$/src/client";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "./ui/dialog";
// import { App } from "$/src/server";

export default function Scanner() {
    const [loading, setLoading] = useState<boolean>(false);
    const [target, setTarget] = useState<string>("https://yoursite.ltd");
    const [scanResponse, setScanResponse] = useState<ScanResponse>( 
        { plugins : [] }
    )



    async function scanTarget() {
        setLoading(true);
        if( ! target || ! target.includes("http") ) {
            setLoading(false);
            return toast.error("Provide a valid target url.");
        }

        const response = await api.scan.post({
            url: target
        });

        if( response.status === 200 && response.data?.plugins )
            setScanResponse(response.data);
        else
            toast.error("Unable to complete the scan.");

        setLoading(false);
    }

    return (
        <div className="grid grid-cols-[25%_1fr] gap-6 mt-6 items-start h-[80vh]">
            <div className="flex flex-col gap-3 border bg-black p-3 rounded-sm">
                <span>Target Website</span>
                <Input
                    value={target}
                    onChange={( e ) => setTarget(e.target.value)}
                />
                <Button
                    onClick={scanTarget}
                    disabled={loading}
                >
                    {loading ? "Loading": "Scan" }
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {
                    loading ?
                        Array(9).fill(0).map( (_, i ) => 
                            <div key={i} className="w-full h-52 bg-neutral-800 rounded-sm animate-pulse">
                            </div>
                        )
                    : scanResponse && scanResponse.plugins.length > 0 ?
                        scanResponse.plugins.filter((p) => !p.slug.includes('netminds')).sort( (a, b ) => b.vulnerabilities.length - a.vulnerabilities.length ).map( (plugin, p) => 
                            <div className="p-3 bg-black border rounded-sm flex flex-col gap-2" key={p}>
                                <a href={plugin.url} target="blank">
                                    <span className="text-base font-medium" dangerouslySetInnerHTML={{ __html: plugin.name}}>
                                    </span>
                                </a>
                                <span className="text-neutral-300 text-sm">
                                    {plugin.slug} - <b>v{plugin.version}</b>
                                </span>
                                <span className="text-sm">
                                    <b>
                                    {plugin.vulnerabilities.length} 
                                    </b>
                                    {" "}
                                    {plugin.vulnerabilities.length > 1 ? "vulnerabilities" : "vulnerability"} found
                                </span>
                                {
                                    plugin.vulnerabilities.length ?
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size={'sm'}>Show</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader className="font-semibold">{plugin.name} - {plugin.version}</DialogHeader>
                                                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-scroll">
                                                    {plugin.vulnerabilities.map( (vuln, v) => 
                                                        <div className="flex flex-col gap-2 p-3 border rounded-sm" key={v}>
                                                            <span
                                                                className={ parseFloat(vuln.score) > 8 ? " text-red-600" : parseFloat(vuln.score) > 6 ? " text-orange-500" : parseFloat(vuln.score) > 4 ? " text-yellow-500" : "text-green-500" }
                                                                dangerouslySetInnerHTML={{ __html: `${vuln.name} - Score: ${vuln.score}`}}
                                                            ></span>
                                                            <div className="w-full border-t"></div>
                                                            <span>Resources</span>
                                                            <div className="flex flex-col gap-2">
                                                                {vuln.sources.map( (source, s ) => 
                                                                    <div className="text-sm" key={s}>
                                                                        {source.name} <a target="blank" className="text-blue-500 hover:text-blue-400 underline" href={source.link}>More</a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    : ""
                                }
                            </div>
                        )
                    : <div className="border p-3 rounded-sm bg-black">Start a scan to discover possible vulnerabilities.</div>
                }
            </div>
        </div>
    )
}