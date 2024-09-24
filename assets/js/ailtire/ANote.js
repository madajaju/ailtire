import {AActor, AModel, APackage, AScenario, ASelectedHUD, AText, AUsecase} from './index.js';
import AWorkFlow from './AWorkFlow.js';

const scolors = {
    generated: '#aaffaa',
    Generated: '#aaffaa',
    rejected: '#ff8888',
    Rejected: '#ff8888',
    accepted: '#00aaff',
    Accepted: '#00aaff',
    Suggested: '#aaaaaa',
    suggested: '#aaaaaa',
}
const ncolors = {
    generated: '#00cc00',
    Generated: '#00cc00',
    rejected: '#cc0000',
    Rejected: '#cc0000',
    accepted: '#0000cc',
    Accepted: '#0000cc',
    Suggested: '#aaaaaa',
    suggested: '#aaaaaa',
}
const viewFunctions = {
    AActor: AActor.view3D,
    AScenario: AScenario.view3D,
    AClass: AModel.view3D,
    APackage: APackage.view3D,
    AWorkflow: AWorkFlow.view3D,
    AUseCase: AUsecase.view3D,
}
export default class ANote {
    constructor(config) {
        this.config = config;
    }

    static default = {
        fontSize: 20,
        height: 100,
        width: 50,
        depth: 10,
    }


    static showList(panel, parent) {
        $.ajax({
            url: 'note/list',
            success: function (results) {
                let nodes = [];
                for (let aname in results) {
                    let note = results[aname];
                    let noteItem = {
                        id: `Note-${note.id}`,
                        text: new Date(note.createdDate).toDateString(),
                        img: 'ailtire-note',
                        link: `note/get?id=${note.id}`,
                        link2d: `note/get?id=${note.id}`,
                        nodes: [],
                        view: 'note'
                    };
                    noteItem.count = note.items.length;
                    nodes.push(noteItem);
                }
                w2ui[panel].add(parent, nodes);
            }
        });
    }

    static editDocs(results, setURL, tab) {
        let editForm = getEditForm(results, setURL, tab);
        w2popup.open({
            height: 850,
            width: 850,
            title: `Edit ${results.name}`,
            body: '<div id="editNoteDocDialog" style="width: 100%; height: 100%;"></div>',
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editNoteDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.NoteDialog.box).show();
                    w2ui.NoteDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    $('#editNoteDocDialog').w2render(editForm.name);
                    w2ui.NoteEditTabs.click('docs');
                }
            }
        })
    }

    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                ANote.showDetail(results);
            }
        });
    }

    static showDetail(result) {
        let records = [];
        if (!w2ui['objlist']) {
            $('#objlist').w2grid({name: 'objlist'});
        }
        w2ui['objlist'].result = result;
        if (!w2ui['objdetail']) {
            $('#objdetail').w2grid({
                name: 'objdetail',
                header: 'Details',
                show: {header: true, columnHeaders: false},
                columns: [
                    {
                        field: 'name',
                        label: 'Name',
                        size: '100px',
                        style: 'background-color: #efefef; border-bottom: 1px solid white; padding-right: 5px;',
                        attr: "align=right"
                    },
                    {
                        field: 'value', label: 'Value', size: '100%', render: function (record) {
                            return '<div>' + record.value + '</div>';
                        }
                    }
                ]
            });
        }
        w2ui['objlist'].onClick = function (event) {
            let record = this.get(event.recid);
            w2ui['objdetail'].header = `${record.name} Details`;
            w2ui['objdetail'].show.columnHeaders = true;
            w2ui['objdetail'].clear();
            let drecords = [];
            let k = 0;
            let values = record.detail.split('|');
            for (let i in values) {
                let [name, value] = values[i].split('^');
                if (!value) {
                    value = name;
                    name = record.name;
                }
                k++;
                drecords.push({recid: k, name: name, value: value});
            }
            w2ui['objdetail'].add(drecords);
            window.graph.selectNodeByID(event.recid);
        }
        let cols = [
            {field: 'name', size: "20%", resizeable: true, label: "Name", sortable: true},
            {field: 'value', size: "80%", resizeable: true, label: "Value", sortable: true},
        ];
        w2ui['objlist'].columns = cols;
        let i = 0;
        let createdDate = new Date(result.createdDate).toDateString();
        records.push({recid: i++, id: 'id', value: result.id, detail: result.id});
        records.push({recid: i++, name: 'date', value: createdDate, detail: createdDate});
        records.push({recid: i++, name: 'text', value: result.text.substring(0, 25), detail: result.text});
        let itemDetails = getDetails(result.items);
        if (result.items) {
            records.push({
                recid: i++,
                name: 'items',
                value: Object.keys(result.items).length,
                detail: itemDetails.join('|')
            });
        }
        w2ui['objlist'].records = records;
        ASelectedHUD.update("Note", records);
        w2ui['objlist'].refresh();
    }

    static handle2d(result, object, div) {
        _setGraphToolbar(object);
        div.innerHTML = result;
    }

    static calculateBox(node) {
        let nameArray = node.name.split(/\n/).map(item => {
            return item.length;
        });
        let maxLetters = nameArray.reduce(function (a, b) {
            return Math.max(a, b);
        }, -Infinity);
        let height = (nameArray.length * ANote.default.fontSize) / 2 + 10;
        let width = maxLetters * (ANote.default.fontSize / 2) + 20;
        let depth = ANote.default.depth;
        let radius = Math.max(Math.sqrt(width * width + height * height), Math.sqrt(height * height + depth * depth), Math.sqrt(width * width + depth * depth)) / 2;
        return {w: width, h: height * 2, d: depth, r: radius};
    }

    static view3D(node, type) {
        let opacity = node.opacity || 0.75;
        let color = node.color || "#aaaaaa";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let size = ANote.calculateBox(node);
        let height = size.h;
        let width = size.w;
        let depth = size.d;
        let geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            depthTest: true,
            depthWrite: true,
            alphaTest: 0,
            reflectivity: 0.2,
            thickness: 6,
            metalness: 0,
            side: THREE.DoubleSide
        });
        const box = new THREE.Mesh(geometry, material);
        let name = node.name;
        if (!name) {
            name = node.id;
        }
        let label = AText.view3D({
            text: name.replace(/\n/g, '\n'),
            color: "#ffffff",
            width: width,
            size: AScenario.default.fontSize
        });
        label.position.set(0, 0, size.d / 2 + 1);
        box.add(label)

        box.position.set(node.x, node.y, node.z);
        box.aid = node.id;
        node.box = size.r;
        node.expandLink = `note/get?id=${node.id}`;
        node.expandView = ANote.handle;
        node.getDetail = ANote.getDetail;
        return box;
    }

    static viewItem3D(node, type) {
        let opacity = node.opacity || 0.75;
        let color = ncolors[node.item.state];
        let size = ANote.calculateBox(node);
        let height = size.h;
        let width = size.w;
        let depth = size.d;
        let geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            depthTest: true,
            depthWrite: true,
            alphaTest: 0,
            reflectivity: 0.2,
            thickness: 6,
            metalness: 0,
            side: THREE.DoubleSide
        });
        const box = new THREE.Mesh(geometry, material);
        let name = node.name;
        if (!name) {
            name = node.id;
        }
        let label = AText.view3D({
            text: name,
            color: "#ffffff",
            width: width,
            size: AScenario.default.fontSize
        });
        label.position.set(0, 0, size.d / 2 + 1);
        box.add(label)

        box.position.set(node.x, node.y, node.z);
        box.aid = node.id;
        node.box = size.r;
        node.expandLink = `note/get?id=${node.id}`;
        node.expandView = ANote.handle;
        node.getDetail = ANote.getDetail;
        return box;
    }

    static viewDeep3D(note, mode, parent) {
        let data = {nodes: {}, links: []};
        let createdDate = new Date(note.createdDate);
        if (mode === "add" && parent) {
            data.nodes[note.id] = {
                id: note.id,
                name: `${createdDate.toDateString()}\n${createdDate.toTimeString()}`,
                view: ANote.view3D,
                expandView: ANote.handle,
                expandLink: `note/get?id=${note.id}`,
                rbox: {
                    parent: parent.id,
                    fz: -600,
                }
            };
            data.links.push({target: note.id, source: parent.id, width: 1, value: 40, color: "#aaffff"})
        } else {
            data.nodes[note.id] = {
                id: note.id,
                name: `${createdDate.toDateString()}\n${createdDate.toTimeString()}`,
                view: ANote.view3D,
                expandView: ANote.handle,
                expandLink: `note/get?id=${note.id}`,
                fx: 0,
                fy: 0,
                fz: 0,
            };
        }
        for (let i in note.items) {
            let item = note.items[i];
            let uid = `${note.id}-${i}`;
            let description = `[${item.state}]\n${item.json.description}`;
            data.nodes[uid] = {
                id: uid,
                name: `${item.type}\n${item.json.name}`,
                description: description,
                item: item,
                view: ANote.viewItem3D,
                expandView: ANote.handle,
                expandLink: `note/get?id=${note.id}`,
                box: 10
            };
            data.links.push({source: note.id, target: uid, value: 0.1});
            if (item.objectID) {
                data.nodes[item.objectID] = {
                    id: item.objectID,
                    name: item.json.name,
                    view: viewFunctions[item.type],
                }
                data.links.push({source: uid, target: item.objectID, value: 0.1});
            }
        }

        if (mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
            window.graph.graph.cameraPosition(
                {x: 200, y: 50, z: 1000}, // new position
                {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
                3000  // ms transition duration.
            );
        }
        window.graph.showLinks();
        return data.nodes[note.id];
    }

    static handle(result) {
        ANote.viewDeep3D(result, "new");
        ANote.showDetail(result);
    }

    static handleEvent(event, message) {
        if (event.includes('note')) {
            // update the item list.
            if (w2ui['NoteEditItems']) {
                let noteRecord = w2ui['NoteEditItems'].record;
                if (noteRecord.id == message.note) {
                    // Now find the item id and set the state to the event
                    if (event === 'noteitem.created') {
                        noteRecord.items.push(message.item);
                        w2ui.NoteEditItems.render();
                    } else {
                        let [myEvent, state] = event.split('.');
                        noteRecord.items[message.item].state = state;
                        w2ui.NoteEditItems.refresh();
                    }
                }
            }
        }
        if (event.includes('generate')) {
            w2ui.NoteEditItems.header = message.message;
            w2ui.NoteEditItems.refresh();
        }
        if (event.includes('generate.completed')) {
            w2ui.NoteEditItems.header = "Finished Generating"
            w2ui.NoteEditItems.refresh();
        }
    }
}

function getDetails(objs) {
    let items = [];
    let inum = 0;
    for (let j in objs) {
        let item = objs[j];
        inum++;
        let name = item.name || j;
        items.push(`<span onclick="expandObject('${item.link}');">${name}</span>^${item.type}: ${item.json.name}`);
    }
    return items;
}

function getEditForm(record, setURL, tab) {
    if (!w2ui['NoteEditGeneral']) {
        $().w2layout({
            name: 'NoteEditGeneral',
            panels: [
                {type: 'left', size: 150, resizable: true, minSize: 35},
                {type: 'main', resizable: true, minSize: 50, size: 300},
                {type: 'bottom', resizable: true, size: 0},
            ],
            onRender: (event) => {
            }
        });
    }
    if (!w2ui['NoteEditTabs']) {
        let myConfig = {
            name: 'NoteEditTabs',
            flatButton: true,
            nodes: [
                {id: 'docs', text: 'Notes', selected: true},
                {id: 'items', text: 'Items', selected: false},
            ],
            onClick(event) {
                switch (event.target) {
                    case 'docs':
                        w2ui['NoteEditGeneral'].set('main', {size: 500});
                        w2ui['NoteEditGeneral'].html('main', w2ui.NoteEditDoc);
                        w2ui['NoteEditGeneral'].set('bottom', {size: 0});
                        w2ui['NoteEditGeneral'].html('bottom', "<p></p>");
                        break;
                    case 'items':
                        w2ui['NoteEditGeneral'].set('main', {size: 500});
                        w2ui['NoteEditGeneral'].html('main', w2ui.NoteEditItems);
                        w2ui['NoteEditGeneral'].set('bottom', {size: 0});
                        w2ui['NoteEditGeneral'].html('bottom', "<p></p>");
                        break;
                }
            }
        };
        if (tab) {
            for (let i in myConfig.nodes) {
                myConfig.nodes[i].selected = myConfig.nodes[i].text === tab;
            }
        }
        $().w2sidebar(myConfig);
    }
    _createNoteEditDoc(record, setURL);
    _createNoteEditItems(record, setURL);

    w2ui['NoteEditGeneral'].record = record;
    w2ui['NoteEditDoc'].record = record;
    w2ui['NoteEditItems'].record = record;
    w2ui['NoteEditGeneral'].saveURL = setURL;
    w2ui.NoteEditGeneral.html('left', w2ui.NoteEditTabs);
    if (tab) {
        w2ui.NoteEditGeneral.html('main', w2ui[`NoteEdit${tab}`]);
    } else {
        w2ui.NoteEditGeneral.html('main', w2ui.NoteEditDoc);
    }
    return w2ui['NoteEditGeneral'];
}

function _createNoteItemDetails(record) {
    if (w2ui['NoteItemDetails']) {
        w2ui['NoteItemDetails'].destroy();
    }

    function flattenObject(obj, prefix = '', level = 0) {
        let items = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                    items[newKey] = {value, level, isObject: true}; // Mark as object
                    Object.assign(items, flattenObject(value, newKey, level + 1));
                } else {
                    items[newKey] = {value, level, isObject: false};
                }
            }
        }
        return items;
    }

    function unflattenObject(data) {
        const result = {};
        for (const i in data) {
            const keys = i.split('.');
            keys.reduce((acc, key, index) => {
                if (index === keys.length - 1) {
                    acc[key] = data[i];
                } else {
                    acc[key] = acc[key] || {};
                }
                return acc[key];
            }, result);
        }
        return result;
    }
    function __generateJSONForm(key, object, level) {
        let formHtml = "";
        let title = key.split('.').at(-1);
        if(key.length > 0) {
            formHtml += `<details class="section-container" style="padding-left: ${level * 20}px;">
                        <summary class="section-header">${title.charAt(0).toUpperCase() + title.slice(1)}</summary>`;
        }
        for(let subkey in object) {
            let value = object[subkey];
            if(typeof value === 'object' && !Array.isArray(value))  {
                formHtml += __generateJSONForm(`${key}.${subkey}`,value,level+1);
            } else {
                let subtitle = subkey;
                formHtml += `<div class="nested-field w2ui-field" style="padding-left: ${level * 20}px;">
                            <label>${subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}</label>
                            <div>`;
                            if(value.length > 50) {
                                formHtml += `<textarea name="${key}.${subkey}" cols="50" rows="${Math.floor(value.length/50) + 1}">${value}</textarea>`;
                            } else {
                                formHtml += `<input name="${key}.${subkey}" type="${typeof value === 'number' ? 'number' : 'textarea'}" value="${value}" size="50"/>`;
                            }
                            formHtml += ` </div> </div>`;
            }
        }
        if(key.length > 0) {
            formHtml += `</details>`;
        }
        return formHtml;
    }

    let fields = [];
    let formHtml = '<div class="w2ui-page page-0"><div class="section-container">';
    formHtml += __generateJSONForm("", record,0);
    formHtml += '</div></div>';
    formHtml += '<div class="w2ui-buttons">' +
        '   <button class="w2ui-btn w2ui-btn-red" name="reset">Cancel</button>' +
        '   <button class="w2ui-btn w2ui-btn-blue" name="reset">Reset</button>' +
        '   <button class="w2ui-btn w2ui-btn-green" name="save">Save</button>' +
        '</div>';

    $().w2form({
        name: 'NoteItemDetails',
        style: 'border: 0px; background-color: transparent;overflow:hidden; ',
        fields: fields,
        record: record,
        formHTML: formHtml,
        onRender: (event) => {
        },
        actions: {
            Save: function () {
                let url = this.saveURL;
                let newRecord = {};
                for (let i in this.fields) {
                    newRecord[this.fields[i].field] = this.record[this.fields[i].field]
                    if (this.editors[this.fields[i].field]) {
                        newRecord[this.fields[i].field] = this.editors[this.fields[i].field].getData();
                    }
                }

                $.ajax({
                    url: url, data: newRecord, success: function (results) {
                        alert("Saved");
                    }, failure: function (results) {
                        console.error(results);
                    }
                });
            },
            Reset: function () {
                this.clear();
            },
            cancel: {
                caption: "Cancel", style: 'background: pink;', onClick(event) {
                    w2popup.close();
                },
            },
        }
    });
//    w2ui['NoteItemDetails'].record = { text: JSON.stringify(record) };
    w2ui['NoteItemDetails'].record = record;
}

function _createNoteEditItems(record, setURL) {
    let config = {
        name: "NoteEditItems",
        title: "Artifacts",
        edit: ANote.editItem,
        tab: 'items',
        saveURL: "note/save",
        attribute: 'items',
        columns: [
            {
                field: 'id',
                caption: 'ID',
                size: '0%',
                resizable: false,
                hiddent: true,
                fn: (name, value) => {
                    return value.id;
                }
            },
            {
                field: 'state',
                caption: 'State',
                size: '10%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.state;
                },
                render: function (record) {
                    var row = w2ui.NoteEditItems.get(record.recid, true); // true to get DOM element
                    $(row).css('background-color', scolors[record.state]);
                    return `<span style="background-color:${scolors[record.state]};">${record.state}</span>`;
                }
            },
            {
                field: 'type',
                caption: 'Artifact Type',
                size: '25%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.type;
                }
            },
            {
                field: 'name',
                caption: 'Name',
                size: '25%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.json.name;
                }
            },
            {
                field: 'description',
                caption: 'Details',
                size: '40%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.json.description;
                }
            },
        ]
    };
    _createCharacteristicGrid(config);
}

function _createNoteEditDoc(record, setURL) {
    if (!w2ui.NoteEditDoc) {
        $().w2form({
            name: 'NoteEditDoc',
            saveURL: setURL,
            style: 'border: 0px; background-color: transparent;overflow:hidden; ',
            fields: [
                {
                    field: 'createdDate',
                    type: 'date',
                    required: true,
                    readonly: true,
                    html: {
                        attr: 'style="width: 450px;',
                        caption: 'Name'
                    }
                },
                {
                    caption: 'Notes',
                    field: 'text',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 500px;"',
                        caption: "Description",
                    }
                },
            ],
            onRender: (event) => {
            },
            actions: {
                Save: function () {
                    let url = this.saveURL;
                    let newRecord = {};
                    for (let i in this.fields) {
                        newRecord[this.fields[i].field] = this.record[this.fields[i].field]
                        if (this.editors[this.fields[i].field]) {
                            newRecord[this.fields[i].field] = this.editors[this.fields[i].field].getData();
                        }
                    }

                    $.ajax({
                        url: url, data: newRecord, success: function (results) {
                            alert("Saved");
                        }, failure: function (results) {
                            console.error(results);
                        }
                    });
                },
                Reset: function () {
                    this.clear();
                },
                cancel: {
                    caption: "Cancel", style: 'background: pink;', onClick(event) {
                        w2popup.close();
                    },
                },
            }
        });
        $(document).ready(function () {
            $(document).on('click', "#actorgenerateDescription", function () {
                let clsid = w2ui.NoteEditDoc.record.name;
                let url = `actor/generate?target=Description&id=${clsid}`;
                w2ui.NoteEditDoc.lock('description', true);
                w2ui.NoteEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        $('html').css('cursor', 'auto');
                        w2ui.NoteEditDoc.unlock('description', true);
                        w2ui.NoteEditDoc.record.description = results;
                        w2ui.NoteEditDoc.refresh();
                        w2ui.NoteEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
            $(document).on('click', "#actorgenerateDocumentation", function () {
                let clsid = w2ui.NoteEditDoc.record.name;
                let url = `actor/generate?target=Documentation&id=${clsid}`;
                w2ui.NoteEditDoc.lock('Generating...', true);
                w2ui.NoteEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        w2ui.NoteEditDoc.unlock('document', true);
                        w2ui.NoteEditDoc.record.document = results;
                        w2ui.NoteEditDoc.refresh();
                        $('html').css('cursor', 'auto');
                        w2ui.NoteEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
        })
    }
}

function _setGraphToolbar(object) {
    const distance = 1750;
    const div = document.getElementById('preview2d');
    window.graph.toolbar.setToolBar([
        {
            type: 'button', id: 'fit', text: 'Show All', img: 'w2ui-icon-zoom',
            onClick: (event) => {
                window.graph.graph.zoomToFit(1000);
                // 2D
                div.innerHTML = "Fetching UML diagrams";
                $.ajax({
                    url: object.link2d + "&diagram=UseCase",
                    success: (results) => {
                        div.innerHTML = results;
                    },
                    error: (req, text, err) => {
                        console.error(text);
                    }
                });
            }
        },
        {
            type: 'button', id: 'usecases', text: 'UseCases', img: 'w2ui-icon-search', onClick: (event) => {
                // 2D
                div.innerHTML = "Fetching UML diagrams";
                $.ajax({
                    url: object.link2d + "&diagram=UseCase",
                    success: (results) => {
                        div.innerHTML = results;
                    },
                    error: (req, text, err) => {
                        console.error(text);
                    }
                });
            }
        },
        {
            type: 'button', id: 'workflows', text: 'Workflows', img: 'w2ui-icon-search', onClick: (event) => {
                // 2D
                div.innerHTML = "Fetching UML diagrams";
                $.ajax({
                    url: object.link2d + "&diagram=Workflows",
                    success: (results) => {
                        div.innerHTML = results;
                    },
                    error: (req, text, err) => {
                        console.error(text);
                    }
                });
            }
        },
    ]);
}

function _createCharacteristicGrid(config) {
    if (!w2ui[config.name]) {
        $().w2grid({
            name: config.name,
            header: config.title,
            show: {
                header: true,
                columnHeaders: true,
                toolbar: true,
                toolbarSave: true,
                toolbarAdd: true,
                toolbarEdit: true,
                toolbarDelete: true
            },
            toolbar: {
                items: [
                    {type: 'button', id: 'accept', caption: 'Accept', icon: 'fa fa-check'},
                    {type: 'button', id: 'reject', caption: 'Reject', icon: 'fa fa-times'}
                ],
                onClick(event) {
                    const selected = w2ui[config.name].getSelection();
                    const noteID = w2ui[config.name].record.id;
                    if (selected.length > 0) {
                        if (event.target === 'accept') {
                            $('html').css('cursor', 'wait');
                            let itemIDS = [];
                            for (let i in selected) {
                                itemIDS.push(w2ui[config.name].get(selected[i]).id);
                            }
                            let url = `note/acceptItems?note=${noteID}&items=${selected.join(',')}`;
                            $.ajax({
                                url: url,
                                success: function (results) {
                                    w2ui[config.name].unlock();
                                    // w2ui[config.name].record = results;
                                    $('html').css('cursor', 'auto');
                                    w2ui.NoteEditTabs.click(config.tab);
                                },
                                failure: function (results) {
                                    console.error(results);
                                }
                            });
                        } else if (event.target === 'reject') {
                            $('html').css('cursor', 'wait');
                            let itemIDS = [];
                            for (let i in selected) {
                                itemIDS.push(w2ui[config.name].get(selected[i]).id);
                            }
                            let url = `note/rejectItems?note=${noteID}&items=${selected.join(',')}`;
                            $.ajax({
                                url: url,
                                success: function (results) {
                                    w2ui[config.name].unlock();
                                    // w2ui[config.name].record = results;
                                    $('html').css('cursor', 'auto');
                                    w2ui.NoteEditTabs.click(config.tab);
                                },
                                failure: function (results) {
                                    console.error(results);
                                }
                            });
                        }
                    }
                },
            },
            onAdd: (event) => {
            },
            onSave: (event) => {
                let changes = w2ui[config.name].getChanges();
                let records = w2ui[config.name].records;
                for (let i in changes) {
                    let change = changes[i];
                    let rec = null;
                    for (let j in records) {
                        if (records[j].recid === change.recid) {
                            rec = records[j];
                            break;
                        }
                    }
                    // Just updating the episode
                    if (rec.id) {
                        let url = `${config.saveURL}?id=${rec.id}`;
                        for (let i in change) {
                            url += `&${i}=${change[i]}`;
                        }
                        $.ajax({
                            url: url,
                            success: function (results) {
                                console.log("results", results);
                            }
                        });
                    } else {
                    }
                }
            },
            onEdit: (event) => {
                // Open the Item Edit Dialog
                let records = w2ui[config.name].records;
                let rec = null;
                for (let j in records) {
                    if (records[j].recid === event.recid) {
                        rec = records[j];
                        break;
                    }
                }
            },
            onDelete: (event) => {
                let selected = w2ui[config.name].getSelection();
                console.log("Delete", selected);
            },
            onRender: (event) => {
                let records = [];
                let count = 0;
                for (let name in w2ui[config.name].record[config.attribute]) {
                    let value = w2ui[config.name].record[config.attribute][name];
                    let record = {
                        recid: count++
                    };
                    for (let i in config.columns) {
                        let col = config.columns[i];
                        record[col.field] = col.fn(name, value);
                    }
                    records.push(record);
                }
                w2ui[config.name].records = records;
                w2ui[config.name].sort('name', 'desc');
                setTimeout(function () {
                    w2ui[config.name].refreshBody();

                    var grid = w2ui[config.name];
                    grid.records.forEach(function (record, index) {
                        const row = $(`#grid_NoteEditItems_rec_${record.recid}`);
                        row.css('background-color', scolors[record.state]);
                    });
                }, 10);
            },
            onSelect: (event) => {
                let rec = w2ui[config.name].get(event.recid);
                let note = w2ui['NoteEditGeneral'].record;
                let record = note.items[rec.id];
                _createNoteItemDetails(record.json);
                w2ui['NoteEditGeneral'].html('bottom', w2ui.NoteItemDetails);
                w2ui['NoteEditGeneral'].set('main', {size: 300});
                w2ui['NoteEditGeneral'].set('bottom', {size: 300});
            },

            columns: config.columns,
        });
        w2ui[config.name].on('dblClick', function (event) {
            let record = this.get(event.recid);
            let id = record.uid || record.name;
            // THis is where we need to open up another window to show details of what was clicked on.
            if (config.edit && config.editURL) {
                $.ajax({
                    url: `${config.editURL}?id=${id}`,
                    success: function (results) {
                        config.edit(results, config.saveURL);
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            }

        });
    }
}