/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 14.08.2015.
 */
"use strict";

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bond007EsfUtl = require('@bond007/esf-utl');

var modUtl = _interopRequireWildcard(_bond007EsfUtl);

if (!ESF_UNHDLD_RJ_INTRCPTR || typeof ESF_UNHDLD_RJ_INTRCPTR === 'undefined') {
  process.on('unhandledRejection', function (reason, p) {

    if (reason.message.match(/Error on parsing command at position #0: Class '[^'\\]+' was not found/ig)) {
      console.log('Warning: Conjecture of class absence. Reason: ' + reason.message.replace('Error on parsing command at position #0: ', ''));
    } else {
      console.log('\nUnhandled Rejection at: Promise \n', p, ' \nreason: ', reason, '\n');
      console.trace(p);
    }
  });
  var ESF_UNHDLD_RJ_INTRCPTR = true;
}

var path = require('path'),
    fs = require('fs-extra'),
    ojs = require('orientjs');

var Utl = modUtl.Utl,
    L = Utl.log,
    E = Utl.rejectingError;

var DBIBsc = (function () {
  function DBIBsc() {
    _classCallCheck(this, DBIBsc);

    this.db = null;
    this.cfg = null;
    this.connAttempts = 0;
  }

  _createClass(DBIBsc, [{
    key: 'init',
    value: function init(cfg) {
      var H = this;

      var _initDbConnection = function _initDbConnection() {
        return new Promise(function (rs, rj) {
          try {

            L('Initializing OrientDB client...');

            var odbSrv = ojs(H.cfg.modes[H.cfg.mode].acc.odb.srv);
            H.db = odbSrv.use(H.cfg.modes[H.cfg.mode].acc.odb.usr);

            H.db.on("error", function (e) {
              return E(1012, 'Error communicating with OrientDB', e, rj);
            });

            L('OrientDB client initialized');

            rs(H.db);
          } catch (e1) {

            H.connAttempts++;

            L('Unsuccessful initialization of OrientDB client. ' + 'Retrying attempt ' + H.connAttempts + ' of ' + H.cfg.modes[H.cfg.mode].pcs.dbConnRetries + '...');

            if (H.connAttempts < H.cfg.modes[H.cfg.mode].pcs.dbConnRetries) {
              setTimeout(function () {
                _initDbConnection().then(function (rr) {
                  rs(rr);
                })['catch'](function (ee) {
                  E(1011, 'Error initializing OrientDB client', ee, rj);
                });
              }, H.cfg.modes[H.cfg.mode].pcs.dbConnTmOut);
            } else {
              return E(1013, 'All ' + H.cfg.modes[H.cfg.mode].pcs.dbConnRetries + ' connection attempts exceeded while initializing OrientDB client', e1, rj);
            }
          }
        });
      };

      return new Promise(function (rs, rj) {

        //initializing config
        H.cfg = cfg;

        //initializing db connection
        _initDbConnection().then(function (odb) {
          rs(H.db);
        })['catch'](function (e) {
          E(1, 'Error initializing connection to OrientDB', e, rj);
        });
      });
    }

    //todo: cache-independent class existence checking
  }, {
    key: 'classExists',
    value: function classExists(clsName) {
      var H = this;
      return new Promise(function (rs, rj) {

        H.db['class'].list().then(function (clsList) {

          var r = clsList.find(function (v, i, a) {
            return v.name && v.name === clsName;
          }) ? true : false;

          rs(r);
        })['catch'](function (e) {
          E(41, 'db error', e, rj);
        });
      });
    }
  }, {
    key: 'createClassIfNotExists',
    value: function createClassIfNotExists(classData) {
      var H = this;
      return new Promise(function (rsc, rjc) {

        H.classExists(classData.name).then(function (r) {

          if (r) {

            H.db['class'].get(classData.name).then(function (r2) {
              rsc(r2);
            })['catch'](function (e2) {
              return E(54, 'db error', e2, rjc);
            });
          } else {

            H.createClass(classData).then(function (r3) {
              rsc(r3);
            })['catch'](function (e3) {
              return E(53, 'db error', e3, rjc);
            });
          }
        })['catch'](function (e) {
          return E(52, 'db error', e, rjc);
        });
      });
    }
  }, {
    key: 'createClass',
    value: function createClass(classData) {
      var H = this;

      var _createClassProperty = function _createClassProperty(clsPtr, propData) {
        var H = this;
        return new Promise(function (rs, rj) {

          clsPtr.property.create(propData).then(function (r) {
            rs(r);
          })['catch'](function (e) {
            E(51, 'Error creating property ' + propData.name + ' for ' + clsPtr.name, e, rj);
          });
        });
      };

      return new Promise(function (rs, rj) {

        L('Creating class ' + classData.name + '...');

        H.db['class'].create(classData.name, 'V').then(function (clsDbPtr) {

          if (!clsDbPtr.name || clsDbPtr.name !== classData.name) {
            var msg = 'Error creating class ' + classData.name;
            return E(43, msg, new Error(msg), rj);
          }

          var wtr = [];
          classData.props.forEach(function (propData, i, a) {
            wtr.push(_createClassProperty(clsDbPtr, propData));
            if (i === a.length - 1) {
              Promise.all(wtr).then(function (rw) {

                L('Class ' + classData.name + ' created successfully');

                rs(clsDbPtr);
              })['catch'](function (ew) {
                return E(44, 'Error adding props to class ' + classData.name, ew, rj);
              });
            }
          });
        })['catch'](function (e) {

          if (e.message.indexOf('already exists in current database') !== -1) {
            H.db['class'].get(classData.name).then(function (r2) {
              rs(r2);
            })['catch'](function (e2) {
              return E(45, 'db error', e2, rj);
            });
          } else {
            return E(42, 'Error creating class ' + classData.name, e, rj);
          }
        });
      });
    }
  }, {
    key: 'insertRecords',
    value: function insertRecords(records) {
      var H = this;
      return new Promise(function (rs, rj) {});
    }
  }, {
    key: 'restoreClass',
    value: function restoreClass(archiveId) {
      var H = this;
      return new Promise(function (rs, rj) {});
    }
  }, {
    key: 'archiveClass',
    value: function archiveClass(className) {
      var transactionId = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
      var pth = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

      var H = this;
      return new Promise(function (rs, rj) {

        var data = {
          "class": {
            "name": null,
            "shortName": null,
            "defaultClusterId": null,
            "clusterIds": null,
            "superClass": null,
            "originalName": null
          },
          "records": []
        };

        var dftProp = {
          "name": null,
          "originalName": null,
          "type": null,
          "mandatory": null,
          "readonly": null,
          "notNull": null,
          "collate": null,
          "min": null,
          "max": null,
          "regexp": null,
          "linkedClass": null
        };

        H.db['class'].get(className).then(function (r) {

          try {

            //process properties
            Object.keys(data['class']).forEach(function (k) {
              data['class'][k] = r[k];
            });

            data['class']['properties'] = [];

            r.properties.forEach(function (rpro) {

              var newProp = JSON.parse(JSON.stringify(dftProp));

              Object.keys(dftProp).forEach(function (pf) {
                newProp[pf] = rpro[pf];
              });

              data['class'].properties.push(newProp);
            });

            //process records
            H.db.select().from(className).all().then(function (recs) {

              recs.forEach(function (rr) {

                if (rr.parent && rr.parent['@class'] === rr['@class']) {
                  rr.parent = rr['@class'];
                }

                data.records.push(JSON.parse(JSON.stringify(rr, null, '\t')));
              });

              //save to history
              //todo: use db to store class versions
              //todo: support large amount of records with Jl-writer

              var filePath = path.resolve(pth + '/' + transactionId + '_' + className + '.json');

              L('Saving archive to ' + filePath + ' for class ' + className + '...');

              fs.writeJSON(filePath, data, function (ew) {

                if (ew) {
                  E(506, 'Error saving archive to ' + filePath + ' for class ' + className, ew, rj);
                }

                L('Saved archive for class ' + className + '');
                rs(className);
              });
            })['catch'](function (e4) {
              E(505, 'Error getting records for class ' + className, e4, rj);
            });
          } catch (e1) {
            E(504, 'Error extracting properties of class ' + className, e1, rj);
          }
        })['catch'](function (e) {

          if (e.message.indexOf('No such class:') !== -1) {
            L('Warning: no such class ' + className, 'y');
            rs('No such class: ' + className);
          } else {
            E(503, 'Error getting class ' + className, e, rj);
          }
        });
      });
    }
  }, {
    key: 'dropClass',
    value: function dropClass(vtxName) {
      var H = this;
      return Promise.race([new Promise(function (rs, rj) {
        var tmOut = H.cfg.modes[H.cfg.mode].pcs.clsDelTmOut;
        setTimeout(function () {
          rs('Warning: class deletion timeout of ' + tmOut + ' exceeded', 'em');
        }, tmOut);
      }), new Promise(function (rs, rj) {

        var q = 'delete vertex ' + vtxName;

        try {
          H.db.exec(q).then(function (r) {

            if (!r || !r.hasOwnProperty('results')) {
              return E(523, 'q: ' + q, new Error('q: ' + q), rj);
            }

            H.db.exec('drop class ' + vtxName).then(function (r1) {

              rs(r1);
            })['catch'](function (e1) {
              E(522, 'Error dropping ' + vtxName, e1, rj);
            });
          });
        } catch (e) {
          E(521, 'q: ' + q, e, rj);
        }
      })]);
    }
  }, {
    key: 'truncateClass',
    value: function truncateClass(name) {
      var H = this;
      return new Promise(function (rs, rj) {});
    }
  }, {
    key: 'archiveClasses',
    value: function archiveClasses(classNames) {
      var H = this;
      return new Promise(function (rs, rj) {});
    }
  }, {
    key: 'dropClasses',
    value: function dropClasses(classNames) {
      var H = this;
      return new Promise(function (rs, rj) {});
    }
  }, {
    key: 'createClasses',
    value: function createClasses(data) {
      var H = this;
      return new Promise(function (rs, rj) {});
    }
  }]);

  return DBIBsc;
})();

exports.DBIBsc = DBIBsc;
//# sourceMappingURL=.maps/index.es7.js.map