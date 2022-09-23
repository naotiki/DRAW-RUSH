import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'
import {useState} from "react";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


export  function useCacheState<T>(initialValue:T):[()=>T,(value:T)=>void,T] {
    const [state, setState] = useState(initialValue);
    let tmp = state;
    const Setter=(value:T)=>{
        tmp=value;
        setState(value);
    }
    const Getter=()=>{
        return tmp;
    }
    return [Getter,Setter,state];
}