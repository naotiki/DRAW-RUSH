import {useState} from "react";
//使い道あるかお前
class Resetter<T extends  keyof any>{
    targets:{
        [K in T]?:(()=>void)[]
    }={}
    targetArray:(()=>void)[]=[]
    register(resetFunc:()=>void,groups?:T[]){
        if (groups){
            groups.forEach(group=>{
                if (this.targets[group]!=undefined) {
                    this.targets[group]!.push(resetFunc)
                }else{
                    this.targets[group]=[resetFunc]
                }
            })
        }else{
            this.targetArray.push(resetFunc)
        }
    }
    reset(group:T){
        this.targets[group]!.forEach(e=>e())
    }
    resetAll(){
        Object.entries(this.targets).forEach(e=>{
            Array.of(...(e[1] as (() => void)[]),...this.targetArray).forEach(e=>e())
        })
    }
}
export function useResetter<T extends keyof any>(){
    const [state]=useState(new Resetter<T>())
    return state
}
export function useResettableState<T,U extends keyof any>(initialValue:T,resetter:Resetter<U>,groups?:U[]):[T,(value:T)=>void,()=>void]{
    const [state,setter]=useState(initialValue)
    const reset=()=>{
        setter(initialValue)
    }
    resetter.register(reset,groups)
    return [state,setter,reset]
}