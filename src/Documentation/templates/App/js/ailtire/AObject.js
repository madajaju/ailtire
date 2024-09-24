

import {AText, A3DGraph, ASelectedHUD, AMainWindow} from './index.js';

export default class AObject {
    static scolor = {
        started: "#aaffff",
        create: "#aaffff",
        completed: "#aaffaa",
        failed: "#ffaaaa",
        enabled: "#aaffaa",
        disable: "#aaaaaa",
        rejected: "#ffaaaa",
        accepted: "#aaffff",
        update: "#aaffff",
        needed: "#ffbb44",
        selected: "#aaffaa",
        evaluated: "#ffffaa",
    };

    constructor(config) {
        this.config = config;
    }

    static showList() {

    }

    static expandObject(link) {
        expandObjectOnGraph(link);
    }

    static showDetail(id) {
        let myListForm = w2ui['objlist'];
        if (!myListForm) {
            return;
        }
        let aresults = myListForm.results;
        if (!aresults) {
            return;
        }

        for (let i in aresults.records) {
            if (aresults.records[i]._id === id) {
                let results = aresults.records[i];
                w2ui['objdetail'].header = `${results._name} Details`;
                w2ui['objdetail'].show.columnHeaders = true;
                w2ui['objdetail'].clear();

                let drecords = [];
                let k = 0;
                for (let i in results) {
                    let name = i;
                    let value = results[i];
                    if (results[i].hasOwnProperty('count')) {
                        value = results[i].count;
                    } else if (results[i].hasOwnProperty('name')) {
                        value = results[i].name;
                    }
                    k++;
                    drecords.push({recid: k, name: name, value: value});
                }
                w2ui['objdetail'].records = drecords;
                w2ui['objdetail'].refresh();
                ASelectedHUD.update(results._name + ' Details', drecords);
            }
        }
    }
    static getEditForm(record, setURL) {
        if (!w2ui['ObjectEditGeneral']) {
            $().w2layout({
                name: 'ObjectEditGeneral',
                panels: [
                    {type: 'left', size: 150, resizable: true, minSize: 35},
                    {type: 'main', overflow: 'hidden'}
                ],
                onRender: (event) => {
                    // Add the record to the form and the assoication tabs
                    if (event.target === 'ObjectEditGeneral') {
                        if (w2ui.ObjectEditGeneral.record) {
                            w2ui.ObjectEditGeneral.record = {};
                        }
                    }
                }
            });
        }
        let nodes = [
            {id: 'details', text: "Details", selected: true}
        ];
        for(let aname in record.columns) {
            let item = record.columns[aname];
            if(item.hasOwnProperty("cardinality")) {
                if(item.cardinality != 1) {
                    nodes.push({id: aname, text: `${aname[0].toLowerCase()}${aname.slice(1)}`});
                }
            }
        }
        if (!w2ui['ObjectEditTabs']) {
            $().w2sidebar({
                name: 'ObjectEditTabs',
                flatButton: true,
                nodes: nodes,
                onClick(event) {
                    if(event.target === 'details') {
                        w2ui['ObjectEditGeneral'].html('main', w2ui.ObjectEditDetails);
                    } else {
                        w2ui['ObjectEditGeneral'].html('main', w2ui[`ObjectEdit${event.target}`]);
                    }
                }
            });
        }
        if(w2ui['ObjectEditDetails']) {
            w2ui['ObjectEditDetails'].destroy();
        }
        let fields = [
            { field: 'name' , type: 'text', required: true },
            { field: 'type' , type: 'text', readonly: true },
            { field: 'package' , type: 'text', readonly: true },
            { field: 'state' , type: 'text', readonly: true },
        ];
        let frecord = {
            name: record.record._name,
            id: record.record._id,
            state: record.record._state,
            type: record.record._type,
            package: record.record._package,
        };
        for(let aname in record.columns) {
            let item = record.columns[aname];
            if(!(item.hasOwnProperty("cardinality") && item.cardinality != 1)) {
                if(aname !== 'name') {
                    fields.push({
                        field: aname,
                        type: item.type,

                    });
                    frecord[aname] = record.record[aname];
                }
            }
        }
        $().w2form({
            name: 'ObjectEditDetails',
            saveURL: setURL,
            style: 'border: 0px; background-color: transparent;overflow:hidden; ',
            fields: fields,
            record: frecord,
            actions: {
                Save: function () {
                    let url = this.saveURL;
                    let newRecord = {};
                    for(let i in this.fields) {
                        newRecord[this.fields[i].field] = this.record[this.fields[i].field]
                        if(this.editors[this.fields[i].field]) {
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
        for(let aname in record.columns) {
            let item = record.columns[aname];
            if(item.hasOwnProperty('cardinality') && item.cardinality != 1) {
                let formName = `ObjectEdit${aname}`;
                let title = `${aname[0].toUpperCase()}${aname.slice(1)}`;
                if(w2ui[formName]) {
                    w2ui[formName].destroy();
                }
                $().w2grid( {
                   name: formName,
                   header: title,
                   record: record.record[aname],
                   show: {
                        header: true,
                        columnHeaders: true,
                        toolbar: true,
                        toolbarSave: true,
                        toolbarAdd: true,
                        toolbarEdit: true,
                        toolbarDelete: true
                    },
                    columns: [
                        {
                            field: 'id',
                            caption: 'ID',
                            size: '20%',
                            resizable: true,
                            editable: {type: 'text'},
                            sortable: true,
                        },
                        {
                            field: 'state',
                            caption: 'State',
                            size: '20%',
                            resizable: true,
                            editable: {type: 'text'},
                            sortable: true,
                        },
                        {
                            field: 'name',
                            caption: 'Name',
                            size: '60%',
                            resizable: true,
                            editable: {type: 'text'},
                            sortable: true,
                        }
                    ],
                    onAdd: (event) => {
                    },
                    onSave: (event) => {
                        let changes = w2ui[formName].getChanges();
                        let records = w2ui[formName].records
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
                                let url = `${item.type}/save?id=${rec.id}`;
                                for (let i in change) {
                                    url += `&${i}=${change[i]}`;
                                }
                                $.ajax({
                                    url: url,
                                    success: function (results) {
                                        console.log("results", results);
                                    }
                                });
                            }
                        }
                    },
                    onEdit: (event) => {
                        // Open the Episode Edit Dialog

                        let record = w2ui[formName].records[event.recid];
                        if (record.recid != event.recid) {
                            for (let i in w2ui[formName].records) {
                                if (w2ui[formName].records[i].recid === event.recid) {
                                    record = w2ui[formName].records[i];
                                    break;
                                }
                            }
                        }
                        record._id = record.id;
                    },
                    onDelete: (event) => {
                        let selected = w2ui[formName].getSelection();
                        console.log("Delete", selected);
                    },
                    onRender: (event) => {
                        let records = [];
                        let count = 0;
                        for (let i in w2ui[formName].record.values) {
                            let attr = w2ui[formName].record.values[i];
                            records.push({
                                recid: i,
                                name: attr.name,
                                id: attr.id,
                                state: attr.state,
                            });
                        }
                        w2ui[formName].records = records;
                        w2ui[formName].sort('name', 'desc');
                        setTimeout(function () {
                            w2ui[formName].refreshBody();
                        }, 10);
                    },
                })
            }
        }
        w2ui['ObjectEditGeneral'].record = record;

        w2ui['ObjectEditGeneral'].saveURL = setURL;
        w2ui['ObjectEditGeneral'].html('left', w2ui.ObjectEditTabs);
        w2ui['ObjectEditGeneral'].html('main', w2ui.ObjectEditDoc);
        return w2ui['ObjectEditGeneral'];
    }

    static addObject(obj, creator) {
        if (obj._attributes && !creator) {
            // Add the object to the list Only if the creator is not set. This prevents junk from being added to the
            // detail list.
            let ritem = {recid: obj._attributes.id};
            for (let i in obj.definition.attributes) {
                if (obj._attributes.hasOwnProperty(i)) {
                    ritem[i] = obj._attributes[i];
                    ritem[i + 'detail'] = obj._attributes[i];
                }
            }
            for (let i in obj.definition.associations) {
                if (obj._associations.hasOwnProperty(i)) {
                    let assocValue = obj._associations[i];
                    let assoc = obj.definition.associations[i];
                    if (assoc.cardinality === 1) {
                        ritem[i] = assocValue._attributes.name;
                        ritem[i + 'detail'] = `<span onclick="expandObject('${assocValue.type}?id=${assocValue._attributes.id}');">${assocValue._attributes.name}</spana>`;
                    } else {
                        ritem[i] = assocValue.length;
                        let values = [];
                        for (let j in assocValue) {
                            let aValue = assocValue[j];
                            values.push(`<span onclick="expandObject('${aValue.type}?id=${aValue._attributes.id}');">${aValue._attributes.name}</spana>`);
                        }
                        ritem[i + 'detail'] = values.join('|');
                    }
                }
            }
            w2ui['objlist'].add([ritem]);
        } else if (obj._attributes) {
            // Add the object to the graph
            let data = {nodes: {}, links: []};
            data.nodes[obj._attributes.id] = {
                id: obj._attributes.id,
                name: obj._attributes.name,
                group: obj.definition.name,
                level: obj.definition.package.shortname,
                view: obj.definition.name + '3D'
            }
            if (creator) {
                data.links.push({
                    target: obj._attributes.id,
                    source: creator,
                    value: 100,
                    width: 0.001,
                    color: "#aaffff"
                });
            }
            // Now add the nodes of the associations
            // Go through the cols and get the associations

            addRelationshipObjects(data, obj.definition, obj._associations, data.nodes[obj._attributes.id]);
            // If there is a creator and there is not an rbox then add an rbox to the creator.
            if (creator) {
                let rbox = {
                    parent: creator,
                    x: {min: -2000, max: 2000},
                    z: {min: -2000, max: -700},
                    y: {min: -2000, max: 2000}
                }

                for (let i in data.nodes) {
                    if (!data.nodes[i].rbox) {
                        data.nodes[i].rbox = rbox;
                    }
                }
            }
            window.graph.addData(data.nodes, data.links);
        }
    }

    static createList(results) {
        let cols = [
            {field: 'state', size: "10%", resizeable: true, label: "State", sortable: true},
            {field: 'id', size: "20%", resizeable: true, label: "ID", sortable: true},
            {field: 'name', size: "70%", resizeable: true, label: "Object Name", sortable: true},
        ];
        let retForm = w2ui['objlist'];
        retForm.modelName = results.name;
        retForm.columns = cols;
        retForm.header = `${results.name} Objects (${results.records.length})`;
        retForm.show.columnHeaders = true;
        retForm.show.header = true;
        w2ui['objdetail'].clear();
        retForm.onClick = function (event) {
            // The detail is loaded in the showDetail which is called after the node is selected in the graph.
            // this happens in the callback function for selecting a node.
            let record = this.get(event.recid);
            window.graph.selectNodeByID(event.recid);
            AMainWindow.selectedObject = record;
        };

        retForm.refresh();
        return retForm
    }

    static viewList(results) {
        let myForm = AObject.createList(results);
        myForm.results = results;
        let records = [];
        for (let i in results.records) {
            let rec = results.records[i];
            let color = AObject.scolor[`${rec._state.toLowerCase()}`];
            let ritem = {
                recid: rec._id,
                id: rec._id,
                state: rec._state,
                name: rec._name,
                statedetail: rec._state,
                results: rec,
                "w2ui": {"style": {0: `background-color: ${color}`}}
            };
            records.push(ritem);
        }
        myForm.records = records;
        // Create new records that show the number of each state.
        let jmap = {};
        for (let i in records) {
            let rec = records[i];
            if (!jmap.hasOwnProperty(rec.state)) {
                jmap[rec.state] = {name: rec.state, value: 0};
            }
            jmap[rec.state].value++;
        }
        let jrecords = [{name: 'Total', value: records.length}]
        for (let name in jmap) {
            jrecords.push({name: name, value: jmap[name].value});
        }
        ASelectedHUD.update(results.name + 's', jrecords);
        myForm.refresh();
        return myForm;
    }

    static viewDetail(model, records) {
        let myForm = AObject.createDetail(model);
        $('#objdetail').w2render(myForm.name);
        myForm.clear();
        myForm.model = model.name;
        myForm.oid = model.id;
        myForm.add(records);
        myForm.refresh();
    }

    static view3D(node, type) {
        let color = node.color || "blue";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let w = node.w || 120;
        let h = node.h || 40;

        const theta = 3.14 / 2;
        const group = new THREE.Group();
        const material = new THREE.MeshLambertMaterial({color: color, opacity: 1});
        const left = new THREE.SphereGeometry(h / 2, 16, 12);
        let leftObj = new THREE.Mesh(left, material);
        leftObj.position.set(-(w - h) / 2, 0, 0)
        const right = new THREE.SphereGeometry(h / 2, 16, 12);
        let rightObj = new THREE.Mesh(right, material);
        rightObj.position.set((w - h) / 2, 0, 0)
        const center = new THREE.CylinderGeometry(h / 2, h / 2, w - h);
        let centerObj = new THREE.Mesh(center, material);
        centerObj.applyMatrix4(new THREE.Matrix4().makeRotationZ(theta));
        group.add(leftObj);
        group.add(rightObj);
        group.add(centerObj);

        let label = AText.view3D({text: node.name, color: "#ffffff", width: w - h, size: (h / 2)});
        label.position.set(0, 0, (h / 2) + 1);
        label.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1));
        group.add(label);

        group.position.set(node.x, node.y, node.z);
        if (node.rotate) {
            if (node.rotate.x) {
                group.applyMatrix4(new THREE.Matrix4().makeRotationX(node.rotate.x));
            }
            if (node.rotate.y) {
                group.applyMatrix4(new THREE.Matrix4().makeRotationY(node.rotate.y));
            }
            if (node.rotate.z) {
                group.applyMatrix4(new THREE.Matrix4().makeRotationZ(node.rotate.z));
            }
        }
        group.aid = node.id;
        node.box = h;
        node.expandLink = `action/get?id=${node.id}`;
        node.expandView = AObject.viewDeep3D;

        return group;
    }

    static viewDeep3D(obj) {

    }

    static handle(results) {
        window.graph.setDuplicateLink(false);
        AObject.processObjectsForGraph(results, 'new');
        AObject.viewList(results);
    }

    static processObjectsForGraph(objs, mode) {
        let data = {nodes: {}, links: []};
        for (let i in objs.records) {
            let rec = objs.records[i];
            // Fix the problem with naming objects.
            if (!rec.hasOwnProperty('name')) {
                rec._name = rec._id;
            }
            ;
            data.nodes[rec._id] = {
                id: rec._id,
                name: rec._name,
                group: rec._type,
                level: rec._package,
                view: rec._type + '3D',
                link: rec._link
            }
            // Now add the nodes of the associations
            // Go through the cols and get the associations
            for (let j in objs.columns) {
                let col = objs.columns[j];
                // this checks if it was an association
                if (rec[j] && col.hasOwnProperty('cardinality')) {
                    let obj = rec[j];
                    if (col.cardinality === 1) {
                        if (obj._name.length < 1) {
                            obj._name = obj._id;
                        }
                        data.nodes[obj._id] = {
                            id: obj._id,
                            name: obj._name,
                            group: obj._type,
                            level: col.package,
                            view: obj._type + '3D',
                            link: obj._link
                        };
                        if (col.owner || col.composition) {
                            data.links.push({
                                source: rec._id, target: obj._id, value: 1, width: 0.5
                            });
                        } else {
                            data.links.push({
                                source: obj._id, target: rec._id, value: 10, width: 0.5
                            });
                        }
                    } else {
                        for (let k in obj.values) {
                            let aobj = obj.values[k];
                            if (aobj._name.length < 1) {
                                aobj._name = aobj.id;
                            }
                            data.nodes[aobj._id] = {
                                id: aobj._id,
                                name: aobj._name,
                                group: aobj._type,
                                level: col.package,
                                view: aobj._type + '3D',
                                link: aobj._link
                            };
                            if (col.owner || col.composition) {
                                data.links.push({
                                    source: rec._id, target: aobj._id, value: 1, width: 0.5
                                });
                            } else {
                                data.links.push({
                                    target: rec._id, source: aobj._id, value: 10, width: 0.5
                                });
                            }
                        }
                    }
                }
            }
        }
        if (mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
        }
    }

    static editObject(obj) {
        let editForm = null;
        if (AMainWindow.objectEditors.hasOwnProperty(obj._type)) {
            editForm = AMainWindow.objectEditors[obj._type](obj);
        } else {
            editForm = AObject.getEditForm(obj);
        }
        w2popup.open({
            height: 850,
            width: 850,
            title: `Edit ${obj._type}`,
            body: '<div id="editObjectDialog" style="width: 100%; height: 100%;"></div>',
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editObjectDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.editObjectDialog.box).show();
                    w2ui.editObjectDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler,
                    // which would make this code execute too early and hence not deliver.
                    $('#editObjectDialog').w2render(editForm);
                }
            }
        });
    }
}

function expandObjectOnGraph(link) {
    $.ajax({
        url: link,
        success: A3DGraph.addObjectToGraph
    });
}

function addRelationshipObjects(data, definition, associations, parent) {
    for (let i in associations) {
        if (associations.hasOwnProperty(i)) {
            let aobj = associations[i];
            if (!definition.associations.hasOwnProperty(i)) {
                console.log("i:", i);
            } else {
                let assoc = definition.associations[i];
                if (assoc.cardinality === 1) {
                    data.nodes[aobj._attributes.id] = {
                        id: aobj._attributes.id,
                        name: aobj._attributes.name,
                        group: aobj.definition.name,
                        level: aobj.definition.package.shortname,
                        universe: "Created",
                        view: aobj.definition.name + '3D'
                    };
                    if (assoc.owner || assoc.composite) {
                        data.links.push({
                            source: obj._attributes.id,
                            target: aobj._attributes.id,
                            value: 1,
                            width: 0.5
                        });
                    } else {
                        data.links.push({
                            target: parent.id,
                            source: aobj._attributes.id,
                            value: 10,
                            width: 0.5,
                        });
                    }
                } else {
                    for (let j in aobj) {
                        let aaobj = aobj[j];
                        data.nodes[aaobj._attributes.id] = {
                            id: aaobj._attributes.id,
                            name: aaobj._attributes.name,
                            group: aaobj.definition.name,
                            level: aaobj.definition.package.shortname,
                            universe: "Created",
                            view: aaobj.definition.name + '3D'
                        };
                        if (assoc.owner || assoc.composite) {
                            data.links.push({
                                source: parent.id,
                                target: aaobj._attributes.id,
                                value: 1,
                                width: 0.5
                            });
                        } else {
                            data.links.push({
                                target: parent.id,
                                source: aaobj._attributes.id,
                                value: 10,
                                width: 0.5
                            });
                        }
                    }
                }
            }
        }
    }
}

const _getLine = (point1, point2, color) => {
    const mat = new THREE.LineBasicMaterial({color: color});
    const points = [];
    points.push(new THREE.Vector3(point1.x, point1.y, point1.z));
    points.push(new THREE.Vector3(point2.x, point2.y, point2.z));

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const ret = new THREE.Line(geo, mat);
    return ret;
}