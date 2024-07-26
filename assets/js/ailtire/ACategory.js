/*
 * Copyright 2023 Intel Corporation.
 * This software and the related documents are Intel copyrighted materials, and your use of them is governed by
 * the express license under which they were provided to you (License). Unless the License provides otherwise,
 * you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
 * without  Intel's prior written permission. This software and the related documents are provided as is, with no
 * express or implied warranties, other than those that are expressly stated in the License.
 *
 */

import {
    AMainWindow,
    AActor,
    AText,
    AWorkFlow,
    AActivityRun,
} from './index.js';

const scolor = {
    started: "#00ffff",
    created: "#00ffff",
    inprogress: "#00aaff",
    blocked: "#ffbb44",
    completed: "#aaffaa",
    failed: "#ffaaaa",
    error: "#ffaaaa",
    enabled: "#00ff00",
    disable: "#aaaaaa",
    rejected: "#ff0000",
    accepted: "#00aaaa",
    update: "#00aaaa",
    needed: "#ffbb44",
    selected: "#00ff00",
    evaluated: "#ffff00",
};

export default class ACategory {
    constructor(config) {
        this.config = config;
    }

    static default = {
        fontSize: 15,
        height: 40,
        width: 40,
        depth: 20,
        corner: 5,
    }

    static calculateBox(node) {
        let nameArray = node.name.split(/\s/).map(item => {
            return item.length;
        });
        let maxLetters = nameArray.reduce(function (a, b) {
            return Math.max(a, b);
        }, -Infinity);

        let height = nameArray.length * ACategory.default.fontSize * 2;
        let width = maxLetters * (ACategory.default.fontSize / 1.5);
        let depth = ACategory.default.depth;
        let radius = Math.max(Math.sqrt(width * width + height * height), Math.sqrt(height * height + depth * depth), Math.sqrt(width * width + depth * depth)) / 2;
        return {w: width, h: height, d: depth, r: radius};
    }

    static colors = [
        '#ffaa88',
        '#ffffaa',
        '#88aaff',
        '#cccccc',
        '#88ffaa',
        '#aaaaff',
    ];

    static view3D(node, type) {
        let color = node.color || "#77aa44";
        let opacity = node.opacity || 0.75;
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        const size = ACategory.calculateBox(node);
        const theta = Math.PI / 2;
        const group = new THREE.Group();
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
        const box1Obj = new THREE.Mesh(new THREE.BoxGeometry(size.w, size.h, size.d), material);
        box1Obj.position.set(0, 0, 0);
        group.add(box1Obj);

        let label = AText.view3D({text: node.name.replace(/\s/g, '\n'), color: "#ffffff", width: 80, size: 12});
        label.position.set(0, 0, size.d + 1);
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
        node.box = size.r;
        node.expandLink = `category/get?id=${node.id}`;
        node.expandView = ACategory.handle;
        node.getDetail = ACategory.getDetail;

        return group;
    }

    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                ACategory.showDetail(results);
            }
        });
    }

    static handle2d(result, object, div) {
        _setGraphToolbar(object);
        div.innerHTML = result;
    }

    static handle(results, event, config) {
        if (!config || !config.mode) {
            config = {mode: "new"}
        }
        // The name is the same as the id on category.
        // It needs to be set.
        results.id = results.name;
        ACategory.viewDeep3D(results, config);
        ACategory.showDetail(results);
        AMainWindow.currentView = "category";

        window.graph.toolbar.setToolBar([
            {
                type: 'button', id: 'runs', text: 'Show Run', img: 'w2ui-icon-zoom',
                onClick: (event) => {
                    window.graph.graph.cameraPosition({
                            x: 1000,
                            y: 0,
                            z: -500,
                        }, // new position
                        {x: 0, y: 0, z: -500},
                        1000  // ms transition duration.
                    );
                    window.graph.graph.zoomToFit(1000);
                }
            }, {
                type: 'button', id: 'fit', text: 'Show All', img: 'w2ui-icon-zoom',
                onClick: (event) => {
                    window.graph.graph.zoomToFit(1000);
                }
            },
            {
                type: 'button', id: 'explode', text: 'Explode', img: 'w2ui-icon-search', onClick: (event) => {
                    ACategory.viewDeep3D(results, {mode: 'explode'});
                }
            }
        ]);
    }

    static handleEvent(event, category, message) {
        let [eventB, eventS] = event.split('.');
        let color = scolor[eventS];
        if (eventB === "category") {
            window.graph.setNodeAndFocus(category.name, {color: color});
        } else if (eventB === "activity") {
            AActivityRun.handleEvent(eventS, category, message);
        }
        w2ui['WorkflowSimulation'].refresh();
    }


    static handleList(result) {
        ACategory.viewList3D(result, 'new');
        ACategory.showListDetail(result);
    }

    static viewList3D(result) {
        let data = {nodes: {}, links: []};

        for (let i in result.subcategories) {
            let item = result.subcategories[i];
            let sname = item.prefix;
            data.nodes[sname] = {
                id: sname,
                name: item.name,
                color: item.color,
                description: item.description,
                view: ACategory.view3D
            }
            for(let i in item.depends) {
                let depend = item.depends[i];
                data.links.push({target: depend, source: sname, value: 1.0, width: 2});
            }
        }
        for (let i in result.workflows) {
            let workflow = result.workflows[i];
            let wname = workflow.name.replace(/\s/g,'');
            data.nodes[wname] = {
                id: wname,
                name: workflow.name,
                description: workflow.description,
                view: AWorkFlow.view3D
            }
            // data.links.push({target: wname, source: aname, value: 30, width: 2});
        }

        window.graph.setData(data.nodes, data.links);
        window.graph.showLinks();
    }

    static showList(panel, parent) {
        $.ajax({
            url: 'workflow/list',
            success: function (results) {
                let items = [];
                let prefixNodes = {};
                _processCategoryList(items, results.workflows, results.subcategories);
                w2ui[panel].add(parent, items);
            }
        });
    }

    static showDetail(result) {
        let records = [];
        let cols = [
            {field: 'name', size: "50%", resizeable: true, label: "Name", sortable: true},
            {field: 'value', size: "50%", resizeable: true, label: "Value", sortable: true},
        ];
        w2ui['objlist'].columns = cols;
        let i = 0;
        records.push({recid: i++, name: "Name", value: result.name, detail: result.name});
        records.push({recid: i++, name: "Description", value: result.description, detail: result.description});
        for (let aname in result.activities) {
            let activity = result.activities[aname];
            let aid = activity.name.replace(/\s/g, '');
            records.push({recid: aid, name: "Activity", value: aname, detail: activity.description});
        }

        w2ui['objlist'].records = records;
        // Clear the detail list
        w2ui['objdetail'].clear();

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
        w2ui['objlist'].refresh();
    }

    static showListDetail(result) {
        let records = [];
        let cols = [
            {field: 'name', size: "50%", resizeable: true, label: "Name", sortable: true},
            {field: 'value', size: "50%", resizeable: true, label: "Value", sortable: true},
        ];
        w2ui['objlist'].columns = cols;
        let i = 0;
        for (let wname in result) {
            let details = `name^${result[wname].name}|description^${result[wname].description}`;
            if (result[wname].activities) {
                details += `|activities^${Object.keys(result[wname].activities).length}`;
            }
            records.push({recid: wname, name: result[wname].pkg, value: wname, detail: details});
        }

        w2ui['objlist'].records = records;
        // Clear the detail list
        w2ui['objdetail'].clear();

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
        w2ui['objlist'].refresh();
    }
    static viewDeep3D(category, mode) {
        const theta = Math.PI / 2; // 90 degrees
        let data = {nodes: {}, links: []};
        const size = ACategory.calculateDeepBox(category);
        category.size = size;

        window.graph.clearObjects();

        let category3d = {x: size.w, y: size.h, z: size.d};
        let bbox = {
            parent: category.shortname,
            x: {min: (-category3d.x / 2), max: (category3d.x / 2)},
            y: {min: (-category3d.y / 2), max: (category3d.y / 2)},
            z: {min: (-category3d.z / 2), max: (category3d.z / 2)}
        }

        data.nodes[category.prefix] = {
            id: category.prefix,
            name: category.name,
            description: category.description,
            cube: category3d,
            fontSize: 30,
            fx: 0,
            fy: 0,
            fz: 0,
            box: 1, // Make it so items can get really close to the parent package.
            view: ACategory.view3D,
            expandView: ACategory.handle,
            expandLink: `category/get?id=${category.prefix}`,
            getDetail: ACategory.getDetail,
            opacity: 0.5,
            color: category.color
        };
        for(let i in category.depends) {
            let depend = category.depends[i];
            data.links.push({target: depend, source: category.prefix, value: 1.0, width: 2});
        }
        for (let i in category.subcategories) {
            let scat = category.subcategories[i];
            let name = scat.name;
            let sname = scat.prefix;
            let node = {
                id: sname,
                name: name,
                description: scat.description,
                view: ACategory.view3D,
                color: scat.color,
                orientation: {x: -1, y: 0, z: 0}
            };
            data.nodes[sname] = node;
            data.links.push({source: category.prefix, target: sname, color: '#ffffbb', value: 1.0, width: 2});

        }

        for (let i in category.workflows) {
            let workflow = category.workflows[i];
            let wname = workflow.name;
            let node = {
                id: wname,
                name: wname,
                description: workflow.description,
                view: AWorkFlow.view3D,
            };

            data.nodes[wname] = node;
            data.links.push({source: category.prefix, target: wname, color: '#ffffbb', value: 1.0, width: 2});
        }

        for (let aname in category.actors) {
            let actor = category.actors[aname];
            let node = {
                id: aname,
                name: aname,
                view: AActor.view3D,
            };

            data.nodes[aname] = node;
            data.links.push({target: category.prefix, source: aname, color: '#ffffbb', value: 1.0, width: 2});
        }
        if (mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
        }
        let distance = Math.max(Math.sqrt((size.w / 2) ** 2 + (size.h / 2) ** 2) * 2, size.d * 2);
        window.graph.graph.cameraPosition(
            {x: 0, y: 0, z: distance}, // new position
            {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
            3000  // ms transition duration.
        );
        window.graph.showLinks();
        _setGraphToolbar(category);
    }

    static editDocs(results, setURL) {
        let editForm = getEditForm(results, setURL);
        w2popup.open({
            height: 850,
            width: 850,
            title: `Edit ${results.name}`,
            body: '<div id="editCategoryDocDialog" style="width: 100%; height: 100%;"></div>',
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editCategoryDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.CategoryDialog.box).show();
                    w2ui.CategoryDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    $('#editCategoryDocDialog').w2render(editForm.name);
                    w2ui.CategoryEditTabs.click('docs');
                }
            }
        })
    }
    static calculateGroupBox(items, fn) {
        let asize = {
            stats: {
                w: {sum: 0, max: 0},
                h: {sum: 0, max: 0},
                d: {sum: 0, max: 0},
                r: {sum: 0, max: 0},
                area: 0,
                num: 0,
            }, set: [],
            box: {w: 0, h: 0, d: 0, rows: 0, cols: 0},
        };

        for (let aname in items) {
            let item = items[aname];
            if(!item.name) {
                item.name = item.prefix.split('/').pop();
            }
            let size = fn({name: item.name});
            asize.set.push(size);
            asize.stats.w.sum += size.w;
            asize.stats.w.max = Math.max(size.w, asize.stats.w.max);
            asize.stats.d.sum += size.d;
            asize.stats.d.max = Math.max(size.d, asize.stats.d.max);
            asize.stats.h.sum += size.h;
            asize.stats.h.max = Math.max(size.h, asize.stats.h.max);
            asize.stats.r.sum += size.r;
            asize.stats.r.max = Math.max(size.w, asize.stats.r.max);
            asize.stats.area += size.w * size.h;
            asize.stats.num++;
        }
        asize.box.rows = Math.round(Math.sqrt(asize.stats.num) + 0.5);
        asize.box.cols = Math.round((asize.stats.num / asize.box.rows) + 0.5);
        asize.box.w = Math.max(Math.sqrt(asize.stats.area), asize.stats.r.max * asize.box.cols);
        asize.box.h = Math.max(Math.sqrt(asize.stats.area), asize.stats.r.max * asize.box.rows);
        return asize;
    }

    static calculateDeepBox(category) {
        let wbox = ACategory.calculateGroupBox(category.workflows, ACategory.calculateBox); // XZ
        let sbox = ACategory.calculateGroupBox(category.subcategories, ACategory.calculateBox); // XZ

        /* X is always the width, Y is height with X, Y is width with Z, Z is always h */
        let fontWidth = category.name.length * ACategory.default.fontSize / 2;
        const wnum = Math.max(100, fontWidth);
        const hnum = Math.max(wbox.box.h, sbox.box.h, 100);
        const dnum = Math.max(wbox.box.w, sbox.box.w, 100);

        const radius = Math.max(Math.sqrt(wnum ** 2 + hnum ** 2), Math.sqrt(hnum ** 2 + dnum ** 2), Math.sqrt(wnum ** 2 + dnum ** 2));
        return {
            w: wnum * 1.10, h: hnum * 1.10, d: dnum * 1.10, r: radius,
            workflows: wbox,
            subcategories: sbox,
        }
    }
}

function getEditForm(record, setURL) {
    if (!w2ui['CategoryEditGeneral']) {
        $().w2layout({
            name: 'CategoryEditGeneral',
            panels: [
                {type: 'left', size: 150, resizable: true, minSize: 35},
                {type: 'main', overflow: 'hidden'}
            ],
            onRender: (event) => {
                if (event.target === 'CategoryEditGeneral') {
                    if (w2ui.CategoryEditGeneral.record) {
                        w2ui.CategoryEditGeneral.record = {};
                    }
                }
            }
        });
    }
    if (!w2ui['CategoryEditTabs']) {
        $().w2sidebar({
            name: 'CategoryEditTabs',
            flatButton: true,
            nodes: [
                {id: 'docs', text: 'Docs', selected: true},
                {id: 'workflows', text: 'Workflows'},
                {id: 'subcategories', text: 'Sub Categories'},
            ],
            onClick(event) {
                switch (event.target) {
                    case 'docs':
                        w2ui['CategoryEditGeneral'].html('main', w2ui.CategoryEditDoc);
                        break;
                    case 'workflows':
                        w2ui['CategoryEditGeneral'].html('main', w2ui.CategoryEditWorkFlows);
                        break;
                    case 'subcategories':
                        w2ui['CategoryEditGeneral'].html('main', w2ui.CategoryEditSubcategories);
                        break;
                }
            }
        });
    }
    _createCategoryEditDoc(record, setURL);
    _createCategoryEditWorkFlows(record, setURL);
    _createCategoryEditSubcategories(record, setURL);

    w2ui['CategoryEditDoc'].record = record;
    w2ui['CategoryEditWorkFlows'].record = record;
    w2ui['CategoryEditSubcategories'].record = record;

    w2ui['CategoryEditGeneral'].saveURL = setURL;
    w2ui.CategoryEditGeneral.html('left', w2ui.CategoryEditTabs);
    w2ui.CategoryEditGeneral.html('main', w2ui.CategoryEditDoc);
    return w2ui['CategoryEditGeneral'];
}

function _createCategoryEditDoc(record, setURL) {
    if (!w2ui.CategoryEditDoc) {
        $().w2form({
            name: 'CategoryEditDoc',
            saveURL: setURL,
            style: 'border: 0px; background-color: transparent;overflow:hidden; ',
            fields: [
                {
                    field: 'name',
                    type: 'text',
                    required: true,
                    readonly: true,
                    html: {
                        attr: 'style="width: 450px;',
                        caption: 'Name'
                    }
                },
                {
                    field: 'pkg',
                    type: 'text',
                    required: true,
                    readonly: true,
                    html: {
                        attr: 'style="width: 450px;',
                        caption: 'Package'
                    }
                },
                {
                    caption: 'Description',
                    field: 'description',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 150px;"',
                        caption: "Description" +
                            "<br><button class=AIButton id='categorygenerateDescription'></button>"
                    }
                },
                {
                    field: 'document',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 500px;"',
                        caption: "Details" +
                            "<br><button class=AIButton id='categorygenerateDocumentation'></button>"
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
                    }

                    $.ajax({
                        url: url, data: newRecord, success: function (results) {
                            alert("Saved");
                            // w2popup.close();
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
            $(document).on('click', "#categorygenerateDescription", function () {
                let clsid = w2ui.CategoryEditDoc.record.name;
                let url = `category/generate?target=Description&id=${clsid}`;
                w2ui.CategoryEditDoc.lock('Generating...', true);
                w2ui.CategoryEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        $('html').css('cursor', 'auto');
                        w2ui.CategoryEditDoc.unlock('Generated', true);
                        w2ui.CategoryEditDoc.record = results;
                        w2ui.CategoryEditDoc.refresh();
                        w2ui.CategoryEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
            $(document).on('click', "#categorygenerateDocumentation", function () {
                let clsid = w2ui.CategoryEditDoc.record.name;
                let url = `category/generate?target=Documentation&id=${clsid}`;
                w2ui.CategoryEditDoc.lock('Gen AI. Generating...', true);
                w2ui.CategoryEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        w2ui.CategoryEditDoc.unlock('document', true);
                        w2ui.CategoryEditDoc.record.document = results;
                        w2ui.CategoryEditDoc.refresh();
                        $('html').css('cursor', 'auto');
                        w2ui.CategoryEditDoc.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
        })
    }
}

function _createCategoryEditSubcategories(record, setURL) {
    let config = {
        name: "CategoryEditSubcategories",
        title: "Subcategories",
        generateURL: 'category/generate?target=Subcategories',
        tab: 'subcategories',
        edit: ACategory.editDocs,
        editURL: 'category/get',
        saveURL: "category/save",
        attribute: 'subcategories',
        columns: [
            {
                field: 'name',
                caption: 'Name',
                size: '30%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.name || name;
                }
            },
            {
                field: 'description',
                caption: 'Description',
                size: '70%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.description;
                }
            },
        ]
    }
    _createCharacteristicGrid(config);
}

function _createCategoryEditWorkFlows(record, setURL) {
    let config = {
        name: "CategoryEditWorkFlows",
        title: "WorkFlows",
        generateURL: 'category/generate?target=WorkFlows',
        tab: 'workflows',
        edit: AWorkFlow.editDocs,
        editURL: 'workflow/get',
        saveURL: "workflow/save",
        attribute: 'workflows',
        columns: [
            {
                field: 'name',
                caption: 'Name',
                size: '30%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.name || name;
                }
            },
            {
                field: 'description',
                caption: 'Description',
                size: '70%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.description;
                }
            },
        ]
    }
    _createCharacteristicGrid(config);
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
                    {id: 'generate', type: 'button', img: 'aibutton'}
                ],
                onClick(event) {
                    if (event.target === 'generate') {
                        let clsid = w2ui[config.name].record.name;
                        let url = `${config.generateURL}&id=${clsid}`;
                        w2ui[config.name].lock('Generating...', true);
                        w2ui[config.name].refresh();
                        $('html').css('cursor', 'wait');
                        $.ajax({
                            url: url,
                            success: function (results) {
                                w2ui[config.name].unlock();
                                w2ui[config.name].record = results.category;
                                $('html').css('cursor', 'auto');
                                let changeInfo = "Ailtire Generated the following:\n";
                                changeInfo += results.changes.map(obj => obj.name).join('\n');
                                alert(changeInfo);
                                w2ui.CategoryEditTabs.click(config.tab);
                            },
                            failure: function (results) {
                                console.error(results);
                            }
                        });
                    }
                }
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
                // Open the Episode Edit Dialog
                let records = w2ui[config.name].records;
                let rec = null;
                for (let j in records) {
                    if (records[j].recid === change.recid) {
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
                }, 10);
            },
            columns: config.columns,
        });
        w2ui[config.name].on('dblClick', function(event) {
            let record = this.get(event.recid);
            // THis is where we need to open up another window to show details of what was clicked on.
            if(config.edit && config.editURL) {
                $.ajax({
                    url: `${config.editURL}?id=${record.name}`,
                    success: function(results) {
                        config.edit(results, config.saveURL);
                    }
                });
            }
        });
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
                    url: object.link2d + "&diagram=category",
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
            type: 'button', id: 'workflow', text: 'All', img: 'w2ui-icon-search', onClick: (event) => {
                // 2D
                div.innerHTML = "Fetching UML diagrams";
                $.ajax({
                    url: object.link2d + "&diagram=category",
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

function _processCategoryList(parent, workflows, subcategories) {
    for (let wi in workflows) {
        let workflow = workflows[wi];
        let wname = workflow.name.replace(/\s/g, '');
        let node = {
            id: wname,
            text: workflow.name,
            img: 'ailtire-workflow',
            link: `workflow/get?id=${wname}`,
            link2d: `workflow/uml?id=${wname}`,
            view: 'workflow',
        };
        parent.push(node);
    }
    for (let si in subcategories) {
        let subcat = subcategories[si];
        let slist = subcat.prefix.split('/');
        let sname = slist.pop();
        let subName = subcat.name || sname;
        let pnode = {
            id: sname,
            text: subName,
            img: 'icon-folder',
            link: `category/get?id=${sname}`,
            link2d: `category/uml?id=${sname}`,
            view: 'category',
            nodes: []
        };
        parent.push(pnode);
        _processCategoryList(pnode.nodes, subcat.workflows, subcat.subcategories);
    }
}

function layoutRowColumn(parentNode, nodes, size, direction) {
    let prevNode = parentNode;
    let row = 0;
    let col = 0;
    let bbox = {
        x: {min: -parentNode.cube.x / 2, max: parentNode.cube.x / 2},
        y: {min: -parentNode.cube.y / 2, max: parentNode.cube.y / 2},
        z: {min: -parentNode.cube.z / 2, max: parentNode.cube.z / 2},
    }


    for (let i in nodes) {
        let node = nodes[i];
        // Make sure I have the right number of rows.
        if (row >= size.box.rows) {
            row = 0;
            col++;
        }
        if (direction === 'top') {
            let offset = {
                w: Math.max(parentNode.cube.x / (size.box.cols + 1), size.stats.w.max) * 1.10,
                h: Math.max(parentNode.cube.z / (size.box.rows + 1), size.stats.h.max) * 1.10
            }
            node.rbox = {
                parent: prevNode.id,
                fx: bbox.x.min + offset.w / 2 + (col * offset.w),
                fy: bbox.y.max,
                fz: bbox.z.max - offset.h / 2 - (row * offset.h),
            }
        } else if (direction === 'bottom') {
            let offset = {
                w: Math.max(parentNode.cube.x / (size.box.cols + 1), size.stats.w.max) * 1.10,
                h: Math.max(parentNode.cube.z / (size.box.rows + 1), size.stats.h.max) * 1.10
            }
            node.rbox = {
                parent: prevNode.id,
                fx: bbox.x.min + offset.w / 2 + (col * offset.w),
                fy: bbox.y.min - 30,
                fz: bbox.z.max - offset.h / 2 - (row * offset.h),
            }
        } else if (direction === 'right') {
            let offset = {
                w: parentNode.cube.z / (size.box.cols + 1),
                h: parentNode.cube.y / (size.box.rows + 1),
            }
            node.rbox = {
                parent: prevNode.id,
                fx: bbox.x.max,
                fy: bbox.y.max - offset.h / 2 - (row * offset.h),
                fz: bbox.z.max - offset.w / 2 - (col * offset.w),
            }
        } else if (direction === 'left') {
            let offset = {
                w: Math.max(parentNode.cube.z / (size.box.cols + 1), size.stats.w.max) * 1.10,
                h: Math.max(parentNode.cube.y / (size.box.rows + 1), size.stats.h.max) * 1.10
            }
            node.rbox = {
                parent: prevNode.id,
                fx: bbox.x.min - size.stats.d.max,
                fy: bbox.y.max - offset.h / 2 - (row * offset.h),
                fz: bbox.z.max - offset.w / 2 - (col * offset.w),
            }
        } else if (direction === 'back') {
            let offset = {
                w: Math.max(parentNode.cube.x / (size.box.cols + 1), size.stats.w.max) * 1.10,
                h: Math.max(parentNode.cube.y / (size.box.rows + 1), size.stats.h.max) * 1.10
            }
            node.rbox = {
                parent: prevNode.id,
                fx: bbox.x.max - offset.w / 2 - (col * offset.w),
                fz: bbox.z.min,
                fy: bbox.y.max - offset.h / 2 - (row * offset.h),
            }
        } else if (direction === 'front') {
            let offset = {
                w: Math.max(parentNode.cube.x / (size.box.cols + 1), size.stats.w.max) * 1.10,
                h: Math.max(parentNode.cube.y / (size.box.rows + 1), size.stats.h.max) * 1.10
            }
            node.rbox = {
                parent: prevNode.id,
                fx: bbox.x.min + offset.w / 2 + (col * offset.w),
                fz: bbox.z.max,
                fy: bbox.y.min + offset.h / 2 + (row * offset.h),
            }
        }
        row++;
    }
    return;
}
