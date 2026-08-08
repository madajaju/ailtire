const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const { GitHubStorageProvider, ExternalStorageProvider, AzureBlobStorageProvider, S3StorageProvider, MultiStorageProvider } = require('./StorageProviders');

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
        this.providers = [];
        this.providerMap = {};
        this.blobStorageConfig = this.normalizeBlobStorageConfig(config.blobStorage || config.blobStorageConfig || config.blobs || {});

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
        if (this.modelClasses[typeName]) return this.modelClasses[typeName];
        if (global[typeName]) return global[typeName];
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
        const largeExtensions = ['.mp4', '.mov', '.avi', '.mp3', '.wav'];
        if (largeExtensions.includes(ext)) {
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
                console.log(`Cloning ${this.repo} to ${this.clonePath}`);
                execSync(`git clone https://github.com/${this.repo}.git "${this.clonePath}"`, { stdio: 'inherit' });
            } catch (error) {
                console.error(`Failed to clone repository ${this.repo}:`, error.message);
                throw error;
            }
        } else {
            try {
                console.log(`Pulling ${this.repo} in ${this.clonePath}`);
                execSync(`git -C "${this.clonePath}" pull origin main`, { stdio: 'inherit' });
            } catch (error) {
                console.error(`Failed to pull repository ${this.repo}:`, error.message);
            }
        }
    }

    async loadAll(modelClass, subDir) {
        if (!modelClass) {
            const results = {};
            const registered = Object.keys(this.modelPaths);
            if (registered.length > 0) {
                for (const modelName of registered) {
                    const cls = this.getModelClass(modelName);
                    if (cls) {
                        results[modelName] = await this.loadAll(cls, this.modelPaths[modelName]);
                    }
                }
                return results;
            }

            if (global.classes) {
                for (const modelName of Object.keys(global.classes)) {
                    const cls = this.getModelClass(modelName);
                    if (cls) {
                        results[modelName] = await this.loadAll(cls, this.getSubDir(modelName));
                    }
                }
            }
            return results;
        }

        const resolvedClass = this.resolveModelClass(modelClass);
        const modelName = this.resolveModelName(resolvedClass);
        if (!modelName || !resolvedClass) {
            return [];
        }
        const dir = subDir || this.modelPaths[modelName] || this.getSubDir(modelName);
        const fullPath = path.resolve(this.clonePath, dir);

        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
            console.error(`${modelName} directory does not exist:`, fullPath);
            return [];
        }

        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        let results = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const itemDir = path.join(fullPath, entry.name);
                const item = await this.loadItem(modelClass, itemDir);
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

        return await this.loadItem(targetClass, itemDir);
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
        const largeExtensions = ['.mp4', '.mov', '.avi', '.mp3', '.wav'];
        if (largeExtensions.includes(ext)) {
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

    async loadInstanceFromData(modelClass, data, itemDir) {
        const definition = modelClass.definition;
        const instanceData = {};
        const fileId = path.basename(itemDir || '').replace(/\s/g, '-');

        // 1. Load attributes
        for (let attrName in definition.attributes) {
            const attr = definition.attributes[attrName];
            const valueInIndex = data[attrName];

            // If it's a file/blob OR if the value in index looks like a storage URI,
            // treat it as an external file reference.
            const isExternal = attr.type === 'file' || attr.type === 'blob' ||
                             (typeof valueInIndex === 'string' && valueInIndex.includes('://'));

            if (isExternal) {
                if (valueInIndex) {
                    instanceData['_' + attrName + '_file'] = valueInIndex;
                    // Content is NOT loaded here - will be loaded on demand via loadAttribute
                }
            } else {
                if (data[attrName] !== undefined && data[attrName] !== null) {
                    instanceData[attrName] = data[attrName];
                }
                // Fallback for bio.md if type is string
                if (attrName === 'bio' && typeof data[attrName] === 'string' && data[attrName].endsWith('.md')) {
                    const bioPath = path.join(itemDir, data[attrName]);
                    if (fs.existsSync(bioPath)) {
                        instanceData[attrName] = fs.readFileSync(bioPath, 'utf-8');
                        instanceData['_' + attrName + '_file'] = data[attrName];
                    }
                }
            }
        }

        if (instanceData.id === undefined || instanceData.id === null || instanceData.id === '') {
            instanceData.id = data.id || fileId;
        }

        // 2. Load associations
        for (let assocName in definition.associations) {
            const assoc = definition.associations[assocName];
            const childClass = this.getModelClass(assoc.type);
            if (assoc.owner && assoc.composition) {
                // Loaded from JSON
                if(!data[assocName]) {
                    continue;
                }
                const childrenData = data[assocName];
                if (childrenData) {
                    if (assoc.cardinality === 1) {
                        const childId = childClass ? this.getDataFileName(childrenData) : 'item';
                        const childDir = path.join(itemDir, assocName, childId);
                        instanceData[assocName] = childClass ? await this.loadInstanceFromData(childClass, childrenData, childDir) : childrenData;
                    } else {
                        // Support both array and map (backward compatibility)
                        const dataArray = Array.isArray(childrenData) ? childrenData : Object.entries(childrenData).map(([key, val]) => {
                            if (typeof val === 'string' && assoc.type === 'SocialHandle') {
                                return { stype: key, name: val };
                            }
                            return val;
                        });
                        instanceData[assocName] = [];
                        for (const childData of dataArray) {
                            if (!childClass) {
                                instanceData[assocName].push(childData);
                                continue;
                            }
                            const childId = this.getDataFileName(childData);
                            const childDir = path.join(itemDir, assocName, childId);
                            instanceData[assocName].push(await this.loadInstanceFromData(childClass, childData, childDir));
                        }
                    }
                }
            } else if (assoc.owner && !assoc.composition) {
                // Loaded from subdirectory
                const assocDir = path.join(itemDir, assocName);
                let children = [];
                if (fs.existsSync(assocDir)) {
                    const entries = fs.readdirSync(assocDir, { withFileTypes: true });
                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            const childDir = path.join(assocDir, entry.name);
                            const child = childClass ? await this.loadItem(childClass, childDir) : null;
                            if (child) children.push(child);
                        }
                    }
                }

                if (children.length === 0 && data[assocName]) {
                    const legacyChildren = this.getAssociationDataItems(data[assocName], assoc);
                    for (const childData of legacyChildren) {
                        if (!childClass) {
                            children.push(childData);
                            continue;
                        }
                        const childId = this.getDataFileName(childData);
                        const childDir = path.join(assocDir, childId);
                        children.push(await this.loadInstanceFromData(childClass, childData, childDir));
                    }
                }

                if (children.length > 0) {
                    if (assoc.cardinality === 1) {
                        instanceData[assocName] = children[0];
                    } else {
                        instanceData[assocName] = children;
                    }
                }
            } else if (!assoc.owner) {
                // Non-owned relationships are references/queries. Do not hydrate them into
                // _associations; ObjectProxy resolves service/via associations lazily.
                continue;
            }
        }

        const fileAttributes = {};
        for (let attrName in definition.attributes) {
            const fieldName = '_' + attrName + '_file';
            if (Object.prototype.hasOwnProperty.call(instanceData, fieldName)) {
                fileAttributes[attrName] = instanceData[fieldName];
                delete instanceData[fieldName];
            }
        }

        const modelCtor = modelClass?.prototype?.constructor || modelClass;
        const instance = new modelCtor(instanceData);
        if (!instance.definition) {
            instance.definition = modelCtor.definition || modelClass.definition;
        }
        if (data && Object.prototype.hasOwnProperty.call(data, '_state')) {
            instance._state = data._state;
        } else if (instance._state === undefined || instance._state === null || instance._state === '') {
            instance._state = 'Init';
        }
        instance._attributes = instanceData;
        for (let key in instanceData) {
            if (instanceData[key] !== undefined && instanceData[key] !== null) {
                try {
                    instance[key] = instanceData[key];
                } catch (e) {
                    // Ignore proxy set errors for missing attributes
                }
            }
        }
        this.setStorageDir(instance, itemDir);
        for (let attrName in fileAttributes) {
            this.setAttributeFile(instance, attrName, fileAttributes[attrName]);
        }
        this.setCompositionStorageDirs(instance, itemDir);

        const modelName = instance.definition?.name || modelCtor.name || modelClass.name;
        if(!global._instances.hasOwnProperty(modelName)) {
            global._instances[modelName] = {};
        }
        global._instances[modelName][instance.id] = instance;
        return instance;
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
            return String(data.id || data.name || "unknown").replace(/\s/g, '-');
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
        return new Set([
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
            '.mp4', '.mov', '.webm', '.m4v', '.avi',
            '.mp3', '.wav', '.m4a'
        ]).has(ext);
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
                    data[assocName] = value.id || value.name || value;
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
        
        // Git push
        this.push(`Update ${modelName}: ${instance.name}`);
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
                    data[assocName] = value.id || value.name || value;
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
            execSync(`git -C "${this.clonePath}" add .`, { stdio: 'inherit' });
            execSync(`git -C "${this.clonePath}" commit -m "${message}"`, { stdio: 'inherit' });
            execSync(`git -C "${this.clonePath}" push origin main`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Failed to push changes to git:`, error.message);
        }
    }
}

module.exports = GitHubStorage;
