/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 29.06.2015.
 */
'use strict';

var
  assert=require('chai').assert,
  path  =require('path'),
  fs    =require('fs-extra'),

  App   =require('../index.js').DBIBsc
  ;

function p(file){
  return path.resolve('tst/d/'+file);
}

var cfg=null;
var app=null;

var tmpClsDat={
  "name": "TmpTestClass",
  "props":[
    {
      "name":"prop1",
      "type":"String"
    },
    {
      "name":"prop2",
      "type":"String"
    }
  ]
};

suite('App Suite',function(){

  suiteSetup(function(done){

    //clear log
    fs.writeFile('/tmp/esfmod.log','',function(e0){
      if(e0){
        done(e0);
        return e0;
      }

      //load config
      fs.readJson(p('esfapp.cfg.json'),function(e,r){
        if(e){
          done(e);
          return e;
        }

        cfg=r;

        done();
      });

    });

  });

  suite('Initialization',function(){
    this.timeout(4000);

    test('new DBIBsc() It should create the app instance',(done)=>{
      app=new App();

      assert.isObject(app,'app should be an object');
      assert.property(app,'cfg','should have cfg property');
      done();
    });

    test('init(cfg) It should initialize db connection',(done)=>{
      app.init(cfg).then((r)=>{
        assert.property(app.cfg,'modes','cfg should have modes section');
        assert.property(app.cfg.modes[app.cfg.mode],'acc','should have access config section');
        assert.property(app.cfg.modes[app.cfg.mode].acc,'odb','should have db access config section');
        assert.property(app.cfg.modes[app.cfg.mode].acc.odb,'srv','should have srv db access config section');
        assert.property(app.cfg.modes[app.cfg.mode].acc.odb,'usr','should have usr db access config section');
        assert.isObject(app.db,'db should be an object');
        done();
      }).catch((e)=>{
        done(e);
      });
    });

    test('It should run a test query to db',(done)=>{
      app.db.exec("select count(*) from OUser").then((r)=>{
        assert.isObject(r,'db should be an object');
        assert.property(r,'results','r should have results property');
        assert.equal(r.results[0].content[0].value.count,3,'count of user should be 3');
        done();
      }).catch((e)=>{
        done(e);
      });
    });

  });

  suite('Operation',function(){
    this.timeout(10000);

    var
      tstDat,
      tstClassNames   =[],
      tstTransactionId='tstTrn',
      tstClassName    ='V',
      hstFile,
      hstPath
      ;

    suiteSetup((done)=>{

      hstPath=p(cfg.modes['tst'].pth.hst)+'/';
      hstFile=hstPath+'/'+tstTransactionId+'_'+tstClassName+'.json';

      Promise.all([
        new Promise((rs,rj)=>{

          fs.readJson(p('tst.cls.json'),(e,r)=>{
            if(e){
              rj(e);
              return e;
            }
            tstDat=r;

            tstDat.forEach((clsDat)=>{
              tstClassNames.push(clsDat.expectedClassName);
            });

            rs(true);
          });

        }),
        new Promise((rs,rj)=>{

          fs.remove(hstFile,(e)=>{
            if(e){
              rj(e);
              return;
            }
            rs(true);
          });

        })
      ]).then((r)=>{
        done();
      }).catch((e)=>{
        done(e);
      });

    });

    test('classExists(V): existent',(done)=>{

      app.classExists('V').then((r)=>{
        assert.equal(r,true,'class V exists');
        done();
      }).catch((e)=>{
        done(e);
      });

    });

    test('classExists(SomeNonExistentClass): non-existent',(done)=>{

      app.classExists('SomeNonExistentClass').then((r)=>{
        assert.equal(r,false,'class SomeNonExistentClass does not exist');
        done();
      }).catch(function(e){
        done(e);
      });

    });

    test('createClass(classData)',(done)=>{

      app.db.exec('drop class '+tmpClsDat.name).then((r0)=>{

        app.createClass(tmpClsDat).then((r)=>{
          assert.isObject(r,'r should be an object');
          assert.property(r,'name','should have prop name');
          assert.equal(r.name,tmpClsDat.name,'class name should be '+tmpClsDat.name);
          done();
        }).catch((e)=>{
          done(e);
        });

      }).catch((e0)=>{
        done(e0);
      });

    });

    test('createClassIfNotExists(classData)',(done)=>{

      app.db.exec('drop class '+tmpClsDat.name).then((r0)=>{

        app.createClassIfNotExists(tmpClsDat).then((r)=>{
          assert.isObject(r,'r should be an object');
          assert.property(r,'name','should have prop name');
          assert.equal(r.name,tmpClsDat.name,'class name should be '+tmpClsDat.name);
          done();
        }).catch((e)=>{
          done(e);
        });

      }).catch((e0)=>{
        done(e0);
      });

    });

    test('archiveClass(name, transactionId)',(done)=>{
      app.archiveClass(tstClassName,tstTransactionId,hstPath).then((r)=>{

        fs.readFile(hstFile,{encoding:'utf8'},(e,r)=>{
          if(e){
            done(e);
            return;
          }

          let d=JSON.parse(r);
          assert.isObject(d,'file stores an object');
          assert.property(d,'class','with `class` prop');
          assert.property(d.class,'name','with `name` prop');
          assert.equal(d.class.name,tstClassName,'that is '+tstClassName);

          done();

        });

      }).catch((e)=>{
        done(e);
      });

    });

    test.skip('insertRecords(records)',(done)=>{

    });

    test('dropClass(name)',(done)=>{

      app.createClassIfNotExists(tmpClsDat).then((r)=>{

        app.dropClass(tmpClsDat.name).then((r)=>{
          console.log(r);
          done();
        }).catch((e)=>{
          done(e);
        });

      }).catch((e)=>{
        done(e);
      });

    });

    test.skip('restoreClass(archiveId)',(done)=>{

    });

    test.skip('truncateClass(name)',(done)=>{

    });

    test.skip('archiveClasses(classNames)',(done)=>{

    });

    test.skip('dropClasses(classNames)',(done)=>{

    });

    test.skip('createClasses(data)',(done)=>{

    });

  });

});
