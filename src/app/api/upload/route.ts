import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const runtime='nodejs';
export async function POST(req:Request){
  if(!await getSession()) return NextResponse.json({error:'Unauthorized'},{status:401});
  const form=await req.formData();
  const files=form.getAll('files').filter((f):f is File=>f instanceof File);
  if(!files.length) return NextResponse.json({error:'No files selected'},{status:400});
  const dir=path.join(process.cwd(),'public','uploads');
  await fs.mkdir(dir,{recursive:true});
  const urls:string[]=[];
  for(const file of files){
    if(file.size>10*1024*1024) return NextResponse.json({error:`${file.name} exceeds 10 MB`},{status:400});
    const ext=path.extname(file.name).toLowerCase()||'.bin';
    const name=`${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;
    await fs.writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/${name}`);
  }
  return NextResponse.json({urls});
}
