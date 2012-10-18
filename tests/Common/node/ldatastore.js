/*
*
* Copyright (C) 2011, The Locker Project
* All rights reserved.
*
* Please see the LICENSE file for more information.
*
*/
var IJOD = require('ijod').IJOD
  , lconfig = require('lconfig')
  , logger = require('logger')
  , lmongo = require('lmongo')
  , ijodFiles = {}
  , deepCompare = require('deepCompare')
  , mongo = {}
  , colls = {}
  , mongoIDs = {}
  ;

exports.init = function(owner, callback) {
    if (mongo[owner]) return callback();
    lmongo.init(owner, [], function(_mongo) {
        mongo[owner] = _mongo;
        colls[owner] = mongo[owner].collections[owner];
        callback();
    });
}

exports.addCollection = function(owner, name, dir, id) {
    mongoIDs[dir + "_" + name] = id;
    if(!colls[owner][dir + "_" + name]) {
        mongo[owner].addCollection(owner, dir + "_" + name);
        var ndx = {};
        ndx[id] = true;
        colls[owner][dir + "_" + name].ensureIndex(ndx,{unique:true},function() {});
    }
    if(!ijodFiles[dir + "_" + name])
        ijodFiles[dir + "_" + name] = new IJOD(name, dir);
}

// arguments: type should match up to one of the mongo collection fields
// object will be the object to persist
// options is optional, but if it exists, available options are: strip + timestamp
// strip is an array of properties to strip off before persisting the object.
// options = {strip: ['person','checkins']}, for example
// timeStamp will be the timestamp stored w/ the record if it exists, otherwise, just use now.
//
exports.addObject = function(owner, type, object, options, callback) {
    var timeStamp = Date.now();
    if (arguments.length == 3) callback = options;
    if (typeof options == 'object') {
        for (var i in options['strip']) {
            var key = options['strip'][i];
            delete object[key];
        }
        if (options['timeStamp']) {
            timeStamp = options['timeStamp'];
        }
    }
    setCurrent(owner, type, object, function(err, newType, doc) {
        if (newType === 'same') return callback(err, newType, doc);
        ijodFiles[type].addRecord(timeStamp, object, function(err) {
            callback(err, newType, doc);
        });
    });
}

// same deal, except no strip option, just timestamp is available currently
exports.removeObject = function(owner, type, id, options, callback) {
    var timeStamp = Date.now();
    if (arguments.length == 4) callback = options;
    if (typeof options == 'object') {
        if (options['timeStamp']) {
            timeStamp = options['timeStamp'];
        }
    }
    var record = {deleted: timeStamp};
    record[mongoIDs[type]] = id;
    ijodFiles[type].addRecord(timeStamp, record, function(err) {
        if (err) return callback(err);
        removeCurrent(owner, type, id, callback);
    })
}

exports.queryCurrent = function(owner, type, query, options, callback) {
  try {
    query = query || {};
    options = options || {};
    var m = getMongo(owner, type, callback);
    m.find(query, options).toArray(callback);
  } catch(err) {
    return callback(err);
  }
}

exports.getAllCurrent = function(owner, type, callback, options) {
  try {
    options = options || {};
    var m = getMongo(owner, type, callback);
    m.find({}, options).toArray(callback);
  } catch(err) {
    return callback(err);
  }
}

exports.getEachCurrent = function(owner, type, callback, options) {
  try {
    options = options || {};
    var m = getMongo(owner, type, callback);
    m.find({}, options).each(callback);
  } catch(err) {
    return callback(err);
  }
}

exports.getCurrent = function(owner, type, id, callback) {
  try {
    if (!(id && (typeof id === 'string' || typeof id === 'number')))  return callback(new Error('bad id:' + id), null);
    var m = getMongo(owner, type);
    var query = {_id: mongo[owner].db.bson_serializer.ObjectID(id)};
    m.findOne(query, callback);
  } catch(err) {
    return callback(err);
  }
}

exports.getCurrentId = function(owner, type, id, callback) {
  try {
    if (!(id && (typeof id === 'string' || typeof id === 'number')))  return callback(new Error('bad id:' + id), null);
    var m = getMongo(owner, type);
    var query = {"id":parseInt(id)};
    m.findOne(query, callback);
  } catch(err) {
    return callback(err);
  }
}


function setCurrent(owner, type, object, callback) {
    if (type && object && callback && object[mongoIDs[type]]) {
      try {
        var m = getMongo(owner, type, callback);
        var query = {};
        query[mongoIDs[type]] = object[mongoIDs[type]];
        m.findAndModify(query, [], object, {upsert:true, safe:true}, function(err, doc) {
            if (deepCompare(doc, {})) {
                m.findOne(query, function(err, newDoc) {
                    callback(err, 'new', newDoc);
                });
            } else {
                var id = doc._id;
                delete doc._id;
                if (deepCompare(doc, object)) {
                    callback(err, 'same', doc);
                } else {
                    doc._id = id;
                    callback(err, 'update', doc);
                }
            }
        });
      } catch(err) {
        return callback(err);
      }
    } else {
        logger.error('failed to set current in ldatastore');
        logger.error(type)
        logger.error(object)
        logger.error(callback);
    }
}

function removeCurrent(owner, type, id, callback) {
  try {
    var m = getMongo(owner, type);
    var query = {};
    query[mongoIDs[type]] = id;
    m.remove(query, callback);
  } catch(err) {
    return callback(err);
  }
}

function getMongo(owner, type) {
    var m = colls[owner][type];
    if(!m) {
      mongo[owner].addCollection(owner, type);
      m = colls[owner][type];
    }
    return m;
}
