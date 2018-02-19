/**
 * Created by Ali on 7/29/2014.
 */
"use strict";
const mongo = require("mongodb");
const mongo_client = mongo.MongoClient;

let dbURL;
let dbName = null;
let dbInstance = null;
let array_fetch_limit = 1000;
const _get = require("lodash/get");
const _set = require("lodash/set");

let logger;

const connect_config = {
    promiseLibrary: Promise,
    w: 1,
    wtimeout: 10000,
    j: true,
    forceServerObjectId: true,
    serializeFunctions: false,
    raw: false,
    bufferMaxEntries: 100,
    poolSize: 10,
    socketTimeoutMS: 0,
    connectTimeoutMS: 0,
    autoReconnect: true,
    noDelay: true,
    keepAlive: 50000,
    //readPreference: "nearest",
    reconnectTries: 1000,
    reconnectInterval: 1000

    //replSet: {
    //    ha: false
    //    , haInterval: 10000
    //    , replicaSet: "rs"
    //    , secondaryAcceptableLatencyMS: 100
    //    , connectWithNoPrimary: true
    //    , poolSize: 1
    //    , socketOptions: {
    //        noDelay: false
    //        , keepAlive: 100
    //        , connectTimeoutMS: 444444
    //        , socketTimeoutMS: 555555
    //    }
    //},
    //mongos: {
    //    ha: false
    //    , haInterval: 10000
    //    , secondaryAcceptableLatencyMS: 100
    //    , poolSize: 1
    //    , socketOptions: {
    //        noDelay: false
    //        , keepAlive: 100
    //        , connectTimeoutMS: 444444
    //        , socketTimeoutMS: 555555
    //    }
    //}
};

////////////////////////////////////////////////////////////////////////////////
///
///

/**
 * Replace Mongo DB ID string by an equivalent ObjectID
 * @param match
 */
const __replaceId = (match) => {
    if ((typeof match === "object") && match.hasOwnProperty("_id")) {
        try {
            if ((match._id) && (typeof match._id === "string")) {
                match._id = new mongo.ObjectID(match._id);
            } else if ((match._id) && (typeof match._id === "object")) {
                if (typeof match._id["$eq"] === "string") {
                    match._id["$eq"] = new mongo.ObjectID(match._id["$eq"]);
                }
            }
        } catch (ex) {
            match._id = null;
        }
    }
};

/**
 * Remove a named attribute (string as the name of the attribute) from doc.
 *
 * @param  {[type]} doc      [description]
 * @param  {[type]} attrName [description]
 * @return {[type]}          [description]
 */
const __removeAttribute = (doc, attrName) => {
    if ((typeof doc === "object") && doc.hasOwnProperty(attrName)) {
        try {
            delete doc[attrName];
        } catch (err) {
            logger.warn(err);
            doc[attrName] = null;
        }
    } else if (doc.hasOwnProperty("$set") && (doc["$set"][attrName])) {
        try {
            delete doc["$set"][attrName];
        } catch (err) {
            logger.warn(err);
            doc["$set"][attrName] = null;
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
///
///

/**
 *
 * @param config
 */
const init = (app_config, aLogger) => {
    if (!app_config.get("app:database")) {
        return Promise.resolve();
    } else {
        logger = aLogger;
        array_fetch_limit = app_config.get("app:database:array_fetch_limit") || 1000;

        dbName = app_config.get("app:database:database");

        logger.info("APP database management module initializing ...");

        dbURL = "mongodb://" + app_config.get("app:database:login_id") + ":" + app_config.get("app:database:login_password") + "@" + app_config.get("app:database:host_seed") + "/" + app_config.get("app:database:database");

        logger.info("APP database: " + dbName);

        //if the db app_config has replSet specified, then connect with replSet
        if (app_config.get("app:database:replSet")) {
            Object.assign(connect_config, {
                ha: true,
                haInterval: 10000,
                replicaSet: app_config.get("app:database:replSet"),
                secondaryAcceptableLatencyMS: 100,
                connectWithNoPrimary: false,
            });
        }

        return new Promise((resolve) => {
            /**
             * Connection to the database
             */
            (function dbConnect() {
                mongo_client.connect(dbURL, connect_config, (err, mongoClient) => {
                    if (err) {
                        logger.error(err);
                        setTimeout(dbConnect, app_config.get("app:database:connect_retry_millies"));
                    } else {
                        dbInstance = mongoClient.db(dbName);
                        logger.info("Successfully connected to the database.");
                        return resolve();
                    }
                });
            })();
        });
    }
};

/**
 * Insert single doc into collection. Adds a created_date field.
 * Note: it swallows duplicate key errors.
 * @param collectionName
 * @param doc
 * @param options
 */
const insertOne = (collectionName, doc, options) => {
    return new Promise((resolve, reject) => {
        let collection,
            datestamp = new Date();

        __removeAttribute(doc, "_id");

        doc.created_date = doc.created_date || datestamp;
        doc.date_last_updated = doc.date_last_updated || datestamp;
        collection = dbInstance.collection(collectionName);
        collection.insertOne(doc, options, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 *
 * @param collectionName
 * @param docs
 * @param options
 * @returns {*}
 */
const insertMany = (collectionName, docs, options) => {
    if (!Array.isArray(docs)) {
        return new Promise.reject(new Error("docs must be an array!"));
    }
    return new Promise((resolve, reject) => {
        let collection,
            datestamp = new Date(),
            updateDocs = docs.map(doc => {
                __removeAttribute(doc, "_id");
                doc.created_date = doc.created_date || datestamp;
                doc.date_last_updated = doc.date_last_updated || datestamp;
                return doc;
            });

        collection = dbInstance.collection(collectionName);
        collection.insertMany(updateDocs, options, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 * Find doc in collection according to "match"
 * @param collectionName
 * @param query
 * @param options
 */
const find = (collectionName, query, options) => {

    options = options || {};
    options.limit = options.limit || array_fetch_limit;

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);

        let cursor = collection.find(query).limit(options.limit);

        if (options.sort && Array.isArray(options.sort)) {
            cursor = cursor.sort(options.sort);
        }

        if (options.skip) {
            cursor = cursor.skip(options.skip);
        }

        if (options.project) {
            cursor = cursor.project(options.project);
        }

        cursor.toArray((err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 *
 * @param  {[type]} collectionName [description]
 * @param  {[type]} query          [description]
 * @param  {[type]} options        [description]
 * @return {[type]}                [description]
 */
const findOne = (collectionName, query, options) => {

    options = options || {};

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);

        collection.findOne(query, options).then((doc) => {
            return resolve(doc);
        }).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 *
 * @param  {[type]} collectionName [description]
 * @param  {[type]} query          [description]
 * @param  {[type]} options        [description]
 * @return {[type]}                [description]
 */
const findOneAndDelete = (collectionName, query, options) => {

    options = options || {};

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);

        collection.findOneAndDelete(query, options).then((result) => {
            if (result.ok === 1) {
                return resolve(result.value);
            } else {
                return reject(result.lastErrorObject);
            }

        }).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 *
 * @param  {[type]} collectionName [description]
 * @param  {[type]} query          [description]
 * @param  {[type]} replacement    [description]
 * @param  {[type]} options        [description]
 * @return {[type]}                [description]
 */
const findOneAndReplace = (collectionName, query, replacement, options) => {
    options = options || {};

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);

        collection.findOneAndReplace(query, replacement, options).then((result) => {
            if (result.ok === 1) {
                return resolve(result.value);
            } else {
                return reject(result.lastErrorObject);
            }

        }).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 *
 * @param  {[type]} collectionName [description]
 * @param  {[type]} query          [description]
 * @param  {[type]} updates        [description]
 * @param  {[type]} options        [description]
 * @return {[type]}                [description]
 */
const findOneAndUpdate = (collectionName, query, updates, options) => {
    options = options || {};

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);

        collection.findOneAndUpdate(query, updates, options).then((result) => {
            if (result.ok === 1) {
                return resolve(result.value);
            } else {
                return reject(result.lastErrorObject);
            }

        }).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 *
 * @param collectionName
 * @param query
 * @param options
 * @returns {*}
 */
const count = (collectionName, query, options) => {

    options = options || {};
    options.limit = options.limit || array_fetch_limit; //should be externalized and set in the config object

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);

        __replaceId(query);

        let cursor = collection.find(query).limit(options.limit);

        if (options.sort && Array.isArray(options.sort)) {
            cursor = cursor.sort(options.sort);
        }

        if (options.skip) {
            cursor = cursor.skip(options.skip);
        }

        if (options.project) {
            cursor = cursor.project(options.project);
        }

        cursor.count((err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 *
 * @param collectionName
 * @param query
 * @param options
 * @param iteratorCallback
 * @returns {*}
 */
const forEach = (collectionName, query, options, iteratorCallback) => {

    options = options || {};

    if (typeof iteratorCallback !== "function") {
        return Promise.reject(new Error("iteratorCallback function is required!"));
    }

    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);

        let cursor = collection.find(query);

        if (options.sort && Array.isArray(options.sort)) {
            cursor = cursor.sort(options.sort);
        }

        if (options.skip) {
            cursor = cursor.skip(options.skip);
        }

        if (options.project) {
            cursor = cursor.project(options.project);
        }

        cursor.forEach(iteratorCallback, (err) => {
            if (err) {
                logger.error(err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 *
 * @param collectionName
 * @param key
 * @param query
 * @param options
 * @returns {*}
 */
const distinct = (collectionName, key, query, options) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        collection.distinct(key, query, options || {}, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 * Create a unique index ona field. If it's already created, does nothing.
 * @param collectionName
 * @param fieldSpec
 * @param options
 */
const createIndex = (collectionName, fieldSpec, options) => {
    return new Promise((resolve, reject) => {
        dbInstance.createIndex(collectionName, fieldSpec, options).then(resolve).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 * Drop collection by name
 * @param collectionName
 */
const drop = (collectionName) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        collection.drop().then(resolve).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 *
 * @param collectionName
 * @returns {*}
 */
const indexes = (collectionName) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        collection.indexes().then(resolve).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    });
};

/**
 * Drop index by name
 * @param indexName
 * @param options
 */
const dropIndex = (collectionName, indexName, options) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        collection.dropIndex(indexName, options).then(resolve).catch((err) => {
            logger.error(err);
            reject(err);
        });
    });
};

/**
 *
 * @param collectionName
 * @param query
 * @param options
 * @returns {*}
 */
const deleteOne = (collectionName, query, options) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);
        collection.deleteOne(query, options || {}, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 * Remove document(s) from collection
 * @param collectionName
 * @param query
 * @param options
 */
const deleteMany = (collectionName, query, options) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        __replaceId(query);
        collection.deleteMany(query, options || {}, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

// /**
//  * Check if a collection exists
//  * @param collectionName
//  */
// const collectionExists =  (collectionName) => {
//     return new Promise((resolve, reject) => {
//         let collection = dbInstance.collection("system.namespaces");
//         let collectionNameMatch = {
//             name: dbName + "." + collectionName
//         };
//         collection.find(collectionNameMatch).count().then((count) => {
//             resolve(count > 0);
//         }).catch((err) => {
//             logger.error(err);
//             return reject(err);
//         });
//     });
// };

/**
 * Update one document
 *
 * @param collectionName
 * @param query
 * @param doc
 * @param options
 * @returns {*}
 */
const updateOne = (collectionName, query, doc, options) => {
    return new Promise((resolve, reject) => {

        doc = doc || {};

        __replaceId(query);

        __removeAttribute(doc, "_id");
        __removeAttribute(doc, "date_last_updated");

        let current_date_spec = _get(doc, "$currentDate", {});
        current_date_spec.date_last_updated = true;
        _set(doc, "$currentDate", current_date_spec);

        let collection = dbInstance.collection(collectionName);
        collection.updateOne(query, doc, options, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 *
 * @param collectionName
 * @param query
 * @param doc
 * @param options
 * @returns {*}
 */
const updateMany = (collectionName, query, doc, options) => {
    return new Promise((resolve, reject) => {

        doc = doc || {};

        __replaceId(query);
        __removeAttribute(doc, "_id");
        __removeAttribute(doc, "date_last_updated");

        let current_date_spec = _get(doc, "$currentDate", {});
        current_date_spec.date_last_updated = true;
        _set(doc, "$currentDate", current_date_spec);

        let collection = dbInstance.collection(collectionName);
        collection.updateMany(query, doc, options, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 *
 * @param collectionName
 * @param operations
 * @param options
 * @returns {*}
 */
const bulkWrite = (collectionName, operations, options) => {
    return new Promise((resolve, reject) => {
        let collection = dbInstance.collection(collectionName);
        collection.bulkWrite(operations, options || {}, (err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 * Get collections
 * @returns {*}
 */
// const getCollections = () => {
//     return new Promise((resolve, reject) => {
//         dbInstance.collections().then((docs) => {
//             let cache = [];
//             let result = JSON.stringify(docs, (key, value) => {
//
//                 if (key === "url" || key === "password" || key === "credentials") {
//                     // Do not send password info
//                     return "[hidden]";
//                 }
//
//                 if (typeof value === "object" && value !== null) {
//                     if (cache.indexOf(value) !== -1) {
//                         // Circular reference found, discard key
//                         return;
//                     }
//                     // Store value in our collection
//                     cache.push(value);
//                 }
//                 return value;
//             });
//             cache = null; // garbage collection
//             return resolve(result);
//
//         }).catch((err) => {
//             logger.error(err);
//             return reject(err);
//         });
//     });
// };

/**
 * Lists collection names in the database
 */
const listCollections = (filter, options) => {
    return new Promise((resolve, reject) => {
        dbInstance.listCollections(filter || {}, options || {}).toArray((err, data) => {
            if (err) {
                logger.error(err);
                return reject(err);
            } else {
                return resolve(data);
            }
        });
    });
};

/**
 *
 *
 * @type {Object}
 */
module.exports = {
    bulkWrite,
    init,
    insertOne,
    insertMany,
    find,
    findOne,
    findOneAndDelete,
    findOneAndReplace,
    findOneAndUpdate,
    count,
    forEach,
    distinct,
    createIndex,
    drop,
    indexes,
    dropIndex,
    deleteOne,
    deleteMany,
    listCollections,
    updateOne,
    updateMany
};
