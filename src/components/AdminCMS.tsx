'use client';
import {useEffect,useState} from 'react';

const imageFields=new Set(['image_url','logo_url']);
const multiImageFields=new Set(['gallery_urls']);
const fileFields=new Set(['file_url']);

function labelOf(f:string){return f.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
export default function AdminCMS({module,title,fields}:{module:string,title:string,fields:string[]}){
 const[items,setItems]=useState<any[]>([]),[editing,setEditing]=useState<any>(null),[msg,setMsg]=useState(''),[busy,setBusy]=useState('');
 const load=()=>fetch('/api/content/'+module).then(r=>r.json()).then(setItems);
 useEffect(()=>{void load()},[module]);
 async function upload(field:string,files:FileList|null,multiple=false){if(!files?.length)return;setBusy(field);const fd=new FormData();Array.from(files).forEach(f=>fd.append('files',f));const r=await fetch('/api/upload',{method:'POST',body:fd});const d=await r.json();setBusy('');if(!r.ok){setMsg(d.error||'Upload failed');return}const el=document.querySelector(`[name="${field}"]`) as HTMLInputElement|HTMLTextAreaElement|null;if(el)el.value=multiple?d.urls.join('\n'):d.urls[0];setMsg('Upload complete. Click Save to publish.')}
 async function save(e:any){e.preventDefault();const body=Object.fromEntries(new FormData(e.currentTarget));for(const f of fields.filter(x=>x.startsWith('is_')))body[f]=e.currentTarget.elements[f]?.checked;const url='/api/content/'+module+(editing?'/'+editing.id:'');const r=await fetch(url,{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});setMsg(r.ok?'Saved successfully':'Unable to save');if(r.ok){setEditing(null);e.currentTarget.reset();load()}}
 async function del(id:number){if(confirm('Delete this item permanently?')){await fetch('/api/content/'+module+'/'+id,{method:'DELETE'});load()}}
 function field(f:string){if(f.startsWith('is_'))return <label className="check" key={f}><input type="checkbox" name={f} defaultChecked={editing?.[f]??true}/> {labelOf(f)}</label>;
 const area=f.includes('description')||['body','quote','requirements','answer','features','gallery_urls'].includes(f);
 const uploader=imageFields.has(f)||multiImageFields.has(f)||fileFields.has(f);
 return <div className="field-group" key={f}><label>{labelOf(f)}</label>{area?<textarea name={f} defaultValue={editing?.[f]||''} placeholder={multiImageFields.has(f)?'Uploaded image paths will appear here, one per line.':labelOf(f)}/>:<input className="input" name={f} defaultValue={editing?.[f]??''} placeholder={labelOf(f)}/>} {uploader&&<label className="upload-btn">{busy===f?'Uploading…':`Choose ${multiImageFields.has(f)?'Pictures':'File'} from Computer`}<input type="file" hidden multiple={multiImageFields.has(f)} accept={fileFields.has(f)?'.pdf,.doc,.docx,.xls,.xlsx,.zip,image/*':'image/*'} onChange={e=>upload(f,e.target.files,multiImageFields.has(f))}/></label>}</div>}
 return <div><div><div className="eyebrow">Content Management</div><h1>{title}</h1><p className="admin-help">Choose files directly from your computer. Uploaded paths are filled automatically; click Save to publish.</p></div>{msg&&<div className="notice">{msg}</div>}<div className="cms-layout"><form className="admin-card form" onSubmit={save} key={editing?.id||'new'}><h3>{editing?'Edit item':'Add new item'}</h3>{fields.map(field)}<div className="button-row"><button className="btn btn-red">Save</button>{editing&&<button type="button" className="btn btn-outline" onClick={()=>setEditing(null)}>Cancel</button>}</div></form><div className="admin-card table-wrap"><table><thead><tr><th>ID</th><th>Item</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.id}</td><td><strong>{x.title||x.name||x.question||x.client_name}</strong><br/><small>{x.category||x.location||x.email}</small></td><td><span className={x.is_active===false?'status-off':'status-on'}>{x.is_active===false?'Hidden':'Active'}</span></td><td><button className="link-btn" onClick={()=>setEditing(x)}>Edit</button> <button className="link-btn danger" onClick={()=>del(x.id)}>Delete</button></td></tr>)}</tbody></table></div></div></div>
}
