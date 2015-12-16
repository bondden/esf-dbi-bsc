/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 14.08.2015.
 */
"use strict";

if(!ESF_UNHDLD_RJ_INTRCPTR || typeof ESF_UNHDLD_RJ_INTRCPTR === 'undefined'){
  process.on('unhandledRejection', function(reason, p) {

    if(reason.message.match(/Error on parsing command at position #0: Class '[^'\\]+' was not found/ig)){
      console.log('Warning: Conjecture of class absence. Reason: '+reason.message.replace('Error on parsing command at position #0: ',''));
    }else{
      console.log('\nUnhandled Rejection at: Promise \n', p, ' \nreason: ', reason,'\n');
      console.trace(p);
    }

  });
  var ESF_UNHDLD_RJ_INTRCPTR=true;
}

var
  path     =require('path'),
  fs       =require('fs-extra'),
  ojs      =require('orientjs')
;

import * as modUtl from '@bond007/esf-utl';

var
  Utl=modUtl.Utl,
  L  =Utl.log,
  E  =Utl.rejectingError
;

export class DBIBsc {

  constructor(){
    this.db =null;
    this.cfg=null;
    this.connAttempts=0;
  }


  init(cfg){
    var H=this;

    var _initDbConnection=function(){
      return new Promise((rs,rj)=>{
        try{

          L('Initializing OrientDB client...');

          var odbSrv=ojs(H.cfg.modes[H.cfg.mode].acc.odb.srv);
          H.db      =odbSrv.use(H.cfg.modes[H.cfg.mode].acc.odb.usr);

          H.db.on("error",function(e){
            return E(1012,'Error communicating with OrientDB',e,rj);
          });

          L('OrientDB client initialized');

          rs(H.db);

        }catch(e1){

          H.connAttempts++;

          L('Unsuccessful initialization of OrientDB client. ' +
            'Retrying attempt '+H.connAttempts+' of '+H.cfg.modes[H.cfg.mode].pcs.dbConnRetries+'...');

          if(H.connAttempts<H.cfg.modes[H.cfg.mode].pcs.dbConnRetries){
            setTimeout(()=>{
              _initDbConnection().then((rr)=>{
                rs(rr);
              }).catch((ee)=>{
                E(1011,'Error initializing OrientDB client',ee,rj);
              });
            },H.cfg.modes[H.cfg.mode].pcs.dbConnTmOut);
          }else{
            return E(1013,'All '+H.cfg.modes[H.cfg.mode].pcs.dbConnRetries+' connection attempts exceeded while initializing OrientDB client',e1,rj);
          }

        }
      });
    };

    return new Promise((rs,rj)=>{

      //initializing config
      H.cfg=cfg;

      //initializing db connection
      _initDbConnection().then((odb)=>{
        rs(H.db);
      }).catch((e)=>{
        E(1,'Error initializing connection to OrientDB',e,rj);
      });

    });
  }
  //todo: cache-independent class existence checking
  classExists(clsName){
    var H=this;
    return new Promise((rs,rj)=>{

      H.db.class.list().then((clsList)=>{

        let r=clsList.find((v,i,a)=>{
          return v.name&&v.name===clsName;
        })?true:false;

        rs(r);

      }).catch((e)=>{
        E(41,'db error',e,rj);
      });

    });
  }

  createClassIfNotExists(classData){
    var H=this;
    return new Promise((rsc,rjc)=>{

      H.classExists(classData.name).then((r)=>{

        if(r){

          H.db.class.get(classData.name).then((r2)=>{
            rsc(r2);
          }).catch((e2)=>{
            return E(54,'db error',e2,rjc);
          });

        }else{

          H.createClass(classData).then((r3)=>{
            rsc(r3);
          }).catch((e3)=>{
            return E(53,'db error',e3,rjc);
          });

        }

      }).catch((e)=>{
        return E(52,'db error',e,rjc);
      });

    });
  }

  createClass(classData){
    var H=this;

    var _createClassProperty =function(clsPtr,propData){
      var H=this;
      return new Promise((rs,rj)=>{

        clsPtr.property.create(propData).then((r)=>{
          rs(r);
        }).catch((e)=>{
          E(51,'Error creating property '+propData.name+' for '+clsPtr.name,e,rj);
        });

      });
    };

    return new Promise((rs,rj)=>{

      L('Creating class '+classData.name+'...');

      H.db.class.create(classData.name,'V').then((clsDbPtr)=>{

        if(!clsDbPtr.name||clsDbPtr.name!==classData.name){
          let msg='Error creating class '+classData.name;
          return E(43,msg,new Error(msg),rj);
        }

        let wtr=[];
        classData.props.forEach((propData,i,a)=>{
          wtr.push(_createClassProperty(clsDbPtr,propData));
          if(i===a.length-1){
            Promise.all(wtr).then((rw)=>{

              L('Class '+classData.name+' created successfully');

              rs(clsDbPtr);
            }).catch((ew)=>{
              return E(44,'Error adding props to class '+classData.name,ew,rj);
            });
          }
        });

      }).catch((e)=>{
        
        if(e.message.indexOf('already exists in current database')!==-1){
          H.db.class.get(classData.name).then((r2)=>{
            rs(r2);
          }).catch((e2)=>{
            return E(45,'db error',e2,rj);
          });
        }else{          
          return E(42,'Error creating class '+classData.name,e,rj);          
        }
        
      });

    });
  }

  insertRecords(records){
    var H=this;
    return new Promise((rs,rj)=>{

    });
  }

  restoreClass(archiveId){
    var H=this;
    return new Promise((rs,rj)=>{

    });
  }

  archiveClass(className,transactionId='',pth=''){
    var H=this;
    return new Promise((rs,rj)=>{

      let data={
        "class"  :{
          "name"            :null,
          "shortName"       :null,
          "defaultClusterId":null,
          "clusterIds"      :null,
          "superClass"      :null,
          "originalName"    :null
        },
        "records":[]
      };

      let dftProp={
        "name"        :null,
        "originalName":null,
        "type"        :null,
        "mandatory"   :null,
        "readonly"    :null,
        "notNull"     :null,
        "collate"     :null,
        "min"         :null,
        "max"         :null,
        "regexp"      :null,
        "linkedClass" :null
      };

      H.db.class.get(className).then((r)=>{

        try{

          //process properties
          Object.keys(data.class).forEach((k)=>{
            data.class[k]=r[k];
          });

          data.class['properties']=[];

          r.properties.forEach((rpro)=>{

            let newProp=JSON.parse(JSON.stringify(dftProp));

            Object.keys(dftProp).forEach((pf)=>{
              newProp[pf]=rpro[pf];
            });

            data.class.properties.push(newProp);

          });

          //process records
          H.db.select()
            .from(className)
            .all()
            .then((recs)=>{

            recs.forEach((rr)=>{

              if(rr.parent && rr.parent['@class']===rr['@class']){
                rr.parent=rr['@class'];
              }

              data.records.push(JSON.parse(JSON.stringify(rr,null,'\t')));
            });

            //save to history
            //todo: use db to store class versions
            //todo: support large amount of records with Jl-writer

            let filePath=path.resolve(pth+'/'+transactionId+'_'+className+'.json');

            L('Saving archive to '+filePath+' for class '+className+'...');

            fs.writeJSON(filePath,data,(ew)=>{

              if(ew){
                E(506,'Error saving archive to '+filePath+' for class '+className,ew,rj);
              }

              L('Saved archive for class '+className+'');
              rs(className);

            });

            }).catch((e4)=>{
              E(505,'Error getting records for class '+className,e4,rj);
            });

        }catch(e1){
          E(504,'Error extracting properties of class '+className,e1,rj);
        }

      }).catch((e)=>{

        if(e.message.indexOf('No such class:')!==-1){
          L('Warning: no such class '+className,'y');
          rs('No such class: '+className);
        }else{
          E(503,'Error getting class '+className,e,rj);
        }
      });

    });
  }

  dropClass(vtxName){
    var H=this;
    return Promise.race([
      new Promise((rs,rj)=>{
        let tmOut=H.cfg.modes[H.cfg.mode].pcs.clsDelTmOut;
        setTimeout(()=>{
          rs('Warning: class deletion timeout of '+tmOut+' exceeded','em');
        },tmOut);
      }),
      new Promise((rs,rj)=>{

        let q='delete vertex '+vtxName;

        try{
          H.db.exec(q).then((r)=>{

            if(!r|| !r.hasOwnProperty('results')){
              return E(523,'q: '+q,new Error('q: '+q),rj);
            }

            H.db.exec('drop class '+vtxName).then((r1)=>{

              rs(r1);

            }).catch((e1)=>{
              E(522,'Error dropping '+vtxName,e1,rj);
            });

          });
        }catch(e){
          E(521,'q: '+q,e,rj);
        }

      })
    ]);
  }

  truncateClass(name){
    var H=this;
    return new Promise((rs,rj)=>{

    });
  }

  archiveClasses(classNames){
    var H=this;
    return new Promise((rs,rj)=>{

    });
  }

  dropClasses(classNames){
    var H=this;
    return new Promise((rs,rj)=>{

    });
  }

  createClasses(data){
    var H=this;
    return new Promise((rs,rj)=>{

    });
  }

}
