import { useEffect, useState } from "react";
import { api } from "./http";
export const getReferenceData = () => api.get('/reference-data');
export function useReferenceData() {
 const [data,setData]=useState({}), [error,setError]=useState('');
 useEffect(()=>{let active=true;getReferenceData().then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 return {data,error};
}
