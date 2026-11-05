import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';import {deflateRawSync} from 'node:zlib';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function releaseMetadata(version,repo){
  if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Use uma versão semântica, por exemplo 0.1.1.');
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo))throw Error('Use --repo proprietario/repositorio.');
  const url=`https://github.com/${repo}`;
  return {url,manifest:`${url}/releases/latest/download/system.json`,download:`${url}/releases/download/v${version}/shinobi-no-sho-v${version}.zip`,bugs:`${url}/issues`,changelog:`${url}/blob/main/CHANGELOG.md`};
}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function zipBuffer(files){
  const chunks=[],central=[];let offset=0;
  for(const {name,data}of files){const filename=Buffer.from(name),packed=deflateRawSync(data),crc=crc32(data);const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(0x21,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);chunks.push(local,filename,packed);
    const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(8,10);entry.writeUInt16LE(0x21,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(packed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(filename.length,28);entry.writeUInt32LE(offset,42);central.push(entry,filename);offset+=local.length+filename.length+packed.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...chunks,directory,end]);
}
async function walk(dir){const result=[];for(const entry of (await readdir(dir)).sort()){const full=path.join(dir,entry);if((await stat(full)).isDirectory())result.push(...await walk(full));else result.push(full);}return result;}
export async function prepare({version,repo,check=false}={}){
  const manifest=JSON.parse(await readFile(path.join(root,'system.json'),'utf8'));const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));const configPath=path.join(root,'src/config.mjs');let config=await readFile(configPath,'utf8');
  version??=manifest.version;repo??=manifest.url?.replace('https://github.com/','');const urls=releaseMetadata(version,repo);
  if(check){if(pkg.version!==version||!config.includes(`VERSION = "${version}"`)||manifest.version!==version||manifest.download!==urls.download||manifest.manifest!==urls.manifest)throw Error('Versões ou URLs divergentes. Execute release:prepare com --version e --repo.');}
  else {manifest.version=version;Object.assign(manifest,urls);pkg.version=version;config=config.replace(/export const VERSION = "[^"]+"/,`export const VERSION = "${version}"`);await writeFile(configPath,config);await writeFile(path.join(root,'system.json'),JSON.stringify(manifest,null,2)+'\n');await writeFile(path.join(root,'package.json'),JSON.stringify(pkg,null,2)+'\n');}
  await mkdir(path.join(root,'dist'),{recursive:true});
  const selected=['system.json','README.md','LICENSE','CREDITS.md','CHANGELOG.md','AGENTS.md','RELEASE-NOTES.md'];for(const folder of ['src','styles','templates','lang','assets','docs'])selected.push(...(await walk(path.join(root,folder))).map(f=>path.relative(root,f).replaceAll('\\','/')));
  const files=[];for(const name of selected)files.push({name,data:await readFile(path.join(root,name))});
  const filename=`shinobi-no-sho-v${version}.zip`;await writeFile(path.join(root,'dist',filename),zipBuffer(files));await writeFile(path.join(root,'dist/system.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Pacote: dist/${filename}\nManifesto: ${urls.manifest}\nVersão sincronizada: ${version}`);return {manifest,filename,files:files.map(f=>f.name)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
  prepare({version:args.includes('--version')?value('--version'):undefined,repo:args.includes('--repo')?value('--repo'):undefined,check:args.includes('--check')}).catch(e=>{console.error(e.message);process.exitCode=1;});
}
