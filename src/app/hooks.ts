import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux'
import type {AppDispatch, RootState} from './store'
import {useState} from "react";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/**
 * @template T
 * @description can update value faster than useState by using inner variable.
 * @param {T} [initialValue] Value of State when initializing.
 * @returns {()=>void}  Function to get the latest value.
 * @returns {(value:T)=>void}  Function to set the value immediately.
 * @returns {T} Value of original state.
 * */
export function useCacheState<T>(initialValue: T): [() => T, (value: T) => void, T] {
    const [state, setState] = useState(initialValue);
    let tmp = state;
    const Setter = (value: T) => {
        tmp = value;
        setState(value);
    }
    const Getter = () => {
        return tmp;
    }
    return [Getter, Setter, state];
}