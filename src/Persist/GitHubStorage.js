const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');
const objectProxy = require('../Proxy/ObjectProxy');
const AClass = require('../Server/AClass');
const { GitHubStorageProvider, ExternalStorageProvider, AzureBlobStorageProvider, S3StorageProvider, MultiStorageProvider } = require('./StorageProviders');

const LARGE_FILE_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mp3', '.wav']);
const BINARY_FILE_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.mp4', '.mov', '.webm', '.m4v', '.avi', '.mp3', '.wav', '.m4a'
]);

class GitHubStorage {
    constructor(config) {
        this.config = config;
        this.repo = config.repo;
        this.localDir = config.localDir;
        this.repoName = this.repo ? this.repo.split('/').pop() : null;
        this.clonePath = path.resolve(config.cloneDir || config.clonePath || this.localDir || '.');
        const externalPath = config.externalDir || config.externalPath;
        this.externalPath = externalPath
            ? path.resolve(externalPath)
            : path.resolve(this.localDir || this.clonePath || '.', 'external_storage');
        this.modelPaths = {};
        this.modelClasses = {};
        this.loadedModelNames = new Set();
        this.providers = [];
        this.providerMap = {};
        this.blobStorageConfig = this.normalizeBlobStorageConfig(config.blobStorage || config.blobStorageConfig || config.blobs || {});
        this.pushQueue = [];
        this.pushQueueLimit = config.pushQueueLimit || 50;
        this.pushIntervalMs = config.pushIntervalMs || 60 * 1000;
        this.pushInProgress = false;
        this.pushTimer = setInterval(() => {
            void this.flushPushQueue();
        }, this.pushIntervalMs);
        if (this.pushTimer.unref) this.pushTimer.unref();

        if (config.modelPaths) {
            for (const [modelName, subDir] of Object.entries(config.modelPaths)) {
                this.registerModel(modelName, subDir);
            }
        }

        this.githubProvider = new GitHubStorageProvider({ basePath: this.clonePath });
        this.externalProvider = new ExternalStorageProvider({ basePath: this.externalPath });

        this.registerProvider('github', this.githubProvider);
        this.registerProvider('external', this.externalProvider);
        this.addProvider(this.githubProvider);
        this.addProvider(this.externalProvider);

        if (config.azure) {
            this.azureProvider = new AzureBlobStorageProvider(config.azure);
            this.registerProvider('azure', this.azureProvider);
            this.addProvider(this.azureProvider);
        }

        const s3Providers = [];
        if (config.minio) {
            s3Providers.push(new S3StorageProvider({ ...config.minio, name: 'MinIO' }));
        }
        if (config.cloudflare) {
            s3Providers.push(new S3StorageProvider({ ...config.cloudflare, name: 'Cloudflare' }));
        }

        if (s3Providers.length > 1) {
            this.s3Provider = new MultiStorageProvider({ providers: s3Providers });
            this.registerProvider('s3', this.s3Provider);
            this.registerProvider('minio', this.s3Provider);
            this.registerProvider('cloudflare', this.s3Provider);
            this.addProvider(this.s3Provider);
        } else if (s3Providers.length === 1) {
            this.s3Provider = s3Providers[0];
            this.registerProvider('s3', this.s3Provider);
            if (config.minio) {
                this.registerProvider('minio', this.s3Provider);
            }
            if (config.cloudflare) {
                this.registerProvider('cloudflare', this.s3Provider);
            }
            this.addProvider(this.s3Provider);
        }
    }

    normalizeBlobStorageConfig(blobStorage) {
        if (typeof blobStorage === 'string') {
            return { default: blobStorage, attributes: {}, useHeuristics: true };
        }
        const normalized = blobStorage && typeof blobStorage === 'object' ? { ...blobStorage } : {};
        normalized.default = normalized.default || normalized.provider || null;
        normalized.attributes = normalized.attributes || normalized.byAttribute || {};
        normalized.useHeuristics = normalized.useHeuristics !== undefined ? normalized.useHeuristics : true;
        return normalized;
    }

    registerProvider(name, provider) {
        if (!name || !provider) return;
        this.providerMap[String(name).toLowerCase()] = provider;
    }

    addProvider(provider) {
        this.providers.push(provider);
    }

    registerModel(modelClass, subDir) {
        const modelName = typeof modelClass === 'string'
            ? modelClass
            : modelClass?.definition?.name || modelClass?.name;
        if (!modelName) {
            return;
        }
        this.modelPaths[modelName] = subDir || this.getSubDir(modelName);
        if (typeof modelClass !== 'string' && modelClass) {
            this.modelClasses[modelName] = modelClass;
        }
    }

    resolveModelClass(modelClass) {
        if (!modelClass) return null;
        if (typeof modelClass !== 'string') return modelClass;
        return this.getModelClass(modelClass);
    }

    resolveModelName(modelClass) {
        if (!modelClass) return null;
        if (typeof modelClass === 'string') return modelClass;
        return modelClass?.definition?.name || modelClass?.name || null;
    }

    getSubDir(modelName) {
        return this.modelPaths[modelName] || modelName.toLowerCase();
    }

    getModelClass(typeName) {
        if (global.classes && global.classes[typeName]) return global.classes[typeName];
        return null;
    }

    getProviderByName(name) {
        if (!name) return null;
        return this.providerMap[String(name).toLowerCase()] || null;
    }

    resolveBlobProviderName(attr, instance, fileName) {
        const attrName = attr?.name || '';
        const modelName = instance?.definition?.name || '';
        const attrKey = `${modelName}.${attrName}`;
        const explicit = attr?.storageProvider || attr?.provider || attr?.storage;
        if (explicit && typeof explicit === 'string') {
            return explicit;
        }

        const configured = this.blobStorageConfig.attributes?.[attrKey] ||
            this.blobStorageConfig.attributes?.[attrName];
        if (configured) {
            return configured;
        }

        if (attr?.type === 'blob' && this.blobStorageConfig.default) {
            return this.blobStorageConfig.default;
        }

        if (attr?.type === 'file' && this.blobStorageConfig.fileDefault) {
            return this.blobStorageConfig.fileDefault;
        }

        if (this.blobStorageConfig.useHeuristics === false) {
            return null;
        }

        const ext = path.extname(fileName || '').toLowerCase();
        if (LARGE_FILE_EXTENSIONS.has(ext)) {
            return 'external';
        }
        return null;
    }

    init() {
        if (!fs.existsSync(this.localDir)) {
            fs.mkdirSync(this.localDir, { recursive: true });
        }

        if (!this.repo) {
            return;
        }

        if (!fs.existsSync(this.clonePath)) {
            try {
                console.error(`Cloning ${this.repo} to ${this.clonePath}`);
                execFileSync('git', ['clone', `https://github.com/${this.repo}.git`, this.clonePath], { stdio: ['ignore', 'ignore', 'inherit'] });
            } catch (error) {
                console.error(`Failed to clone repository ${this.repo}:`, error.message);
                throw error;
            }
        } else {
            try {
                console.error(`Pulling ${this.repo} in ${this.clonePath}`);
                execFileSync('git', ['-C', this.clonePath, 'pull', 'origin', 'main'], { stdio: ['ignore', 'ignore', 'inherit'] });
            } catch (error) {
                console.error(`Failed to pull repository ${this.repo}:`, error.message);
            }
        }
    }

    async loadAll(modelClass, subDir) {
        if (!modelClass) {

            console.log(`Loading all classes:`);
            const results = {};
            const registered = Object.keys(this.modelPaths);
            if (registered.length > 0) {
                for (const modelName of registered) {
                    const cls = this.getModelClass(modelName);
                    if (cls) {
                        results[modelName] = await this.loadAll(cls, this.modelPaths[modelName]);
                    }
                }
                this.resolveAllAssociations();
                return results;
            }

            /*
            if (global.classes) {
                for (const modelName of Object.keys(global.classes)) {
                    const cls = this.getModelClass(modelName);
                    if (cls) {
                        results[modelName] = await this.loadAll(cls, this.getSubDir(modelName));
                    }
                }
            }
            this.resolveAllAssociations();
            return results;
            
             */
        }
        console.log(`Loading all instances for model class: ${modelClass.name}`);

        const resolvedClass = this.resolveModelClass(modelClass);
        const modelName = this.resolveModelName(resolvedClass);
        if (!modelName || !resolvedClass) {
            return [];
        }
        const dir = subDir || this.modelPaths[modelName] || this.getSubDir(modelName);
        const fullPath = path.resolve(this.clonePath, dir);

        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
            console.error(`${modelName} directory does not exist:`, fullPath);
            this.loadedModelNames.add(modelName);
            return [];
        }

        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        let results = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const itemDir = path.join(fullPath, entry.name);
                // Always hydrate with the resolved registered model class
                // (the ClassProxy), not the caller's possibly raw constructor.
                const item = await this.loadItem(resolvedClass, itemDir);
                if (item) results.push(item);
            }
        }
        return results;
    }

    async loadClass(modelClass) {
        return await this.loadAll(modelClass);
    }

    async load(obj, maybeSubDir) {
        const modelName = this.resolveModelName(obj?.definition || obj?._persist?._clsName || obj?._persist?.clsName || obj?.definition?.name);
        const targetClass = this.getModelClass(modelName);
        if (!modelName || !targetClass) {
            return null;
        }

        let itemDir = this.getStorageDir(obj);
        if (!itemDir && obj?._persist?.directory) {
            itemDir = obj._persist.directory;
        }
        if (!itemDir && obj?._persist?.file) {
            itemDir = path.dirname(obj._persist.file);
        }
        if (!itemDir && maybeSubDir) {
            itemDir = maybeSubDir;
        }
        if (!itemDir) {
            const id = this.getInstanceFileName(obj);
            itemDir = path.resolve(this.clonePath, this.modelPaths[modelName] || this.getSubDir(modelName), id);
        } else if (!path.isAbsolute(itemDir)) {
            itemDir = path.resolve(this.clonePath, itemDir);
        }

        if (!fs.existsSync(itemDir)) {
            return null;
        }

        const loaded = await this.loadItem(targetClass, itemDir);
        if (loaded) {
            // A single-object load may occur outside loadAll(). Resolve against
            // anything already registered, while leaving missing targets as
            // persisted references until the next bulk pass.
            this.resolveInstanceAssociations(loaded, global._instances || {});
        }
        return loaded;
    }

    async find(obj, query) {
        const modelName = this.resolveModelName(obj?.definition || obj?._persist?._clsName || obj?.definition?.name);
        if (!modelName) {
            return null;
        }

        const existing = this.findInMemory(modelName, query);
        if (existing) {
            return existing;
        }

        await this.loadClass(modelName);
        return this.findInMemory(modelName, query);
    }

    findInMemory(modelName, query) {
        const instances = global._instances?.[modelName];
        if (!instances) {
            return null;
        }
        if (instances[query]) {
            return instances[query];
        }
        if (typeof query !== 'object' || query === null) {
            for (const id in instances) {
                const instance = instances[id];
                if (instance?.id === query || instance?.name === query) {
                    return instance;
                }
            }
            return null;
        }

        for (const id in instances) {
            const instance = instances[id];
            let foundMatch = true;
            for (const key in query) {
                const left = instance?.[key] ?? instance?._attributes?.[key];
                const right = query[key];
                if (typeof left === 'string' && typeof right === 'string') {
                    if (left.toLowerCase() !== right.toLowerCase()) {
                        foundMatch = false;
                        break;
                    }
                } else if (left !== right) {
                    foundMatch = false;
                    break;
                }
            }
            if (foundMatch) {
                return instance;
            }
        }
        return null;
    }

    getProvider(attr, content, fileName, instance) {
        const providerName = this.resolveBlobProviderName(attr, instance, fileName);
        if (providerName) {
            const provider = this.getProviderByName(providerName);
            if (provider) {
                return provider;
            }
        }

        // Legacy fallback path for older data/configurations.
        if (attr.storage === 's3' || attr.storage === 'minio' || attr.storage === 'cloudflare') {
            return this.s3Provider || this.externalProvider;
        }
        if (attr.storage === 'azure') {
            return this.azureProvider || this.externalProvider;
        }
        if (attr.storage === 'external' || attr.type === 'blob') {
            return this.externalProvider;
        }
        if (attr.type === 'file') {
            return this.githubProvider;
        }

        if (this.blobStorageConfig.useHeuristics === false) {
            return this.githubProvider;
        }

        // Legacy heuristic fallback.
        const ext = path.extname(fileName || '').toLowerCase();
        if (LARGE_FILE_EXTENSIONS.has(ext)) {
            return this.externalProvider;
        }

        if (content && content.length > 1024 * 1024) {
            return this.externalProvider;
        }

        return this.githubProvider;
    }

    stripStoragePrefix(fileName) {
        if (!fileName || typeof fileName !== 'string') {
            return fileName;
        }
        if (fileName.startsWith('ext://')) return fileName.substring(6);
        if (fileName.startsWith('s3://')) return fileName.substring(5);
        if (fileName.startsWith('azure://')) return fileName.substring(8);
        return fileName;
    }

    async loadItem(modelClass, itemDir) {
        const indexPath = path.join(itemDir, 'index.js');
        if (!fs.existsSync(indexPath)) return null;

        try {
            if (require.cache[require.resolve(indexPath)]) {
                delete require.cache[require.resolve(indexPath)];
            }
            const data = require(indexPath);
            return await this.loadInstanceFromData(modelClass, data, itemDir);
        } catch (e) {
            console.error(`Error loading item from ${itemDir}:`, e.message);
            return null;
        }
    }

    loadAttributes(definition, data, itemDir) {
        const attributes = {};
        for (let attrName in definition.attributes) {
            const attr = definition.attributes[attrName];
            const valueInIndex = data[attrName];

            // If it's a file/blob OR if the value in index looks like a storage URI,
            // treat it as an external file reference.
            const isExternal = attr.type === 'file' || attr.type === 'blob' ||
                (typeof valueInIndex === 'string' && valueInIndex.includes('://'));

            if (isExternal) {
                if (valueInIndex) {
                    attributes['_' + attrName + '_file'] = valueInIndex;
                    // Content is NOT loaded here - will be loaded on demand via loadAttribute
                }
            } else {
                if (data[attrName] !== undefined && data[attrName] !== null) {
                    attributes[attrName] = data[attrName];
                }
                // Fallback for bio.md if type is string
                if (attrName === 'bio' && typeof data[attrName] === 'string' && data[attrName].endsWith('.md')) {
                    const bioPath = path.join(itemDir, data[attrName]);
                    if (fs.existsSync(bioPath)) {
                        attributes[attrName] = fs.readFileSync(bioPath, 'utf-8');
                        attributes['_' + attrName + '_file'] = data[attrName];
                    }
                }
            }
        }

        if (attributes.id === undefined || attributes.id === null || attributes.id === '') {
            attributes.id = data.id || path.basename(itemDir || '').replace(/\s/g, '-');
        }
        return attributes;
    }

    async loadAssociations(definition, data, itemDir) {
        const associations = {};
        const loadRemoteReference = (value, assoc) => {
            if (value === undefined || value === null) return null;
            if (value?.definition?.name === 'ARemoteReference') return value;

            const source = value && typeof value === 'object' ? value : { rid: value };
            const rid = String(source.rid || source.id || source.name || '');
            const reference = {
                rid,
                type: assoc.remoteType,
                remoteType: assoc.remoteType,
                service: assoc.service,
                displayName: assoc.name,
            };
            if (!reference.rid) return null;
            return new ARemoteReference({ ...reference, _loading: true });
        };

        // Only owned associations are hydrated here;
        // non-owned associations remain as persisted references for the final
        // resolution pass once every model has been loaded.
        for (const [assocName, assoc] of Object.entries(definition.associations || {})) {
            const value = data[assocName];
            if (assoc.type === 'ARemoteReference') {
                if (assoc.cardinality === 1) {
                    const reference = loadRemoteReference(value, assoc);
                    if (reference) associations[assocName] = reference;
                } else if (Array.isArray(value)) {
                    associations[assocName] = value.map(item => loadRemoteReference(item, assoc)).filter(Boolean);
                } else if (value && typeof value === 'object') {
                    associations[assocName] = Object.fromEntries(
                        Object.entries(value)
                            .map(([key, item]) => [key, loadRemoteReference(item, assoc)])
                            .filter(([, item]) => item)
                    );
                }
                continue;
            }
            if (!assoc.owner) {
                if (value !== undefined && value !== null) associations[assocName] = value;
                continue;
            }

            const childClass = this.getModelClass(assoc.type);
            const assocDir = path.join(itemDir, assocName);
            const loadChild = async (childData, childDir) => {
                if (childData === undefined || childData === null) return null;
                return childClass
                    ? this.loadInstanceFromData(childClass, childData, childDir)
                    : childData;
            };

            if (assoc.cardinality === 1) {
                if (assoc.composition) {
                    const childId = childClass ? this.getDataFileName(value) : 'item';
                    const child = await loadChild(value, path.join(assocDir, childId));
                    if (child !== null) associations[assocName] = child;
                } else if (fs.existsSync(assocDir)) {
                    const entry = fs.readdirSync(assocDir, { withFileTypes: true }).find(entry => entry.isDirectory());
                    if (entry) associations[assocName] = await this.loadItem(childClass, path.join(assocDir, entry.name));
                }
                continue;
            }

            const source = assoc.composition ? value : null;
            const entries = source
                ? (Array.isArray(source) ? source.map((child, index) => [index, child]) : Object.entries(source))
                : (fs.existsSync(assocDir)
                    ? fs.readdirSync(assocDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => [entry.name, null])
                    : []);
            const loaded = assoc.uniq ? {} : [];
            for (const [key, childData] of entries) {
                const childId = childData ? this.getDataFileName(childData) : key;
                const child = assoc.composition
                    ? await loadChild(childData, path.join(assocDir, childId))
                    : await this.loadItem(childClass, path.join(assocDir, childId));
                if (child === null || child === undefined) continue;
                if (!assoc.uniq) {
                    loaded.push(child);
                    continue;
                }

                const uniqueKey = typeof assoc.uniq === 'function'
                    ? assoc.uniq(child)
                    : child.id;
                loaded[String(uniqueKey ?? childData?.id ?? childId)] = child;
            }
            if (Object.keys(loaded).length || loaded.length) associations[assocName] = loaded;
        }
        return associations;
    }

    async loadInstanceFromData(modelClass, data, itemDir) {
        modelClass = this.getModelClass(modelClass.definition.name);
        // Concrete channels declare only their channel-specific fields. Use
        // the merged definition so inherited AbstractChannel attributes and
        // associations are hydrated as well.
        const definition = getEffectiveDefinition(modelClass.definition);
        const instanceData = {
            ...this.loadAttributes(definition, data, itemDir),
            ...(await this.loadAssociations(definition, data, itemDir))
        };

        // Associations are loaded separately from attributes. Do not pass
        // them through the constructor: association initialization may merge
        // or otherwise transform values that are already hydrated.
        const loadedAssociations = {};
        for (const associationName of Object.keys(definition.associations || {})) {
            if (Object.prototype.hasOwnProperty.call(instanceData, associationName)) {
                loadedAssociations[associationName] = instanceData[associationName];
                delete instanceData[associationName];
            }
        }
        // Items that are stored as external files are not passed through the constructor.
        const fileAttributes = {};
        for (let attrName in definition.attributes) {
            const fieldName = '_' + attrName + '_file';
            if (Object.prototype.hasOwnProperty.call(instanceData, fieldName)) {
                fileAttributes[attrName] = instanceData[fieldName];
                delete instanceData[fieldName];
            }
        }

        // modelClass can be an Ailtire ClassProxy. Accessing its `prototype`
        // violates the Proxy invariant for the non-configurable prototype
        // property, so do not inspect prototype to recover the constructor.
        // The supplied class/proxy is itself constructable.
        const modelCtor = modelClass;
        
        // The ClassProxy assigns constructor arguments (including composed
        // associations) and then normally invokes create(), which assigns
        // those associations a second time. Mark this as hydration so the
        // constructor skips the create lifecycle while loading persisted data.
        let instance = new modelCtor({ ...instanceData, _loading: true });

        // ClassProxy validates constructor assignments against the concrete
        // class definition.  That definition may not expose inherited
        // attributes, even though `definition` above was merged for
        // persistence.  Restore all loaded attributes directly so parent
        // fields (for example AbstractChannel.accountID/accountInfo) are not
        // lost during construction.
        if (instance._attributes && instanceData) {
            for (const [attrName, value] of Object.entries(instanceData)) {
                if (!attrName.startsWith('_')) {
                    instance._attributes[attrName] = value;
                }
            }
        }
        
        // Some model registries expose the raw constructor rather than the
        // ClassProxy. Keep the persistence registry consistent by wrapping
        // raw hydrated instances before they are returned or cached.
        let isProxy = false;
        try {
            isProxy = typeof instance.isProxy === 'function' && instance.isProxy();
        } catch (e) {
            isProxy = false;
        }
        if (!isProxy) {
            instance = new Proxy(instance, objectProxy);
        }
        if (!instance.definition) {
            instance.definition = modelCtor.definition || modelClass.definition;
        }
        
        Object.defineProperty(instance, 'definition', {
            value: definition,
            writable: true,
            configurable: true,
            enumerable: true
        });
        // set the state from the file
        if (data && Object.prototype.hasOwnProperty.call(data, '_state')) {
            instance._state = data._state;
        } else if (instance._state === undefined || instance._state === null || instance._state === '') {
            instance._state = 'Init';
        }
        // ClassProxy/ObjectProxy have already hydrated the attributes passed
        // to the constructor. Only install associations here, once.
        Object.assign(instance._associations || (instance._associations = {}), loadedAssociations);
        this.setStorageDir(instance, itemDir);
        for (let attrName in fileAttributes) {
            this.setAttributeFile(instance, attrName, fileAttributes[attrName]);
        }
        this.setCompositionStorageDirs(instance, itemDir);
        attachBackLinks(instance);

        const modelName = instance.definition?.name || modelCtor.name || modelClass.name;
        if(!global._instances.hasOwnProperty(modelName)) {
            global._instances[modelName] = {};
        }
        global._instances[modelName][instance.id] = instance;
        return instance;
    }

    resolveAllAssociations() {
        
        const instances = global._instances || {};
        for (const [modelName, modelInstances] of Object.entries(instances)) {
            for (const instance of Object.values(modelInstances || {})) {
                this.resolveInstanceAssociations(instance, instances);
            }
        }
    }

    resolveInstanceAssociations(instance, instances) {
        const definition = getEffectiveDefinition(instance?.definition || {});
        for (const [assocName, assoc] of Object.entries(definition.associations || {})) {
            if (assoc.owner || assoc.type === 'ARemoteReference') continue;
            const raw = instance._associations?.[assocName];
            if (raw === undefined || raw === null) continue;
            const table = instances[assoc.type];
            const resolve = (value) => {
                if (value && typeof value === 'object' && value.definition) return value;
                const id = typeof value === 'object' ? (value.id || value.name) : value;
                if (id === undefined || id === null) return value;
                if (table?.[String(id)]) return table[String(id)];
                const inheritedInstances = AClass.getInstances(assoc.type);
                if(Object.keys(inheritedInstances).length > 0) {
                    let retval = inheritedInstances?.[String(id)] || value;
                    return retval;
                }
                return value;
            };
            if (assoc.cardinality === 1) {
                instance._associations[assocName] = resolve(raw);
            } else if (Array.isArray(raw)) {
                instance._associations[assocName] = raw.map(resolve);
            } else if (typeof raw === 'object') {
                for (const key of Object.keys(raw)) raw[key] = resolve(raw[key]);
            }
        }
    }

    getAssociationDataItems(assocData, assoc) {
        if (!assocData) {
            return [];
        }
        if (assoc.cardinality === 1) {
            return [assocData];
        }
        if (Array.isArray(assocData)) {
            return assocData;
        }
        if (typeof assocData === 'object') {
            return Object.entries(assocData).map(([key, value]) => {
                if (value && typeof value === 'object') {
                    return value;
                }
                return { id: key, name: key, value };
            });
        }
        return [];
    }

    getDataFileName(data) {
        if (data && typeof data === 'object') {
            const attributes = data._attributes && typeof data._attributes === 'object'
                ? data._attributes
                : {};
            return String(data.id || data.name || attributes.id || attributes.name || "unknown").replace(/\s/g, '-');
        }
        return "unknown";
    }

    setCompositionStorageDirs(instance, itemDir) {
        const definition = instance.definition;
        if (!definition?.associations) return;

        for (let assocName in definition.associations) {
            const assoc = definition.associations[assocName];
            if (!assoc.owner || !assoc.composition) {
                continue;
            }
            const value = instance._associations?.[assocName];
            if (!value) continue;

            const children = assoc.cardinality === 1
                ? [value]
                : (Array.isArray(value) ? value : Object.values(value));
            for (const child of children) {
                if (!child?.definition) continue;
                const childId = this.getInstanceFileName(child);
                const childDir = path.join(itemDir, assocName, childId);
                this.setStorageDir(child, childDir);
                this.setCompositionStorageDirs(child, childDir);
            }
        }
    }

    getAttributeFile(instance, attrName) {
        const fieldName = '_' + attrName + '_file';
        if (!instance) return undefined;
        if (Object.prototype.hasOwnProperty.call(instance, fieldName)) {
            return instance[fieldName];
        }
        if (instance._attributes && Object.prototype.hasOwnProperty.call(instance._attributes, fieldName)) {
            return instance._attributes[fieldName];
        }
        return instance[fieldName];
    }

    getStorageDir(instance) {
        if (!instance) return undefined;
        if (Object.prototype.hasOwnProperty.call(instance, '_storageDir')) {
            return instance._storageDir;
        }
        if (instance._attributes && Object.prototype.hasOwnProperty.call(instance._attributes, '_storageDir')) {
            return instance._attributes._storageDir;
        }
        return undefined;
    }

    setStorageDir(instance, storageDir) {
        if (instance._attributes) {
            instance._attributes._storageDir = storageDir;
        } else {
            instance._storageDir = storageDir;
        }
    }

    setAttributeFile(instance, attrName, fileName) {
        const fieldName = '_' + attrName + '_file';
        if (instance._attributes) {
            instance._attributes[fieldName] = fileName;
        } else {
            instance[fieldName] = fileName;
        }
    }

    getInstanceDir(instance) {
        const definition = instance.definition;
        const modelName = definition.name;
        const subDir = this.getSubDir(modelName);
        const id = (instance.id || instance.name).replace(/\s/g, '-');
        return this.getStorageDir(instance) || path.resolve(this.clonePath, subDir, id);
    }

    async loadAttribute(instance, attrName) {
        const definition = instance.definition;
        const attr = definition.attributes[attrName];
        const fileName = this.getAttributeFile(instance, attrName) || attr.file;
        if (!fileName) return null;

        const itemDir = this.getInstanceDir(instance);
        const encoding = attr.encoding || 'utf-8';

        for (const provider of this.providers) {
            if (provider.isHandled(fileName)) {
                return await provider.load(itemDir, fileName, encoding);
            }
        }

        // Fallback to github provider if none handled it and it's a simple filename
        return await this.githubProvider.load(itemDir, fileName, encoding);
    }

    async loadAttributeBuffer(instance, attrName) {
        const definition = instance.definition;
        const attr = definition.attributes[attrName];
        const fileName = this.getAttributeFile(instance, attrName) || attr.file;
        if (!fileName) return null;

        const itemDir = this.getInstanceDir(instance);

        for (const provider of this.providers) {
            if (provider.isHandled(fileName)) {
                const content = await provider.load(itemDir, fileName, 'base64');
                return content ? Buffer.from(content, 'base64') : null;
            }
        }

        const content = await this.githubProvider.load(itemDir, fileName, 'base64');
        return content ? Buffer.from(content, 'base64') : null;
    }

    getAttributeContentType(instance, attrName) {
        const fileName = this.getAttributeFile(instance, attrName) || instance.definition.attributes[attrName]?.file || '';
        const ext = path.extname(fileName).toLowerCase();
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            '.ogg': 'audio/ogg',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.webm': 'video/webm',
            '.m4v': 'video/x-m4v',
            '.avi': 'video/x-msvideo',
        };
        return contentTypes[ext] || 'application/octet-stream';
    }

    getAttributeEncoding(attr, fileName, content) {
        if (attr.encoding) {
            return attr.encoding;
        }
        if (this.isBinaryFile(fileName) && this.looksBase64(content)) {
            return 'base64';
        }
        return 'utf-8';
    }

    isBinaryFile(fileName) {
        const ext = path.extname(fileName || '').toLowerCase();
        return BINARY_FILE_EXTENSIONS.has(ext);
    }

    looksBase64(content) {
        if (typeof content !== 'string') {
            return false;
        }
        const value = content.trim();
        return value.length > 16 && value.length % 4 === 0 && /^[A-Za-z0-9+/=\s]+$/.test(value);
    }

    getInstanceFileName(instance) {
        return String(instance.id || instance.name || "unknown").replace(/\s/g, '-');
    }

    serialize(instance) {
        const definition = instance.definition;
        if (!definition) return instance; // Fallback for plain objects

        const data = {
            id: this.getInstanceFileName(instance),
            _state: instance._state || 'Init'
        };
        // 1. Attributes
        for (let attrName in definition.attributes) {
            const attr = definition.attributes[attrName];
            if (attr.type === 'file' || attr.type === 'blob') {
                const fileName = this.getAttributeFile(instance, attrName) || attr.file;
                if (!fileName && !this.hasAttributeValue(instance, attrName)) {
                    continue;
                }
                data[attrName] = attr.type === 'file' && !attr.storage ? this.stripStoragePrefix(fileName) : fileName;
            } else {
                data[attrName] = instance[attrName];
            }
        }

        // 2. Associations
        for (let assocName in definition.associations) {
            const assoc = definition.associations[assocName];
            if (!assoc.owner && assoc.via) {
                data[assocName] = {
                    query: `?${assoc.via}=${instance.id || instance.name}`,
                    type: assoc.type,
                    service: assoc.service
                };
                continue;
            }
            const value = instance[assocName];
            if (!value) continue;

            if (assoc.type === 'ARemoteReference') {
                const items = assoc.cardinality === 1 ? [value] : (Array.isArray(value) ? value : Object.values(value));
                const references = items.map(item => serializeRemoteReference(item, assoc.service)).filter(Boolean);
                data[assocName] = assoc.cardinality === 1 ? references[0] : references;
                continue;
            }

            if (assoc.owner && assoc.composition) {
                if (assoc.cardinality === 1) {
                    data[assocName] = this.serialize(value);
                } else {
                    const items = Array.isArray(value) ? value : Object.values(value);
                    data[assocName] = items.map(item => this.serialize(item));
                }
            } else if (!assoc.owner) {
                // Reference or query
                if (assoc.cardinality === 1) {
                    data[assocName] = associationReferenceId(value);
                } else {
                    if (assoc.via) {
                        // Query based representation
                        data[assocName] = {
                            query: `?${assoc.via}=${instance.id || instance.name}`,
                            type: assoc.type,
                            service: assoc.service
                        };
                    } else {
                        // Source of Truth for Many-to-Many - store IDs
                        const items = Array.isArray(value) ? value : Object.values(value);
                        data[assocName] = items.map(item => item.id || item.name || item);
                    }
                }
            }
        }
        return data;
    }

    async save(instance, subDir) {
        const definition = instance.definition;
        const modelName = definition.name;
        const storedDir = this.getStorageDir(instance) || instance?._persist?.directory || null;
        let itemDir = null;

        if (storedDir) {
            itemDir = path.isAbsolute(storedDir)
                ? storedDir
                : path.resolve(this.clonePath, storedDir);
        } else {
            if (!this.modelPaths[modelName]) {
                this.registerModel(modelName, subDir || this.getSubDir(modelName));
            }
            const dir = subDir || this.modelPaths[modelName] || this.getSubDir(modelName);
            const id = this.getInstanceFileName(instance);
            itemDir = path.resolve(this.clonePath, dir, id);
        }

        await this.saveInstanceToDir(instance, itemDir);

        // The local checkout is updated immediately; Git operations are
        // batched to reduce commit/push frequency.
        this.queuePush(`Update ${modelName}: ${instance.name}`);
    }

    queuePush(message) {
        if (!this.repo) return;
        this.pushQueue.push(message);
        if (this.pushQueue.length >= this.pushQueueLimit) {
            void this.flushPushQueue();
        }
    }

    async flushPushQueue() {
        if (!this.repo || this.pushInProgress || this.pushQueue.length === 0) return;
        this.pushInProgress = true;
        const queuedMessages = this.pushQueue.splice(0);
        try {
            this.push(`Batch update (${queuedMessages.length} saves): ${queuedMessages[queuedMessages.length - 1]}`);
        } catch (error) {
            // Do not lose save intent if GitHub is temporarily unavailable.
            this.pushQueue.unshift(...queuedMessages);
            console.error('GitHub save queue retained after push failure:', error.message);
        } finally {
            this.pushInProgress = false;
        }
    }

    async saveInstanceToDir(instance, itemDir) {
        const definition = instance.definition;
        if (!fs.existsSync(itemDir)) {
            fs.mkdirSync(itemDir, { recursive: true });
        }
        this.setStorageDir(instance, itemDir);

        const data = await this.serializeForSave(instance, itemDir);

        // Write index.js
        const indexPath = path.join(itemDir, 'index.js');
        fs.writeFileSync(indexPath, `module.exports = ${JSON.stringify(data, null, 2)}`);
        return data;
    }

    async serializeForSave(instance, itemDir, options = {}) {
        const definition = instance.definition;
        if (!definition) return instance;

        const customStorage = options.skipStorageHook ? null : await this.callStorageHook(instance, itemDir);
        if (customStorage !== null && customStorage !== undefined) {
            if (customStorage && typeof customStorage === 'object' && !Array.isArray(customStorage)) {
                customStorage.id = customStorage.id || this.getInstanceFileName(instance);
            }
            return customStorage;
        }

        const data = {
            id: this.getInstanceFileName(instance)
        };

        // 1. Attributes
        for (let attrName in definition.attributes) {
            const attr = definition.attributes[attrName];
            if (attr.type === 'file' || attr.type === 'blob') {
                const fileName = this.getAttributeFile(instance, attrName) || attr.file;
                if (!fileName && !this.hasAttributeValue(instance, attrName)) {
                    continue;
                }
                data[attrName] = attr.type === 'file' && !attr.storage ? this.stripStoragePrefix(fileName) : fileName;
            } else {
                data[attrName] = instance[attrName];
            }
        }

        // Handle attributes that should be stored via providers
        for (let attrName in definition.attributes) {
            const attr = definition.attributes[attrName];
            if (attr.type !== 'file' && attr.type !== 'blob' && !attr.storage) {
                continue;
            }

            if (!instance._attributes || !Object.prototype.hasOwnProperty.call(instance._attributes, attrName)) {
                continue;
            }

            let content = instance._attributes[attrName];
            if (content && typeof content.then === 'function') {
                content = await content;
            }
            if (content === undefined || content === null) continue;

            let fileName = this.getAttributeFile(instance, attrName) || attr.file || `${attrName}.dat`;
            if (attr.type === 'file' && !attr.storage) {
                fileName = this.stripStoragePrefix(fileName);
            }
            const provider = this.getProvider(attr, content, fileName, instance);

            // If it's a file/blob OR it has an explicit storage provider that isn't github,
            // or if it's already an external reference, we use the provider.
            if (attr.type === 'file' || attr.type === 'blob' || (attr.storage && provider !== this.githubProvider)) {
                const encoding = this.getAttributeEncoding(attr, fileName, content);
                const storageRef = await provider.save(itemDir, fileName, content, encoding);

                // Update the fileName in data to be the storage reference
                data[attrName] = storageRef;
                this.setAttributeFile(instance, attrName, storageRef);
            }
        }

        // 2. Associations
        for (let assocName in definition.associations) {
            const assoc = definition.associations[assocName];
            if (!assoc.owner && assoc.via) {
                data[assocName] = {
                    query: `?${assoc.via}=${instance.id || instance.name}`,
                    type: assoc.type,
                    service: assoc.service
                };
                continue;
            }
            const value = instance[assocName];
            if (!value) continue;

            if (assoc.owner && assoc.composition) {
                const assocDir = path.join(itemDir, assocName);
                const items = assoc.cardinality === 1
                    ? [value]
                    : (Array.isArray(value) ? value : Object.values(value));
                const serializedItems = [];
                for (let item of items) {
                    if (!item?.definition) {
                        serializedItems.push(item);
                        continue;
                    }
                    const childId = this.getInstanceFileName(item);
                    const childDir = path.join(assocDir, childId);
                    this.setStorageDir(item, childDir);
                    serializedItems.push(await this.serializeForSave(item, childDir));
                }
                data[assocName] = assoc.cardinality === 1 ? serializedItems[0] : serializedItems;
            } else if (assoc.owner && !assoc.composition) {
                const assocDir = path.join(itemDir, assocName);
                if (!fs.existsSync(assocDir)) fs.mkdirSync(assocDir, { recursive: true });

                const items = assoc.cardinality === 1
                    ? [value]
                    : (Array.isArray(value) ? value : Object.values(value));
                for (let item of items) {
                    const childId = this.getInstanceFileName(item);
                    const childDir = path.join(assocDir, childId);
                    this.setStorageDir(item, childDir);
                    this.moveOwnedChildFiles(item, itemDir, childDir);
                    await this.saveInstanceToDir(item, childDir);
                }
                // Remove from data as it is stored in subdirectory
                delete data[assocName];
            } else if (!assoc.owner) {
                if (assoc.cardinality === 1) {
                    data[assocName] = associationReferenceId(value);
                } else {
                    if (assoc.via) {
                        data[assocName] = {
                            query: `?${assoc.via}=${instance.id || instance.name}`,
                            type: assoc.type,
                            service: assoc.service
                        };
                    } else {
                        const items = Array.isArray(value) ? value : Object.values(value);
                        data[assocName] = items.map(item => item.id || item.name || item);
                    }
                }
            }
        }
        return data;
    }

    moveOwnedChildFiles(instance, parentDir, childDir) {
        const definition = instance?.definition;
        if (!definition?.attributes) {
            return;
        }

        for (const attrName in definition.attributes) {
            const attr = definition.attributes[attrName];
            if (attr.type !== 'file' && attr.type !== 'blob') {
                continue;
            }

            const fileName = this.getAttributeFile(instance, attrName) || attr.file;
            if (!fileName || typeof fileName !== 'string' || fileName.includes('://')) {
                continue;
            }

            const sourcePath = path.resolve(parentDir, fileName);
            const destinationPath = path.resolve(childDir, fileName);
            if (sourcePath === destinationPath || !fs.existsSync(sourcePath)) {
                continue;
            }

            if (!destinationPath.startsWith(path.resolve(childDir) + path.sep)) {
                continue;
            }

            const destinationDir = path.dirname(destinationPath);
            if (!fs.existsSync(destinationDir)) {
                fs.mkdirSync(destinationDir, { recursive: true });
            }

            if (!fs.existsSync(destinationPath)) {
                fs.renameSync(sourcePath, destinationPath);
            }
        }
    }

    hasAttributeValue(instance, attrName) {
        if (!instance) {
            return false;
        }
        if (instance._attributes && Object.prototype.hasOwnProperty.call(instance._attributes, attrName)) {
            return instance._attributes[attrName] !== undefined && instance._attributes[attrName] !== null && instance._attributes[attrName] !== '';
        }
        if (Object.prototype.hasOwnProperty.call(instance, attrName)) {
            return instance[attrName] !== undefined && instance[attrName] !== null && instance[attrName] !== '';
        }
        return false;
    }

    async callStorageHook(instance, itemDir) {
        const hook = instance.toStorage || instance.toJSONStorage;
        if (typeof hook !== 'function') {
            return null;
        }

        const result = await hook.call(instance, {
            storage: this,
            itemDir: itemDir,
            defaultSerialize: async () => this.defaultSerializeForSave(instance, itemDir)
        });

        if (!result) {
            return null;
        }
        return result;
    }

    async defaultSerializeForSave(instance, itemDir) {
        return await this.serializeForSave(instance, itemDir, { skipStorageHook: true });
    }

    getFile(instance, fileName) {
        const modelName = instance.definition.name;
        const subDir = this.getSubDir(modelName);
        const id = (instance.id || instance.name).replace(/\s/g, '-');
        const filePath = path.resolve(this.clonePath, subDir, id, fileName);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'base64');
        }
        return null;
    }

    saveFile(instance, fileName, content) {
        const modelName = instance.definition.name;
        const subDir = this.getSubDir(modelName);
        const id = (instance.id || instance.name).replace(/\s/g, '-');
        const itemDir = path.resolve(this.clonePath, subDir, id);
        if (!fs.existsSync(itemDir)) {
            fs.mkdirSync(itemDir, { recursive: true });
        }
        const filePath = path.resolve(itemDir, fileName);
        fs.writeFileSync(filePath, content);
    }

    push(message) {
        if (!this.repo) {
            return;
        }
        try {
            execFileSync('git', ['-C', this.clonePath, 'add', '.'], { stdio: ['ignore', 'ignore', 'inherit'] });
            execFileSync('git', ['-C', this.clonePath, 'commit', '-m', message], { stdio: ['ignore', 'ignore', 'inherit'] });
            execFileSync('git', ['-C', this.clonePath, 'push', 'origin', 'main'], { stdio: ['ignore', 'ignore', 'inherit'] });
        } catch (error) {
            console.error(`Failed to push changes to git:`, error.message);
            throw error;
        }
    }
}

function serializeRemoteReference(item, associationService) {
    if (!item) return null;
    const attrs = item._attributes && typeof item._attributes === 'object' ? item._attributes : item;
    const rid = attrs.rid || item.rid || attrs.id || item.id || attrs.name || item.name;
    if (!rid) return null;
    return {
        service: attrs.service || item.service || associationService,
        type: attrs.type || item.type,
        rid: String(rid),
        displayName: attrs.displayName || item.displayName,
        snapshot: attrs.snapshot || item.snapshot,
        snapShotDate: attrs.snapShotDate || item.snapShotDate
    };
}

// Persist non-owned cardinality-one associations by identity, including
// proxied objects whose identity is exposed through _attributes.
function associationReferenceId(value) {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'object') return value;
    const attrs = value._attributes && typeof value._attributes === 'object'
        ? value._attributes
        : value;
    return attrs.id || value.id || attrs.rid || value.rid || attrs.name || value.name || null;
}

function getEffectiveDefinition(definition) {
    const chain = [];
    let current = definition;
    while (current) {
        chain.unshift(current);
        if (!current.extends) break;
        const parent = AClass.getClass(current.extends);
        current = parent?.definition || null;
    }
    return {
        ...definition,
        attributes: Object.assign({}, ...chain.map((entry) => entry.attributes || {})),
        associations: Object.assign({}, ...chain.map((entry) => entry.associations || {}))
    };
}

function ensureObjectProxy(value) {
    if (!value || typeof value !== 'object') return value;
    if (value._proxy && typeof value._proxy === 'object') {
        return value._proxy;
    }
    try {
        if (typeof value.isProxy === 'function' && value.isProxy()) return value;
    } catch (e) {
        // Apply the persistence proxy below.
    }
    return new Proxy(value, objectProxy);
}

function attachBackLinks(parent) {
    const parentName = parent?.definition?.name;
    if (!parentName) return;
    for (const assocName of Object.keys(parent.definition.associations || {})) {
        const assoc = parent.definition.associations[assocName];
        if (!assoc.owner) continue;
        const value = parent._associations?.[assocName];
        const children = assoc.cardinality === 1 ? [value] : (Array.isArray(value) ? value : Object.values(value || {}));
        for (const child of children) {
            if (!child?.definition) continue;
            for (const [backName, backDef] of Object.entries(child.definition.associations || {})) {
                if (backDef.type === parentName && backDef.cardinality === 1 && !backDef.service) {
                    if (!child._associations) child._associations = {};
                    child._associations[backName] = parent;
                }
            }
        }
    }
}

module.exports = GitHubStorage;
