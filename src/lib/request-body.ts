// Reject oversized bodies while reading, without buffering the entire request.
export async function readLimitedBody(request:Request,limit:number):Promise<string|null>{
 if(Number(request.headers.get('content-length'))>limit)return null;
 if(!request.body)return '';
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();return null;}chunks.push(value);}return Buffer.concat(chunks,total).toString('utf8');}finally{reader.releaseLock();}
}
