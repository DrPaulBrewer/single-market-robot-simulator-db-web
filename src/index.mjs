/* Copyright 2022- Paul Brewer, Economic and Financial Technology Consulting LLC */
/* This file is open source software.  The MIT License applies to this software. */

import { expectSafeObject, StudyFolder } from "single-market-robot-simulator-db-studyfolder";

const handlers = [
  ['json','json'],
  ['txt','text'],
  ['md','text'],
  ['zip','arrayBuffer']
];

let baseURL = '/';

export function setBaseURL(url){
  if (!url.endsWith('/'))
      throw new Error("setBaseURL error: url must end with /, got:"+url);
  baseURL = url;
}

const manifestFilename = 'manifest.json';

export class StudyFolderForWeb extends StudyFolder {
  async search(name){
    if (!this.manifest){
      this.manifest = await this.download({name: manifestFilename});
    }
    if (name===undefined){
      return this.manifest;
    }
    const entry = this.manifest.find((f)=>(f.name===name));
    if (entry)
      return [entry];
    return [];
  }

  async download({name}){
    if (typeof(name)!=='string') throw new Error("name[string] required");
    const pair = handlers.find(([ext])=>(name.endsWith(ext)));
    if (pair){
      const [ext, method] = pair; // eslint-disable-line no-unused-vars
      const response = await fetch(this.url+name);
      if (response.ok){
        const result = (method===null)? response: await response[method]();
        if (typeof(result)==='object')
          expectSafeObject(result);
        return result;
      }
      throw new Error(`download failed for ${name}`);
    }
    throw new Error(`download unimplemented for ${name}`);
  }
}


export async function listStudyFolders(name){
  const url = baseURL+manifestFilename;
  const response = await fetch(url);
  if (response.ok){
    const result = await response.json();
    expectSafeObject(result);
    result.forEach((f)=>{
      if(f.name && !f.url){
        f.url = baseURL+f.name+'/';
      }
    });
    if (name===undefined) {
      const folders = result.map((f)=>(new StudyFolderForWeb(f)));
      return folders;
    }
    const found = result.find((entry)=>(entry.name===name));
    if (found)
      return [new StudyFolderForWeb(found)];
  }
  return [];
}


