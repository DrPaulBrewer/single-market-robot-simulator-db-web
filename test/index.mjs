/* eslint-env node, mocha */

// Copyright 2022 Paul Brewer
// Economic and Financial Technology Consulting LLC
// Open Source License: MIT License

// import assert from 'assert';
import http from 'http';
import 'should';
import {setBaseURL, StudyFolderForWeb, listStudyFolders} from '../src/index.mjs';
import finalhandler from 'finalhandler';
import serveStatic from 'serve-static';
import fs from 'fs';

const configJsonFilename = 'test/data/Intro-1-ZI-Agent-Vary-Number-of-Buyers/config.json'
const expectedConfigJson = JSON.parse(fs.readFileSync(configJsonFilename));
const latin1 = {encoding: 'latin1'};
const port = 8844;
const localUrl = `http://127.0.0.1:${port}/`;
let server;

before(function(){
    const serve = serveStatic('./test/data', {index:false});
    server = http.createServer(function(req, res) {
        serve(req, res, finalhandler(req, res));
    });
    server.listen(port);
});


describe('single-market-robot-simulator-db-web', function(){
  describe('exported functions', function(){
    [
        ['setBaseURL', setBaseURL],
        ['listStudyFolders', listStudyFolders],
        ['StudyFolderForWeb', StudyFolderForWeb]
    ].forEach(([name, func])=>{
      it(`${name} should be a function`, ()=>{
        func.should.be.type('function');
      });
    });
  });
  describe('setBaseURL', function(){
     it('setBaseURL("") throws error, url should end with /', function(){
        function bad(){
            setBaseURL('');
        }
        bad.should.throw(/url must end with \//);
     });

     it(`setBaseURL(${localUrl}) should execute without error`, function(){
        setBaseURL(localUrl);
     });
  });
  let folders = [];
  describe('listStudyFolders', function(){
      it('listStudyFolders() should find Intro-1-ZI-Agent-Vary-Number-of-Buyers', async function(){
        folders = await listStudyFolders();
        folders.length.should.equal(1);
        folders[0].name.should.equal('Intro-1-ZI-Agent-Vary-Number-of-Buyers');
      });
      it('listStudyFolders("no-such-folder") should return empty array []', async function(){
          const folder = await listStudyFolders('no-such-folder');
          folder.should.deepEqual([]);
      });
      it('listStudyFolders("Intro-1-ZI-Agent-Vary-Number-of-Buyers") should find 1 folder', async function(){
         const folder = await listStudyFolders("Intro-1-ZI-Agent-Vary-Number-of-Buyers");
         folder.length.should.equal(1);
      });
  });
  describe(`test folder ${folders[0]}`, function(){
     it('folder.search() yields 2 files', async function(){
         const files = await folders[0].search();
         files.should.deepEqual([
             {name: '20201004T001600.zip'},
             {name: 'config.json'}
         ]);
     });
     it('folder.search("config.json") yields 1 file', async function(){
        const files = await folders[0].search('config.json');
        files.should.deepEqual([
            {name: 'config.json'}
        ]);
     });
     it('folder.search("nope") yields empty array', async function(){
        const files = await folders[0].search('nope');
        files.should.deepEqual([]);
     });
     it('folder.download({name:"config.json"}) succeeds and matches test file', async function(){
        const configJSON = await folders[0].download({name: 'config.json'});
        configJSON.should.deepEqual(expectedConfigJson);
     });
     it('folder.download({name:"bull.crap"}) rejects', async function(){
        async function bad(){
            return folders[0].download({name:"bull.crap"});
        }
        return bad().should.be.rejected();
     });
     it('folder.download({name:"bull.json"}) rejects', async function(){
        async function bad(){
            return folders[0].download({name:"bull.json"});
        }
        return bad().should.be.rejected();
     });
     it('folder.download() rejects', async function(){
         return folders[0].download().should.be.rejected();
     });
     it('folder.download({}) rejects', async function(){
          return folders[0].download({}).should.be.rejected();
     });
  });
});

after(function(){
    server.close();
});
