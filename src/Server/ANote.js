const AIHelper = require("./AIHelper.js");
const path = require( 'path');
const fs = require('fs');
const AActor = require("./AActor.js");
const AClass = require("./AClass.js");
const AScenario = require( "./AScenario.js");
const AUseCase = require( "./AUseCase.js");
const AWorkflow = require("./AWorkflow.js");
const AActionItem = require("./AActionItem.js");
const {pathToFileURL} = require('url');
const AEvent = require("./AEvent.js");

class ANote {
    static _instances = [];

    constructor(params) {
        this.id = params.id || ANote._instances.length;
        this.text = params.text || "";
        this.createdDate = params.createdDate || String(new Date());
        this.name = params.name || this.createdDate;
        this.summary = params.summary || "";
        this.items = [];
        for (let i in params.items) {
            this.items.push(params.items[i]);
        }
        ANote._instances.push(this);
        return this;
    }

    static loadDirectory(mdir) {
        fs.mkdirSync(mdir, {recursive: true});
        let notes = fs.readdirSync(mdir);
        for (let i in notes) {
            ANote.load(path.resolve(`${mdir}/${notes[i]}`));
        }
    }

    static async load(mfile) {
        let json = fs.readFileSync(mfile, 'utf-8');
        let loadedItem = JSON.parse(json);
        let note = new ANote(loadedItem);
        return note;
    }

    static list() {
        return ANote._instances;
    }

    static get(id) {
        for (let i in ANote._instances) {
            let note = ANote._instances[i];
            if (note.id == id) {
                return note;
            }
        }
        return null;
    }

    async save() {
        let retString = JSON.stringify(this);
        let dname = path.resolve('.notes');
        fs.mkdirSync(dname, {recursive: true});
        let fname = path.resolve(`${dname}/Note-${this.id}.json`);
        fs.writeFileSync(fname, retString);
        await this.#normalizeText();
        let retString2 = JSON.stringify(this);
        fs.writeFileSync(fname, retString2);
    }

    addItem(type, json) {
        let newItem = {
            id: this.items.length,
            type: type,
            state: "Suggested",
            json: json
        };
        AEvent.emit(`noteItem.created`, {message: `Created ${type}`, note: this.id, item: newItem});
        this.items.push(newItem);
        this.save();
    }

    items() {
        return this.items;
    }

    async acceptItem(id) {
        for (let i in this.items) {
            let item = this.items[i];
            if (id == item.id) {
                item.state = "Accepted";
                this.save();
                AEvent.emit("noteItem.accepted", {note: this.id, item: item.id});
                this.generateItem(item);
            }
        }
    }

    rejectItem(id) {
        for (let i in this.items) {
            let item = this.items[i];
            if (id == item.id) {
                item.state = "Rejected";
                this.save();
                AEvent.emit("noteItem.rejected", {note: this.id, item: item.id});
            }
        }
    }

    async generateItem(item) {
        try {
            // This is a factory pattern that will generate the appropriate artifact based on the type of the item.
            switch (item.type) {
                case 'AActor':
                    let actor = AActor.create(item.json);
                    item.objectID = actor.name;
                    break;
                case 'AScenario':
                    let scenario = AScenario.create(item.json.usecase, item.json);
                    item.objectID = scenario.name;
                    break;
                case 'AUseCase':
                    let usecase = AUseCase.create(item.json);
                    item.objectID = usecase.name;
                    break;
                case 'AWorkflow':
                    let workflow = AWorkflow.create(item.json);
                    item.objectID = workflow.name;
                    break;
                case 'AClass':
                    let model = AClass.create(item.json);
                    if (!model) {
                        console.error("Model note created for:", item.json);
                    }
                    item.objectID = model.name;
                    break;
                case 'AActionItem':
                    let action = new AActionItem(item.json);
                    if (!action) {
                        console.error("Action Item error: ", item.json);
                    }
                    item.objectID = action.name;
                    let retval = await action.save();
                    console.log(retval);
                    break;
            }
            item.state = "Generated";
            this.save();
            AEvent.emit("noteItem.generated", {note: this.id, item: item.id});
        } catch (e) {
            console.error(e);
        }
    }

    async #normalizeText() {
        // Define common Markdown patterns
        const markdownPatterns = [
            /^#{1,6}\s.+/,         // Headers
            /\*\*[^*]+\*\*/,       // Bold
            /\*[^*]+\*/,           // Italic
            /\_[^_]+\_/,           // Italic
            /\!\[.+\]\(.+\)/,      // Images
            /\[.+\]\(.+\)/,        // Links
            /^\>\s.+$/m,           // Blockquotes
            /^\- .+$/m,            // Unordered lists
            /^\d+\.\s.+$/m,        // Ordered lists
            /\`\`\`[\s\S]*?\`\`\`/,// Code blocks
            /\`[^`]+\`/,           // Inline code
        ];

        // Check for any Markdown pattern in the text
        if (!markdownPatterns.some(pattern => pattern.test(this.text))) {
            AEvent.emit("note.normalize.started", {note: this.id});
            let results = await AIHelper.ask([{
                role: 'system',
                content: 'Create a md table with the following columns | Time | Speaker | Text |. The time should be in mm:ss format.'
            },
                {role: 'user', content: this.text}
            ]);
            this.text = "## Transcript\n\n" + results;
            AEvent.emit("note.normalize.completed", {note: this.id});
        }
    }
}
module.exports = ANote;