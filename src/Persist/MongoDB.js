const {MongoClient, ObjectId} = require('mongodb');

const AClass = require('ailtire/src/Server/AClass');
module.exports = {
    load: async (obj) => await _load(obj),
    loadClass: async (cls) => await _loadClass(cls),
    loadAll: async () => await _loadAll(),
    save: async (obj) => await _save(obj),
    find: async (cls, args) => await _find(cls, args),
};

async function _find(cls, args) {
    const db = await connectToMongoDB();
    if (!db) return null;
    const collection = db.collection(cls.definition.name);
    const docs = await collection.find(args).toArray();
    const objs = [];
    for (const doc of docs) {
        const loadedObj = new cls({_loading: true, id: doc.id});
        _loadAttributes(loadedObj, doc);
        objs.push(loadedObj);
    }
    if(objs.length === 0) {
        return null;
    }
    return objs;
}

// --- Database Connection ---
async function connectToMongoDB() {
    if(global.mongoDBConnection) {
        return global.mongoDBConnection;
    }
    const uri = global.ailtire.config.persist.uri;
    const dbName = global.ailtire.config.persist.dbName;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        global.mongoDBConnection = client.db(dbName);
        return global.mongoDBConnection;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        return null;
    }
}


// --- Data Loading Functions ---
async function _loadAll() {
    const db = await connectToMongoDB();
    if (!db) return;
    let topLevelClasses = AClass.getTopLevelClasses();
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
        if(topLevelClasses[collection.name]) {
            await _loadClass(collection.name);
        }
    }
}

async function _loadClass(className) {
    const db = await connectToMongoDB();
    if (!db) return;
    const collection = db.collection(className);
    const objects = await collection.find({}).toArray();
    objects.forEach(doc => {
        const cls = AClass.getClass(doc._clsName); // Assuming AClass handles class retrieval
        const loadedObj = new cls({_loading: true, id: doc.id});
        _loadAttributes(loadedObj, doc);
        _loadAssociations(loadedObj, doc);
        loadedObj._state = doc._state;
        loadedObj._persist._notLoaded = false;

    });
}

function _loadAttributes(obj, doc) {
    for(let name in doc) {
        if(name[0] !== '_') {
            if(obj.definition.attributes.hasOwnProperty(name)) {
                obj[name] = doc[name];
            }
        }
    }

    return obj;
}
function _loadAssociations(obj, doc) {
    for(let name in doc) {
        if(name[0] !== '_') {
            if(obj.definition.associations.hasOwnProperty(name)) {
                if (obj.definition.associations[name].cardinality === 1) {
                    obj._associations[name] = _getAssociation(doc[name]);
                } else {
                    if (obj.definition.associations[name].unique) {
                        obj._associations[name] = {};
                        for (let j in doc[name]) {
                            obj._associations[name][j] = _getAssociation(doc[name][j]);
                        }
                    } else {
                        obj._associations[name] = [];
                        for (let j in doc[name]) {
                            obj._associations[name].push(_getAssociation(doc[name][j]));
                        }
                    }
                }
            }
        }
    }
    return obj;
}

function _getAssociation(obj) {
    let cls= AClass.getClass(obj._clsName);
    let id = obj.id || obj._aid;
    let assoc = cls.find(id);
    if(!assoc) {
        assoc = {_persist: {_notLoaded: true, _clsName:obj._clsName, _id:obj._id, _aid:obj.id}};
    }
    return assoc;
}

async function _load(obj) {
    const db = await connectToMongoDB();
    if (!db) return null;
    const collection = db.collection(obj._persist._clsName);
    const doc = await collection.findOne({_id: new ObjectId(obj._persist._id)}); // Use ObjectId
    if (!doc) return null; // Handle case where object not found

    const cls = AClass.getClass(doc._clsName);
    const loadedObj = new cls({_loading: true, id:doc.id});
    _loadAttributes(loadedObj, doc);
    _loadAssociations(loadedObj, doc);
    loadedObj._state = doc._state;
    loadedObj._persist._notLoaded = false;
    return loadedObj;
}

// --- Data Saving Functions ---
async function _save(obj) {

    const db = await connectToMongoDB();
    if (!db) return null;
    // this is needed to stop the recusive saving of objects with backlinks to other objects.

    if(!obj._persist.dirty) {
        return {_clsName: obj.className, _id: obj._id, _aid: obj.id};
    }
    obj._persist.dirty = false;

    const collection = db.collection(obj.className);
    const doc = await _toMongoDBDoc(obj);

    // Handle owner relationships by updating the owner document
    if (obj._persist.owner) {
        const ownerCollection = db.collection(obj._persist.owner.className);
        await ownerCollection.updateOne(
            {_id: new ObjectId(obj._persist.owner._id)}, //Use ObjectId
            {$push: {ownedObjects: doc._id}}
        );
    }
    const result = await collection.updateOne({_id: doc._id}, {$set: doc}, {upsert: true});
    return {_clsName: obj.className, _id:obj._id, _aid: obj.id};
}

async function _toMongoDBDoc(obj) {
    const doc = {
        _id: _generateObjectId(obj._id), //generate new or use existing ID
        _clsName: obj.className,
        _aid: obj.id,
        _state: obj._state,
        ...obj._attributes,
    };
    obj._id = doc._id;

    for(let i in obj._associations) {
        let assoc = obj._associations[i];
        if(!obj.definition.associations[i]) {
            console.error("Association not found:", i, " for ", obj.className);
        } else {
            if (obj.definition.associations[i].cardinality === 1) {
                if (obj.definition.associations[i].composition) {
                    doc[i] = await _toMongoDBDoc(assoc);
                } else if (obj.definition.associations[i].owner) {
                    doc[i] = await _save(assoc);
                } else {
                    doc[i] = await _save(assoc);
                }
            } else {
                if (obj.definition.associations[i].composition) {
                    doc[i] = [];
                    for (let j in assoc) {
                        doc[i].push(await _toMongoDBDoc(assoc[j]));
                    }
                } else if (obj.definition.associations[i].owner) {
                    doc[i] = [];
                    for (let j in assoc) {
                        doc[i].push(await _save(assoc[j]));
                    }
                } else {
                    doc[i] = [];
                    for (let j in assoc) {
                        doc[i].push(await _save(assoc[j]));
                    }
                }
            }
        }
    }
    return doc;
}


function _generateObjectId(existingId) {
    //if existing id exists, use it, otherwise generate a new one
    if(existingId) {
        return existingId;
    } else if(ObjectId.isValid(existingId)) {
        return ObjectId(existingId);
    }
    return new ObjectId();
}