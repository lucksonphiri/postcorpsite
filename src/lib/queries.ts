import {sql} from "./db";
export async function active(table:string,limit=50){try{return await sql(`SELECT * FROM ${table} WHERE is_active=true ORDER BY COALESCE(display_order,0), id DESC LIMIT $1`,[limit]) as any[]}catch{return []}}
export async function featured(table:string,limit=6){try{return await sql(`SELECT * FROM ${table} WHERE is_active=true AND is_featured=true ORDER BY id DESC LIMIT $1`,[limit]) as any[]}catch{return []}}
