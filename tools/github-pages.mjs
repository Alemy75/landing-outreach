import {spawnSync} from 'node:child_process';

// Obtain the existing GitHub login from Git Credential Manager, only in memory.
const result = spawnSync('git',['credential','fill'],{
  input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',
  env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}
});
const credential = Object.fromEntries((result.stdout||'').trim().split('\n').map(line=>{
  const split=line.indexOf('=');return [line.slice(0,split),line.slice(split+1)];
}));
if (!credential.password) throw new Error('No saved GitHub credentials are available.');
const base='https://api.github.com/repos/Alemy75/landing-outreach';
async function api(path='',method='GET',body) {
  const response=await fetch(base+path,{method,headers:{
    Authorization:`Bearer ${credential.password}`,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'
  },body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  return {status:response.status,data};
}
const action=process.argv[2]||'status';
if(action==='enable') {
  const existing=await api('/pages');
  const configured=await api('/pages',existing.status===404?'POST':'PUT',{
    build_type:'legacy',source:{branch:'main',path:'/'}
  });
  console.log(JSON.stringify({status:configured.status,url:configured.data.html_url,message:configured.data.message}));
  if(configured.status>=400) process.exitCode=1;
} else {
  const repo=await api();
  const pages=await api('/pages');
  const builds=await api('/pages/builds/latest');
  console.log(JSON.stringify({repo:{status:repo.status,private:repo.data.private,permissions:repo.data.permissions},pages:{status:pages.status,url:pages.data.html_url,source:pages.data.source},build:{status:builds.status,state:builds.data.status,error:builds.data.error?.message}}));
}
