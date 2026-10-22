import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {prepare} from './release.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(command,args,options={})=>execFileSync(command,args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],...options});
try {
  const manifest=JSON.parse(await readFile(path.join(root,'system.json'),'utf8'));
  const repo=manifest.url.replace('https://github.com/',''),tag=`v${manifest.version}`;
  if(run('git',['status','--porcelain']).trim())throw Error('Faça commit de todas as mudanças antes de publicar.');
  const head=run('git',['rev-parse','HEAD']).trim();
  const remote=run('git',['ls-remote','origin','refs/heads/main']).trim().split(/\s+/)[0];
  if(head!==remote)throw Error('Envie o commit atual para origin/main antes de publicar.');
  const tags=run('git',['ls-remote','--tags','origin',`refs/tags/${tag}`]).trim();
  if(tags)throw Error('Esta versão já possui tag. Aumente a versão; não substitua uma publicação.');
  // Listing successful releases distinguishes an existing version from network/auth failures.
  const releases=JSON.parse(run('gh',['api','--paginate',`repos/${repo}/releases`,'--slurp'])).flat();
  if(releases.some(release=>release.tag_name===tag))throw Error('Esta versão já foi publicada. Aumente a versão.');
  run(process.execPath,['--test','tests/system.test.mjs'],{stdio:'inherit'});
  const {filename}=await prepare({repo,check:true});
  run('git',['tag',tag]);
  run('git',['push','origin',tag],{stdio:'inherit'});
  run('gh',['release','create',tag,path.join(root,'dist/system.json'),path.join(root,'dist',filename),'--repo',repo,'--verify-tag','--title',`Shinobi no Sho ${tag}`,'--notes-file',path.join(root,'RELEASE-NOTES.md')],{stdio:'inherit'});
  console.log(`Publicado: ${manifest.url}/releases/tag/${tag}`);
}catch(error){console.error(error.stderr?.toString()||error.message);process.exitCode=1;}
