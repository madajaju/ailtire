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
    AText,
    AActivity,
    AActivityRun,
    ASwimlane,
    AFlowCondition,
    AScenario,
    AUsecase,
    AObject
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

export default class AWorkFlow {
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

        let height = nameArray.length * AWorkFlow.default.fontSize * 2;
        let width = maxLetters * (AWorkFlow.default.fontSize / 1.5);
        let depth = AWorkFlow.default.depth;
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
        const size = AWorkFlow.calculateBox(node);
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
        const box1Obj = new THREE.Mesh(new THREE.BoxGeometry(size.w, size.h / 3, size.d), material);
        const box2Obj = new THREE.Mesh(new THREE.BoxGeometry(size.w, size.h / 3, size.d), material);
        const box3Obj = new THREE.Mesh(new THREE.BoxGeometry(size.w, size.h / 3, size.d), material);
        box1Obj.position.set(0, 0, 0);
        box2Obj.position.set(0, -size.h / 2.8, 0);
        box3Obj.position.set(0, size.h / 2.8, 0);
        group.add(box1Obj);
        group.add(box2Obj);
        group.add(box3Obj);

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
        node.expandLink = `statenet/get?id=${node.id}`;
        node.expandView = AWorkFlow.handle;
        node.getDetail = AWorkFlow.getDetail;

        return group;
    }

    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                AWorkFlow.showDetail(results);
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
        // The name is the same as the id on workflows.
        // It needs to be set.
        results.id = results.name;
        AWorkFlow.viewDeep3D(results, config);
        AWorkFlow.showDetail(results);
        AMainWindow.currentView = "workflow";
        let form = AWorkFlow._simulationForm(results);
        w2ui['bottomLayout'].html('main', form);

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
                    AWorkFlow.viewDeep3D(results, {mode: 'explode'});
                }
            }
        ]);
    }

    static handleEvent(event, workflow, message) {
        let [eventB, eventS] = event.split('.');
        let color = scolor[eventS];
        if (eventB === "workflow") {
            w2ui['WorkflowSimulation'].header = workflow.name + " " + eventS;
            window.graph.setNodeAndFocus(workflow.name, {color: color});
        } else if (eventB === "activity") {
            AActivityRun.handleEvent(eventS, workflow, message);
        }
        /*if (eventB === "scenario") {
            let scenario = workflow;
            let selectedNode = window.graph.getSelectedNode();
            if (eventS === "started") {
                AScenario.viewDeep3D(scenario, "add", selectedNode);
            } else {
                window.graph.setNode(scenario.id, {color: scolor[eventS]});
            }
        } else if (eventB === "step") {
            let scenario = workflow;
            window.graph.setNode(scenario.id + '-' + scenario.currentstep, {color: scolor[eventS]});
        } else {
            let object = workflow;
            if(typeof object === 'object') {
                let selectedNode = window.graph.getSelectedNode();
                AObject.addObject(object, selectedNode);
            }
        }
        */

        w2ui['WorkflowSimulation'].refresh();
        w2ui['bottomLayout'].html('main', w2ui['WorkflowSimulation']);
    }

    static _simulationForm(results) {
        // Scenario List for simulation.
        let records = [];
        if (!w2ui['WorkflowSimulation']) {
            $().w2grid({
                name: 'WorkflowSimulation',
                show: {header: false, columnHeaders: false, toolbar: true},
                columns: [
                    {
                        field: 'type',
                        caption: 'Type',
                        size: '2%',
                        attr: "align=right",
                        sortable: true
                    },
                    {
                        field: 'name',
                        caption: 'Activity',
                        size: '15%',
                        attr: "align=right",
                        sortable: true
                    },
                    {
                        field: 'id',
                        caption: 'ID',
                        size: '8%',
                        attr: "align=left",
                    },
                    {
                        field: 'inputs',
                        caption: 'Inputs',
                        size: '30%',
                        attr: "align=left",
                    },
                    {
                        field: 'outputs',
                        caption: 'Outputs',
                        size: '30%',
                        attr: "align=left",
                    },
                    {
                        field: 'startTime',
                        caption: 'Start',
                        size: '5%',
                        render: function (record) {
                            if (record.startTime) {
                                let date = new Date(record.startTime);
                                let time =   ('0' + date.getHours()).slice(-2) + ':' +
                                    ('0' + date.getMinutes()).slice(-2) + ':' +
                                    ('0' + date.getSeconds()).slice(-2);
                                let d = ('0' + date.getDate()).slice(-2) + '/' +
                                    ('0' + (date.getMonth() + 1)).slice(-2) + '/' +
                                    date.getFullYear();
                                return time + ' ' + d;
                            } else {
                                return "";
                            }
                        }
                    },
                    {
                        field: 'finishedTime',
                        caption: 'End',
                        size: '5%',
                        render: function (record) {
                            if (record.finishedTime) {
                                let date = new Date(record.finishedTime);
                                let time =   ('0' + date.getHours()).slice(-2) + ':' +
                                    ('0' + date.getMinutes()).slice(-2) + ':' +
                                    ('0' + date.getSeconds()).slice(-2);
                                let d = ('0' + date.getDate()).slice(-2) + '/' +
                                    ('0' + (date.getMonth() + 1)).slice(-2) + '/' +
                                    date.getFullYear();
                                return time + ' ' + d;
                            }
                            return '';
                        }
                    },
                    {
                        field: 'duration',
                        caption: 'Duration',
                        size: '5%',
                        render: function (record) {
                            if (record.finishedTime && record.startTime) {
                                let date = new Date(record.finishedTime);
                                let startTime = new Date(record.startTime);
                                return `${(date - startTime)/1000}s`;
                            } else {
                                return "";
                            }
                        }
                    }

                ],
                onClick: function (event) {
                    let workflow = w2ui['WorkflowSimulation'].workflow;
                    let instance = w2ui['WorkflowSimulation'].workflowInstance;
                    // Select the Activity if the Activity Run
                    if (event.column === 1) {
                        let records = w2ui['WorkflowSimulation'].records;
                        for (let i in records) {
                            let record = records[i];
                            if (record.recid === event.recid) {
                                window.graph.selectNodeByID(record.name.replaceAll(/\s/g, ''));
                                break;
                            }
                        }
                    } else {
                        AActivityRun.selectNode(event.recid);
                    }
                    $.ajax({
                        url: `workflow/instance?id=${workflow.id}`,
                        success: (result) => {
                            // Popup with the stdout and stderr
                            if (!instance) { // Get the last one run
                                instance = result.length - 1;
                            }
                            let text = result[instance].activities[event.recid];
                            AWorkFlow.popup(text);
                        }
                    })
                },
                toolbar: {
                    items: [
                        {id: 'launch', type: 'button', caption: 'Launch Workflow', icon: 'w2ui-icon-plus'},
                        {type: 'break'},
                        {
                            id: 'workflowname',
                            type: 'html',
                            html: '<span style="background-color: #004488; color: white;padding:5px;">Not Selected</span>'
                        }
                    ],
                    onClick: function (event) {
                        if (event.target === 'launch') {
                            let workflow = w2ui['WorkflowSimulation'].workflow;
                            // If there aren't any inputs then launch it.
                            if (!workflow.activities.Init.inputs) {
                                $.ajax({
                                    url: `workflow/launch?id=${workflow.id}`,
                                    success: function (result) {
                                        w2ui['WorkflowSimulation'].workflowInstance = result.id;
                                        // Clear out the WorkflowSimulation
                                        w2ui['WorkflowSimulation'].clear();
                                        // Clear out the previous run by removing the nodes from the graph
                                        AActivityRun.clear();
                                    }
                                });
                            } else {
                                // create a simple dialog with the inputs and the onClick should call the scenario
                                // With the parametersEdit
                                AWorkFlow.inputPopup(workflow, workflow.activities.Init);
                                // Clear out the WorkflowSimulation
                                w2ui['WorkflowSimulation'].clear();
                                AActivityRun.clear();
                            }
                        }
                    }
                }
            });
        }
        let i = 0;
        for (let aname in results.activities) {
            let activity = results.activities[aname];
            // If the activity is an array they we need to add each in the array
            if (Array.isArray(activity)) {
                for (let k in activity) {
                    let parameters = activity[k].inputs;
                    let params = [];
                    for (let j in parameters) {
                        params.push(`${j}: ${parameters[j]}`);
                    }
                    let outputs = [];
                    for (let j in activity[k].outputs) {
                        outputs.push(`${j}: ${activity[k].outputs[j]}`);
                    }
                    let color = scolor[activity[k].state] || '#ff8844';
                    records.push({
                        recid: i++,
                        name: aname,
                        state: activity[k].state,
                        id: activity[k].id,
                        type: 'instance',
                        inputs: params.join(','),
                        outputs: outputs.join(','),
                        finishedTime: activity[k].finishedTime,
                        startTime: activity[k].startTime,
                        "w2ui": {"style": `background-color: ${color};`}
                    });
                }
            } else {
                let parameters = results.activities[aname].inputs;
                let params = [];
                for (let j in parameters) {
                    params.push(`${j}: ${parameters[j].type}`);
                }
                records.push({
                    recid: i++,
                    id: aname,
                    name: aname,
                    type: results.activities[aname].type,
                    inputs: params.join(',')
                });
            }
        }
        w2ui['WorkflowSimulation'].workflow = results;
        w2ui['WorkflowSimulation'].records = records;
        w2ui['WorkflowSimulation_toolbar'].set('workflowname', {html: `<span style="background-color: #2391dd; padding:5px;">${results.name}</span>`});
        w2ui['WorkflowSimulation'].refresh();
        return w2ui.WorkflowSimulation;
    }

    static handleList(result) {
        AWorkFlow.viewList3D(result, 'new');
        AWorkFlow.showListDetail(result);
    }

    static viewList3D(result) {
        let data = {nodes: {}, links: []};

        for (let wname in result) {
            let item = result[wname];
            data.nodes[wname] = {
                id: wname,
                name: item.name,
                description: item.description,
                view: AWorkFlow.view3D
            }
            for (let aname in item.activities) {
                let activity = item.activities[aname];
                if (activity.type === "workflow") {
                    data.links.push({target: wname, source: aname, value: 30, width: 2});
                }
            }
        }
        window.graph.setData(data.nodes, data.links);
        window.graph.showLinks();
    }

    static showList(panel, parent) {
        $.ajax({
            url: 'WorkFlow/list',
            success: function (results) {
                let items = [];
                let prefixNodes = {};
                _processCategoryList(items, results.workflows, results.subcategories);
                w2ui[panel].add(parent, items);
            }
        });
    }

    static showInstances(panel) {
        $.ajax({
            url: 'workflow/instances',
            success: function (results) {
                let form = _showWorkInstanceList(results);
                w2ui['bottomLayout'].html('left', form);
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

    static viewDeep3D(workflow, opts, parent) {
        let initNode = undefined;
        let data = {nodes: {}, links: []};
        let swimlanes = {};
        let cindex = 0;
        let idprefix = "";
        if (parent) {
            idprefix = `${parent.id}.`;
        }

        for (let aname in workflow.activities) {
            let activity = workflow.activities[aname];
            activity.name = aname;
            let containerID = undefined;
            // Add the swimlane Nodes.
            // The map prevents the swimlane from being added more than once.
            if (activity.package) {
                containerID = idprefix + activity.package;
                data.nodes[containerID] = {
                    id: containerID,
                    name: activity.package,
                    description: `Package: ${activity.package}`,
                    type: 'package',
                    view: ASwimlane.view3D
                }
            } else if (activity.actor) {
                containerID = idprefix + activity.actor;
                data.nodes[containerID] = {
                    id: containerID,
                    name: activity.actor,
                    description: `Actor: ${activity.actor}`,
                    type: 'actor',
                    view: ASwimlane.view3D
                }
            } else {
                containerID = idprefix + "_CatchAllSwimlane";
                data.nodes[containerID] = {
                    id: containerID,
                    name: "Undefined",
                    description: "",
                    view: ASwimlane.view3D
                }
            }
            // Add the activity Node.
            let aid = idprefix + aname.replace(/\s/g, '');
            data.nodes[aid] = {
                id: aid,
                name: aname,
                detail: activity.description,
                view: AActivity.view3D,
                object: activity,
                rbox: {
                    parent: containerID,
                },
            }
            // Store the activity in a swimlane map so we can orient the nodes later.
            if (!swimlanes.hasOwnProperty(containerID)) {
                swimlanes[containerID] = {
                    color: AWorkFlow.colors[cindex++],
                    size: {},
                    children: new Array()
                }
            }
            swimlanes[containerID].children.push(data.nodes[aid]);
            // If next is empty then this is a terminal state.
            // Connect to the parent node.
            if (!activity.next && parent) {
                data.links.push({source: aid, target: parent.id, width: 1, value: 40, color: "#aaffff"});
            }

            // Now get the next activity to determine the Kind of link.
            for (let nname in activity.next) {
                let next = activity.next[nname];
                let nid = idprefix + nname.replace(/\s/g, '');
                if (next.condition) {
                    let cid = idprefix + next.condition.test.replace(/\s/g, '');
                    if (!data.nodes.hasOwnProperty(cid)) {
                        data.nodes[cid] = {
                            id: cid,
                            name: next.condition.test,
                            description: next.condition.test,
                            view: AFlowCondition.view3D,
                        };
                        swimlanes[containerID].children.push(data.nodes[cid]);

                        data.links.push({
                            target: cid,
                            source: aid,
                            value: 1,
                            width: 2,
                            relpos: 1,
                            arrow: 30,
                        });
                    }
                    data.links.push({
                        target: nid,
                        source: cid,
                        value: 10,
                        width: 2,
                        name: `[${next.condition.value}]`,
                        relpos: 1,
                        arrow: 30,
                    });
                } else {
                    data.links.push({
                        target: nid,
                        source: aid,
                        value: 10,
                        width: 2,
                        relpos: 1,
                        arrow: 30,
                    });
                }
            }
        }
        if (data.nodes.hasOwnProperty(idprefix + "Init") && parent) {
            data.links.push({target: idprefix + "Init", source: parent.id, width: 1, value: 40, color: "#aaffff"});
        }
        // Now calculate the width of the swimlanes based on the number of items
        let yoffset = 0; // Object.keys(swimlanes).length/2 * ;
        let maxSize = {w: 0, h: 0, d: 0};
        for (let sname in swimlanes) {
            let swimlane = swimlanes[sname];
            let children = swimlane.children;
            let size = ASwimlane.calculateBox({name: sname, children: children});
            swimlane.size = size;
            maxSize.w = Math.max(maxSize.w, size.w);
            maxSize.h = Math.max(maxSize.h, size.h);
            maxSize.d = Math.max(maxSize.d, size.d);
        }
        for (let sname in swimlanes) {
            let swimlane = swimlanes[sname];
            let children = swimlane.children;
            data.nodes[sname].color = swimlane.color;
            data.nodes[sname].w = maxSize.w;
            data.nodes[sname].d = maxSize.d;
            data.nodes[sname].h = maxSize.h;
            data.nodes[sname].children = children;
            if (parent) {
                data.nodes[sname].rbox = {
                    parent: parent.id,
                    fx: -maxSize.w / 2,
                    fy: yoffset,
                    fz: -600,
                };
            } else {
                data.nodes[sname].fx = -maxSize.w / 2;
                data.nodes[sname].fy = yoffset;
                data.nodes[sname].fz = 0;
            }
            swimlane.size = maxSize;
            let size = swimlane.size;
            for (let i in children) {
                let cnode = children[i];
                let csize = AActivity.calculateBox(cnode);
                if (cnode.name === 'Init') { // This is a starting node.
                    initNode = cnode;
                    cnode.rbox = {
                        parent: sname,
                        // Need to add some buffer for the title on the min side of x.
                        fx: -(size.w / 2 - csize.w / 2 - ASwimlane.default.fontSize * 4),
                        fy: size.h / 2 - csize.h / 2,
                        // z: {min: -(size.d/2 - csize.d/2), max: (size.d/2 -csize.d/2)},
                        fz: size.d / 2 + csize.d / 2
                    }
                } else if (cnode.object && !cnode.object.next) { // This is a terminal node.
                    cnode.rbox = {
                        parent: sname,
                        // Need to add some buffer for the title on the min side of x.
                        x: {
                            min: 0,
                            max: (size.w / 2 - csize.w / 2)
                        },
                        y: {min: -(size.h / 2 - csize.h / 2), max: 0},
                        // z: {min: -(size.d/2 - csize.d/2), max: (size.d/2 -csize.d/2)},
                        fz: size.d / 2 + csize.d / 2
                    }
                } else {
                    cnode.rbox = {
                        parent: sname,
                        // Need to add some buffer for the title on the min side of x.
                        x: {
                            min: -(size.w / 2 - csize.w / 2 - ASwimlane.default.fontSize * 4),
                            max: (size.w / 2 - csize.w / 2)
                        },
                        y: {min: -(size.h / 2 - csize.h / 2), max: (size.h / 2 - csize.h / 2)},
                        // z: {min: -(size.d/2 - csize.d/2), max: (size.d/2 -csize.d/2)},
                        fz: size.d / 2 + csize.d / 2
                    }
                }
            }
            yoffset -= maxSize.h + 10;
        }
        window.graph.graph.cameraPosition({
                x: -maxSize.w / 2,
                y: -maxSize.h / 2,
                z: 1000
            }, // new position
            {x: -maxSize.w / 2, y: -maxSize.h / 2, z: 0},
            1000  // ms transition duration.
        );
        if (opts.mode === 'new') {
            window.graph.setData(data.nodes, data.links);
        } else {
            window.graph.addData(data.nodes, data.links);
        }
        window.graph.showLinks();
        if (opts.mode === 'explode') {
            let links = [];
            for (let aname in workflow.activities) {
                let activity = workflow.activities[aname];
                let aid = idprefix + aname.replace(/\s/g, '');
                if (activity.type === "scenario") {
                    $.ajax({
                        url: `scenario/get?id=${activity.obj.id}`,
                        success: (results) => {
                            AScenario.viewDeep3D(results, "add", data.nodes[aid]);
                        }
                    });
                } else if (activity.type === "usecase") {
                    $.ajax({
                        url: `usecase/get?id=${activity.name}`,
                        success: (results) => {
                            AUsecase.viewDeep3D(results, "add", data.nodes[aid]);
                        }
                    });
                } else if (activity.type === "workflow") {
                    $.ajax({
                        url: `workflow/get?id=${activity.name}`,
                        success: (results) => {
                            AWorkFlow.viewDeep3D(results, {mode: "explode"}, data.nodes[aid]);
                        }
                    });
                }
            }
            window.graph.addData({}, links);
            window.graph.showLinks();
        }
    }

    static inputForm(workflow, activity) {
        let fields = [];
        let record = {};
        let inputs = activity.inputs;
        for (let name in inputs) {
            let input = inputs[name];
            let ivalue = inputs[name];
            if (input.type === 'date') {
                fields.push({
                    field: name,
                    type: 'date',
                    required: input.required,
                    html: {label: name}
                });
            } else if (input.type === "boolean") {
                fields.push({
                    field: name,
                    type: 'checkbox',
                    required: input.required,
                    html: {label: name}
                });
            } else if (input.size) {
                fields.push({
                    field: name,
                    type: 'textarea',
                    required: input.required,
                    html: {
                        label: name,
                        attr: `size="${input.size}" style="width:300px; height:${(input.size / 80) * 12}px"`
                    }
                });
            } else {
                fields.push({
                    field: name,
                    type: 'text',
                    required: input.required,
                    html: {label: name, attr: `size="50" style="width:300px"`}
                });
            }

            if (typeof ivalue !== "object") {
                record[name] = ivalue;
            } else {
                record[name] = "";
            }
        }
        $().w2form({
            name: 'WorkflowInput',
            style: 'border: 0px; background-color: transparent;',
            fields: fields,
            actions: {
                Save: {
                    caption: "Launch", style: "background: #aaffaa",
                    onClick(event) {
                        w2popup.close();
                        let parameters = w2ui['WorkflowInput'].record;
                        let parameterArray = [];
                        let data = {};
                        /* for(let pname in parameters) {
                            parameterArray.push(`${pname}=${parameters[pname]}`);
                        }
                        */
                        for (let pname in parameters) {
                            data[pname] = parameters[pname];
                        }
                        $.ajax({
                            url: `workflow/launch?id=${workflow.id}`,
                            type: "POST",
                            data: JSON.stringify(data),
                            contentType: "application/json",
                            success: function (result) {
                                window.graph.graph.cameraPosition({
                                        x: 1500,
                                        y: 0,
                                        z: -500,
                                    }, // new position
                                    {x: 0, y: 0, z: -500},
                                    3000  // ms transition duration.
                                );
                            }
                        });
                    }
                },
                custom: {
                    caption: "Close", style: 'background: pink;',
                    onClick(event) {
                        w2popup.close();
                    }
                }
            }
        });
        return w2ui['WorkflowInput'];
    }

    static inputPopup(workflow, activity) {
        let myForm = AWorkFlow.inputForm(workflow, activity);

        $().w2popup('open', {
            title: 'Workflow Inputs',
            body: '<div id="WorkflowPopup" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 700,
            height: 700,
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editModelDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.workflowInput.box).show();
                    w2ui.workflowInput.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler,
                    // which would make this code execute too early and hence not deliver.
                    $('#WorkflowPopup').w2render(myForm.name);
                }
            }
        });
    }

    static editDocs(results, setURL) {
        let editForm = getEditForm(results, setURL);
        w2popup.open({
            height: 850,
            width: 850,
            title: `Edit ${results.name}`,
            body: '<div id="editWorkflowDocDialog" style="width: 100%; height: 100%;"></div>',
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editWorkflowDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.WorkflowDialog.box).show();
                    w2ui.WorkflowDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    $('#editWorkflowDocDialog').w2render(editForm.name);
                    w2ui.WorkflowEditTabs.click('docs');
                }
            }
        })
    }
}

function getEditForm(record, setURL) {
    if (!w2ui['WorkflowEditGeneral']) {
        $().w2layout({
            name: 'WorkflowEditGeneral',
            panels: [
                {type: 'left', size: 150, resizable: true, minSize: 35},
                {type: 'main', overflow: 'hidden'}
            ],
            onRender: (event) => {
                if (event.target === 'WorkflowEditGeneral') {
                    if (w2ui.WorkflowEditGeneral.record) {
                        w2ui.WorkflowEditGeneral.record = {};
                    }
                }
            }
        });
    }
    if (!w2ui['WorkflowEditTabs']) {
        $().w2sidebar({
            name: 'WorkflowEditTabs',
            flatButton: true,
            nodes: [
                {id: 'docs', text: 'Docs', selected: true},
                {id: 'activities', text: 'Activities'},
            ],
            onClick(event) {
                switch (event.target) {
                    case 'docs':
                        w2ui['WorkflowEditGeneral'].html('main', w2ui.WorkflowEditDoc);
                        break;
                    case 'activities':
                        w2ui['WorkflowEditGeneral'].html('main', w2ui.WorkflowEditActivities);
                        break;
                }
            }
        });
    }
    _createWorkflowEditDoc(record, setURL);
    _createWorkflowEditActivities(record, setURL);

    w2ui['WorkflowEditDoc'].record = record;
    w2ui['WorkflowEditActivities'].record = record;

    w2ui['WorkflowEditGeneral'].saveURL = setURL;
    w2ui.WorkflowEditGeneral.html('left', w2ui.WorkflowEditTabs);
    w2ui.WorkflowEditGeneral.html('main', w2ui.WorkflowEditDoc);
    return w2ui['WorkflowEditGeneral'];
}

function _createWorkflowEditDoc(record, setURL) {
    if (!w2ui.WorkflowEditDoc) {
        $().w2form({
            name: 'WorkflowEditDoc',
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
                            "<br><button class=AIButton id='workflowgenerateDescription'></button>"
                    }
                },
                {
                    caption: 'Pre Condition',
                    field: 'precondition',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 150px;"',
                        caption: "Pre Condition" +
                            "<br><button class=AIButton id='workflowgenerateDescription'></button>"
                    }
                },
                {
                    caption: 'Post Condition',
                    field: 'postcondition',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 150px;"',
                        caption: "Post Condition" +
                            "<br><button class=AIButton id='workflowgenerateDescription'></button>"
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
            $(document).on('click', "#workflowgenerateDescription", function () {
                let clsid = w2ui.WorkflowEditDoc.record.name;
                let url = `workflow/generate?target=Description&id=${clsid}`;
                w2ui.WorkflowEditDoc.lock('Generating...', true);
                w2ui.WorkflowEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        $('html').css('cursor', 'auto');
                        w2ui.WorkflowEditDoc.unlock('Generated', true);
                        w2ui.WorkflowEditDoc.record = results;
                        w2ui.WorkflowEditDoc.refresh();
                        w2ui.WorkflowEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
        })
    }
}


function _createWorkflowEditActivities(record, setURL) {
    let config = {
        name: "WorkflowEditActivities",
        title: "Activities",
        generateURL: 'workflow/generate?target=Activities',
        tab: 'activities',
        saveURL: "workflow/save",
        attribute: 'activities',
        columns: [
            {
                field: 'name',
                caption: 'Name',
                size: '20%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.name || name;
                }
            },
            {
                field: 'actor',
                caption: 'Actor',
                size: '10%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.actor;
                }
            },
            {
                field: 'package',
                caption: 'Package',
                size: '10%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.actor;
                }
            },
            {
                field: 'next',
                caption: 'Next',
                size: '20%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    if (value.next) {
                        return Object.keys(value.next).join(', ');
                    }
                    return '';
                }
            },
            {
                field: 'description',
                caption: 'Description',
                size: '40%',
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

function _showWorkInstanceList(instances) {
    if (!w2ui['WorkFlowInstanceList']) {
        $().w2grid({
            name: 'WorkFlowInstanceList',
            header: 'Workflow Instances',
            show: {
                header: false,
                columnHeaders: false,
                toolbar: true,
            },
            columns: [
                {
                    field: 'state',
                    caption: 'State',
                    size: '10%',
                    sortable: true,
                    render: function(record) {
                        if(record.state === 'inprogress') {
                            return "<button class=w2ui-icon-reload></button><button class=w2ui-icon-info></button>";
                        }
                        return "<button class=w2ui-icon-check></button><button class=w2ui-icon-info></button>";
                    }
                },
                {
                    field: 'name',
                    caption: 'Instance',
                    size: '45%',
                    sortable: true
                },
                {
                    field: 'startTime',
                    caption: 'Start',
                    size: '15%',
                    render: function (record) {
                        if (record.startTime) {
                            let date = new Date(record.startTime);
                            let time =   ('0' + date.getHours()).slice(-2) + ':' +
                                ('0' + date.getMinutes()).slice(-2) + ':' +
                                ('0' + date.getSeconds()).slice(-2);
                            let d = ('0' + date.getDate()).slice(-2) + '/' +
                                ('0' + (date.getMonth() + 1)).slice(-2) + '/' +
                                date.getFullYear();
                            return time + ' ' + d;
                        } else {
                            return "";
                        }
                    }
                },
                {
                    field: 'finishedTime',
                    caption: 'End',
                    size: '15%',
                    render: function (record) {
                        if (record.finishedTime) {
                            let date = new Date(record.finishedTime);
                            let time =   ('0' + date.getHours()).slice(-2) + ':' +
                                ('0' + date.getMinutes()).slice(-2) + ':' +
                                ('0' + date.getSeconds()).slice(-2);
                            let d = ('0' + date.getDate()).slice(-2) + '/' +
                                ('0' + (date.getMonth() + 1)).slice(-2) + '/' +
                                date.getFullYear();
                            return time + ' ' + d;
                        }
                        return '';
                    }
                },
                {
                    field: 'duration',
                    caption: 'Duration',
                    size: '10%',
                    render: function (record) {
                        if (record.finishedTime && record.startTime) {
                            let date = new Date(record.finishedTime);

                            let startTime = new Date(record.startTime);
                            return `${(date - startTime)/1000}s`;
                        } else {
                            return "";
                        }
                    }
                }
            ],
            onClick(event) {
                // Get the instance
                let record = this.get(event.recid);
                AWorkFlow._simulationForm(record.instance);
            }
        });
    }
    let records = [];
    for (let wname in instances) {
        for (let i in instances[wname]) {
            let record = {};
            record.recid = `${wname}${i}`;
            record.name = instances[wname][i].name;
            record.state = instances[wname][i].state;
            record.startTime = instances[wname][i].startTime;
            record.finishedTime = instances[wname][i].finishedTime;
            let color = scolor[record.state] || '#ff8844';
            record.w2ui = {"style": `background-color: ${color}`}
            record.instance = instances[wname][i];
            records.push(record);
        }
    }
    w2ui['WorkFlowInstanceList'].records = records;
    return w2ui['WorkFlowInstanceList'];
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
                                w2ui[config.name].record = results;
                                $('html').css('cursor', 'auto');
                                w2ui.WorkflowEditTabs.click(config.tab);
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
                    url: object.link2d + "&diagram=workflow",
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
                    url: object.link2d + "&diagram=workflow",
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
            type: 'button', id: 'data', text: 'Data Flow', img: 'w2ui-icon-search', onClick: (event) => {
                // 2D
                div.innerHTML = "Fetching UML diagrams";
                $.ajax({
                    url: object.link2d + "&diagram=dataflow",
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
        if(workflow) {
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