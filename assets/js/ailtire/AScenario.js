import {AMainWindow, AText, APackage, AModel, AAction, AObject, ASelectedHUD, AActor} from "./index.js";

const scolor = {
    started: "#00ffff",
    create: "#00ffff",
    completed: "#00ff00",
    failed: "#ff0000",
    enabled: "#00ff00",
    disable: "#aaaaaa",
    rejected: "#ff0000",
    accepted: "#00aaaa",
    update: "#00aaaa",
    needed: "#ffbb44",
    selected: "#00ff00",
    evaluated: "#ffff00",
};

export default class AScenario {

    constructor(config) {
        this.config = config;
    }

    static default = {
        fontSize: 16,
        height: 50,
        width: 100,
        depth: 20,
    }

    static inputPopup(scenario) {
        let myForm = AScenario.inputForm(scenario);

        $().w2popup('open', {
            title: 'Scenario Inputs',
            body: '<div id="ScenarioPopup" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editModelDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.editModelDialog.box).show();
                    w2ui.editModelDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler,
                    // which would make this code execute too early and hence not deliver.
                    $('#ScenarioPopup').w2render(myForm.name);
                }
            }
        });
    }

    static popup(record) {
        let myForm = AScenario.stdioForm(record);

        $().w2popup('open', {
            title: 'Edit',
            body: '<div id="ScenarioPopup" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 1000,
            height: 600,
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editModelDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.editModelDialog.box).show();
                    w2ui.editModelDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    $('#ScenarioPopup').w2render(myForm.name);
                }
            }
        });
    }

    static calculateBox(node) {
        let nameArray = node.name.split(/\s/).map(item => {
            return item.length;
        });
        let maxLetters = nameArray.reduce(function (a, b) {
            return Math.max(a, b);
        }, -Infinity);
        let height = (nameArray.length * AAction.default.fontSize) / 2 + 10;
        let width = maxLetters * (AAction.default.fontSize / 2) + 20;
        let depth = height * 2;
        let radius = Math.max(Math.sqrt(width * width + height * height), Math.sqrt(height * height + depth * depth), Math.sqrt(width * width + depth * depth)) / 2;
        return {w: width, h: height * 2, d: height * 2, r: radius};
    }

    static view3D(node, type) {
        let opacity = node.opacity || 0.75;
        let color = node.color || "#ff7722";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let size = AScenario.calculateBox(node);
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
            text: name.replace(/\s/g, '\n'),
            color: "#ffffff",
            width: width,
            size: AScenario.default.fontSize
        });
        label.position.set(0, 0, size.d / 2 + 1);
        box.add(label)

        box.position.set(node.x, node.y, node.z);
        box.aid = node.id;
        node.box = size.r;
        node.expandLink = `scenario/get?id=${node.id}`;
        node.expandView = AScenario.handle;
        node.getDetail = AScenario.getDetail;
        return box;
    }

    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                AScenario.showDetail(results);
            }
        });
    }

    static showDetail(result) {

        let records = [];
        if (!w2ui['objlist']) {
            $('#objlist').w2grid({name: 'objlist'});
        }
        w2ui['objlist'].onClick = function (event) {
            w2ui['objdetail'].clear();
            let record = this.get(event.recid);
            let drecords = [];
            let k = 0;
            let details = record.detail.split('|');

            for (let i in details) {
                k++;
                let [dname, info] = details[i].split(',');
                drecords.push({recid: k, name: dname, value: info});
            }
            w2ui['objdetail'].add(drecords);
            window.graph.selectNodeByID(event.recid);
        };
        if (!w2ui['objdetail']) {
            $('#objdetail').w2grid({
                name: 'objdetail',
                header: 'Details',
                show: {header: true, columnHeaders: false},
                columns: [
                    {
                        field: 'name',
                        caption: 'Name',
                        size: '100px',
                        style: 'background-color: #efefef; border-bottom: 1px solid white; padding-right: 5px;',
                        attr: "align=right"
                    },
                    {
                        field: 'value', caption: 'Value', size: '100%', render: function (record) {
                            return '<div>' + record.value + '</div>';
                        }
                    }
                ]
            });
        }
        let cols = [
            {field: 'name', size: "20%", resizeable: true, caption: "Name", sortable: true},
            {field: 'value', size: "80%", resizeable: true, caption: "Value", sortable: true},
        ];
        w2ui['objlist'].columns = cols;
        let i = 0;
        records.push({recid: i++, name: 'name', value: result.name, detail: result.name});
        records.push({recid: i++, name: 'description', value: result.description, detail: result.description});
        records.push({recid: i++, name: 'method', value: result.method, detail: result.method});
        records.push({recid: i++, name: 'given', value: result.given, detail: result.given});
        records.push({recid: i++, name: 'when', value: result.when, detail: result.when});
        records.push({recid: i++, name: 'then', value: result.then, detail: result.then});

        let actorDetails = Object.keys(result.actors).map(actor => {
            return `${actor}, <span onclick="expandObject('actor/get?id=${actor}');">${actor}</span>`
        });
        records.push({
            recid: i++,
            name: 'actors',
            value: Object.keys(result.actors).length,
            detail: actorDetails.join("|")
        });

        let stepsDetails = Object.keys(result.steps).map(item => {
            return `${result.steps[item].action.name}, ${showParameters(result.steps[item].parameters)}`;
        });
        records.push({
            recid: i++,
            name: 'steps',
            value: Object.keys(result.steps).length,
            detail: stepsDetails.join('|')
        });

        if (result._instances) {
            let runsDetails = Object.keys(result._instances).map(item => {
                return `${item}, <span style="background=${scolor[result._instances[item].state]};">${result._instances[item].state}</span>`;
            })
            records.push({
                recid: i++,
                name: 'runs',
                value: Object.keys(result._instances).length,
                detail: runsDetails.join('|')
            });
        }

        w2ui['objlist'].records = records;
        w2ui['objlist'].refresh();
        ASelectedHUD.update('Scenario', records);
    }

    static viewStep3D(node, type) {
        let opacity = node.opacity || 1;
        let color = node.color || "#aa8844";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let w = Math.max(150, node.name.length * AScenario.default.fontSize / 2);
        let geometry = new THREE.BoxGeometry(w, 20, 5);
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
        let label = AText.view3D({text: node.name, color: "#ffffff", width: 200, size: 14});
        label.position.set(0, 0, 5);
        box.add(label);
        if (node.x !== undefined) {
            box.position.set(node.x, node.y, node.z);
        }
        box.aid = node.id;
        node.box = 0;
        node.expandLink = `scenario/get?id=${node.id}`;
        return box;
    }

    static viewDeep3D(scenario, mode, parent) {
        let data = {nodes: {}, links: []};
        if (mode === "add" && parent) {
            data.nodes[scenario.id] = {
                id: scenario.id, name: scenario.name,
                view: AScenario.view3D,
                expandView: AScenario.handle,
                expandLink: `scenario/get?id=${scenario.id}`,
                rbox: {
                    parent: parent.id,
                    fz: -600,
                }
            };
            data.links.push({target: scenario.id, source: parent.id, width: 1, value: 40, color: "#aaffff"})
        } else {
            data.nodes[scenario.id] = {
                id: scenario.id, name: scenario.name,
                view: AScenario.view3D,
                expandView: AScenario.handle,
                expandLink: `scenario/get?id=${scenario.id}`,
                fx: 0,
                fy: 0,
                fz: 0,
            };
        }
        let rbox = {};
        let sbox = AScenario.calculateBox(data.nodes[scenario.id]);
        let yoffset = sbox.h;
        let luid = scenario.id;
        for (let i in scenario.steps) {
            let step = scenario.steps[i];
            let uid = `${scenario.id}-${i}`;
            rbox = {parent: luid, fx: 0, fy: -yoffset, fz: 0};
            let description = ""
            for (let pname in step.parameters) {
                description += `--${pname} ${step.parameters[pname]}\n`;
            }
            data.nodes[uid] = {
                id: uid, name: step.action.name,
                description: description,
                view: AScenario.viewStep3D,
                expandView: AScenario.handle,
                expandLink: `scenario/get?id=${scenario.id}`,
                rbox: rbox,
                box: 10
            };
            yoffset = 30;
            // Add the action for the step.
            let action = step.action;
            if (!data.nodes.hasOwnProperty(action.name)) {
                data.nodes[action.name] = {
                    id: action.name,
                    name: action.name.replace(/\//, '\n'),
                    view: AAction.view3D,
                    w: 80, h: 30,
                    fontSize: 12,
                    rbox: {
                        parent: uid,
                        fz: -150
                    }
                };
            }
            data.links.push({source: uid, target: action.name, value: 0.1});
            // Add the package for the action.
            let pkg = action.pkg;
            if (pkg) {
                if (!data.nodes.hasOwnProperty(pkg.shortname)) {
                    data.nodes[pkg.shortname] = {
                        id: pkg.shortname,
                        name: pkg.name,
                        color: pkg.color,
                        view: APackage.view3D,
                        expandView: APackage.handle,
                        expandLink: `package/get?id=${pkg.shortname}`,
                        rbox: {
                            parent: scenario.id,
                            x: {min: -300, max: 300},
                            y: {min: -300, max: 300},
                            fz: -450
                        }
                    };
                }
                if (!action.cls) {
                    data.links.push({source: action.name, target: pkg.shortname, value: 0.1});
                }
            }
            // Add the class if it is a class action.
            if (action.cls) {
                let cls = action.cls;
                if (!data.nodes.hasOwnProperty(cls)) {
                    data.nodes[cls] = {
                        id: cls, name: cls, view: AModel.view3D,
                        expandView: AModel.handle,
                        expandLink: `model/get?id=${cls}`,
                        rbox: {
                            parent: scenario.id,
                            x: {min: -300, max: 300},
                            y: {min: -300, max: 300},
                            fz: -300,
                        }
                    };
                    data.links.push({source: cls, target: pkg.shortname, value: 0.1});
                }
                data.links.push({target: cls, source: action.name, value: 0.1});
            }
            luid = uid;
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
        return data.nodes[scenario.id];
    }

    static showInstances(panel, instances) {

        $(panel).w2grid({
            name: 'workflowInstanceList',
            show: {header: false, columnHeaders: false, toolbar: true},
            columns: [
                {
                    field: 'actions',
                    caption: 'Actions',
                    size: '20%'
                },
                {
                    field: 'name',
                    caption: 'Name',
                    size: '80%',
                }
            ],
            onClick: function (event) {
                let scenario = w2ui['scenariolist'].scenario;
                let instance = w2ui['scenariolist'].scenarioinstance;
                $.ajax({
                    url: `scenario/instance?id=${scenario.id}`,
                    success: (result) => {
                        // Popup with the stdout and stderr
                        if (!instance) { // Get the last one run
                            instance = result.length - 1;
                        }
                        let text = result[instance].steps[event.recid];
                        AScenario.popup(text);
                    }
                })
            },
        });

    }

    static handle2d(result, object, div) {
        _setGraphToolbar(object);
        div.innerHTML = result;
    }

    static handle(result) {
        AScenario.viewDeep3D(result, 'new');
        AScenario.showDetail(result);
        AMainWindow.currentView = "scenario"

        // Scenario List for simulation.
        let records = [];
        if (!w2ui['scenariolist']) {
            $().w2grid({
                name: 'scenariolist',
                show: {header: false, columnHeaders: false, toolbar: true},
                columns: [
                    {
                        field: 'action',
                        caption: 'Action',
                        size: '30%',
                        attr: "align=right",
                        sortable: true
                    },
                    {
                        field: 'parameters',
                        caption: 'Parameters',
                        size: '60%',
                        attr: "align=left",
                        sortable: true
                    },
                ],
                onClick: function (event) {
                    let scenario = w2ui['scenariolist'].scenario;
                    let instance = w2ui['scenariolist'].scenarioinstance;
                    $.ajax({
                        url: `scenario/instance?id=${scenario.id}`,
                        success: (result) => {
                            // Popup with the stdout and stderr
                            if (!instance) { // Get the last one run
                                instance = result.length - 1;
                            }
                            let text = result[instance].steps[event.recid];
                            AScenario.popup(text);
                        }
                    })
                },
                toolbar: {
                    items: [
                        {id: 'launch', type: 'button', caption: 'Launch Scenario', icon: 'w2ui-icon-plus'},
                        {type: 'break'},
                        {
                            id: 'scenarioname',
                            type: 'html',
                            html: '<span style="background-color: #004488; color: white;padding:5px;">Not Selected</span>'
                        }
                    ],
                    onClick: function (event) {
                        if (event.target === 'launch') {
                            let scenario = w2ui['scenariolist'].scenario;
                            // If there aren't any inputs then launch it.
                            if (!scenario.inputs) {
                                $.ajax({
                                    url: `scenario/launch?id=${scenario.id}`,
                                    success: function (result) {
                                        w2ui['scenariolist'].scenarioinstance = result.id;
                                    }
                                });
                            } else {
                                // create a simple dialog with the inputs and the onClick should call the scenario
                                // With the parametersEdit
                                AScenario.inputPopup(scenario);

                            }
                        }
                    }
                }
            });
        }
        for (let i in result.steps) {
            let parameters = result.steps[i].parameters;
            let params = [];
            for (let j in parameters) {
                params.push(`${j}: ${parameters[j]}`);
            }
            records.push({recid: i, action: result.steps[i].action.name, parameters: params.join(',')});
        }
        w2ui['scenariolist'].scenario = result;
        w2ui['scenariolist'].records = records;
        w2ui['scenariolist_toolbar'].set('scenarioname', {html: `<span style="background-color: #2391dd; padding:5px;">${result.name}</span>`});
        w2ui['scenariolist'].refresh();
        w2ui['bottomLayout'].html('main', w2ui['scenariolist']);

    }

    static handleEvent(event, scenario) {
        if (event.includes('scenario.started')) {
            w2ui['scenariolist'].header = scenario.name + ' Started';
            window.graph.setNode(scenario.id, {color: scolor['started']});
        } else if (event.includes('scenario.completed')) {
            w2ui['scenariolist'].header = scenario.name + ' Completed';
            window.graph.setNode(scenario.id, {color: scolor['completed']});
        } else if (event.includes('scenario.failed')) {
            w2ui['scenariolist'].header = scenario.name + ' Failed';
            window.graph.setNode(scenario.id, {color: scolor['failed']});
        } else if (event.includes('step.started')) {
            w2ui['scenariolist'].set(scenario.currentstep, {"w2ui": {"style": "background-color: #bbffff"}});
            let steprec = w2ui['scenariolist'].get(scenario.currentstep);
            window.graph.setNode(scenario.id + '-' + scenario.currentstep, {color: scolor['started']});
        } else if (event.includes('step.completed')) {
            w2ui['scenariolist'].set(scenario.currentstep, {"w2ui": {"style": "background-color: #bbffbb"}});
            window.graph.setNode(scenario.id + '-' + scenario.currentstep, {color: scolor['completed']});
        } else if (event.includes('step.failed')) {
            w2ui['scenariolist'].set(scenario.currentstep, {"w2ui": {"style": "background-color: #ffbbbb"}});
            window.graph.setNode(scenario.id + '-' + scenario.currentstep, {color: scolor['failed']});
        } else {
            let parent = window.graph.getSelectedNode();
            // Because the event is not a scenario it is an object event.
            let object = scenario;
            if (typeof object === 'object') {
                if (parent && parent.id) {
                    AObject.addObject(object, parent.id);
                } else {
                    AObject.addObject(object);
                }
            }
        }
        w2ui['scenariolist'].refresh();
    }

    static inputForm(scenario) {
        let fields = [];
        let inputs = scenario.inputs;

        for (let name in inputs) {
            let input = inputs[name];
            let ivalue = activity.inputs[name];
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
            } else if (input.type === 'file') {
                fields.push({
                    field: name,
                    type: 'fileUploader',
                    required: input.required,
                    options: {url: input.url},
                    html: {label: name}
                });
            } else if (input.size) {
                fields.push({
                    field: name,
                    type: 'textarea',
                    required: input.required,
                    html: {
                        label: name,
                        attr: `size="${input.size}" style="width:500px; height:${(input.size / 80) * 12}px"`
                    }
                });
            } else {
                fields.push({
                    field: name,
                    type: 'textarea',
                    required: input.required,
                    html: {label: name, attr: `size="50" style="width:500px"`}
                });
            }

            if (typeof ivalue !== "object") {
                record[name] = ivalue;
            } else {
                record[name] = "";
            }
        }
        $().w2form({
            name: 'ScenarioInput',
            style: 'border: 0px; background-color: transparent;',
            fields: fields,
            actions: {
                Save: {
                    caption: "Launch", style: "background: #aaffaa",
                    onClick(event) {
                        w2popup.close();
                        let parameters = w2ui['ScenarioInput'].record;
                        let parameterArray = [];
                        for (let pname in parameters) {
                            parameterArray.push(`${pname}=${parameters[pname]}`);
                        }

                        $.ajax({
                            url: `scenario/launch?id=${scenario.id}&${parameterArray.join("&")}`,
                            success: function (result) {
                                w2ui['scenariolist'].scenarioinstance = result.id;
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
        return w2ui['ScenarioInput'];
    }

    static stdioForm(record) {
        if (!w2ui['ScenarioStdio']) {
            let fields = [
                {field: "state", type: 'text'},
                {field: 'step', type: 'text'},
                {
                    field: 'stdout', type: 'textarea',
                    html: {label: 'Text Area', attr: 'style="width: 800px; height: 100px; resize: none"'}
                },
                {
                    field: 'stderr', type: 'textarea',
                    html: {label: 'Text Area', attr: 'style="width: 800px; height: 100px; resize: none"'}
                }
            ];
            $().w2form({
                name: 'ScenarioStdio',
                style: 'border: 0px; background-color: transparent;',
                fields: fields,
                actions: {
                    custom: {
                        caption: "Close", style: 'background: pink;', onClick(event) {
                            w2popup.close();
                        }
                    }
                }
            });
        }
        w2ui['ScenarioStdio'].record = {
            state: record.state,
            step: record.step.action,
            stdout: record.stdio.stdout,
            stderr: record.stdio.stderr
        };
        return w2ui['ScenarioStdio'];
    }

    static editDocs(results, setURL) {
        let editForm = getEditForm(results, setURL);
        w2popup.open({
            height: 850,
            width: 850,
            title: `Edit ${results.name}`,
            body: '<div id="editScenarioDocDialog" style="width: 100%; height: 100%;"></div>',
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editScenarioDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.ScenarioDialog.box).show();
                    w2ui.ScenarioDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    $('#editScenarioDocDialog').w2render(editForm.name);
                    w2ui.ScenarioEditTabs.click('docs');
                }
            }
        })
    }

}

function getEditForm(record, setURL) {
    if (!w2ui['ScenarioEditGeneral']) {
        $().w2layout({
            name: 'ScenarioEditGeneral',
            panels: [
                {type: 'left', size: 150, resizable: true, minSize: 35},
                {type: 'main', overflow: 'hidden'}
            ],
            onRender: (event) => {
                if (event.target === 'ScenarioEditGeneral') {
                    if (w2ui.ScenarioEditGeneral.record) {
                        w2ui.ScenarioEditGeneral.record = {};
                    }
                }
            }
        });
    }
    if (!w2ui['ScenarioEditTabs']) {
        $().w2sidebar({
            name: 'ScenarioEditTabs',
            flatButton: true,
            nodes: [
                {id: 'docs', text: 'Docs', selected: true},
                {id: 'actors', text: 'Actors'},
                {id: 'steps', text: 'Steps'},
            ],
            onClick(event) {
                switch (event.target) {
                    case 'docs':
                        w2ui['ScenarioEditGeneral'].html('main', w2ui.ScenarioEditDoc);
                        break;
                    case 'actors':
                        w2ui['ScenarioEditGeneral'].html('main', w2ui.ScenarioEditActors);
                        break;
                    case 'steps':
                        w2ui['ScenarioEditGeneral'].html('main', w2ui.ScenarioEditSteps);
                        break;
                }
            }
        });
    }
    _createScenarioEditDoc(record, setURL);
    _createScenarioEditActors(record, setURL);
    _createScenarioEditSteps(record, setURL);

    w2ui['ScenarioEditDoc'].record = record;
    w2ui['ScenarioEditActors'].record = record;
    w2ui['ScenarioEditSteps'].record = record;

    w2ui['ScenarioEditGeneral'].saveURL = setURL;
    w2ui.ScenarioEditGeneral.html('left', w2ui.ScenarioEditTabs);
    w2ui.ScenarioEditGeneral.html('main', w2ui.ScenarioEditDoc);
    return w2ui['ScenarioEditGeneral'];
}

function _createScenarioEditActors(record, setURL) {
    let config = {
        name: "ScenarioEditActors",
        title: "Actors",
        tab: 'actors',
        saveURL: "actor/save",
        edit: AActor.editDocs,
        editURL: 'actor/get',
        attribute: 'actors',
        columns: [
            {
                field: 'name',
                caption: 'Name',
                size: '100%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return name;
                }
            },

        ]
    };
    _createCharacteristicGrid(config);
}

function _createScenarioEditSteps(record, setURL) {
    let config = {
        name: "ScenarioEditSteps",
        title: "Steps",
        generateURL: 'scenario/generate?target=Steps',
        tab: 'steps',
        saveURL: "scenario/save",
        attribute: 'steps',
        columns: [
            {
                field: 'action',
                caption: 'Action',
                size: '30%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    return value.action.name || value.action;
                }
            },
            {
                field: 'parameters',
                caption: 'Parameters',
                size: '30%',
                resizable: true,
                editable: {type: 'text'},
                sortable: true,
                fn: (name, value) => {
                    let params = value.parameters;
                    let retval = "";
                    for (let pname in params) {
                        let pvalue = params[pname];
                        retval += `${pname}: ${pvalue},`;
                    }
                    return retval;
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
    };
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
                        let clsid = w2ui[config.name].record.uid || w2ui[config.name].record.id;
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
                                w2ui.ScenarioEditTabs.click(config.tab);
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
        w2ui[config.name].on('dblClick', function (event) {
            let record = this.get(event.recid);
            // THis is where we need to open up another window to show details of what was clicked on.
            if (config.edit && config.editURL) {
                $.ajax({
                    url: `${config.editURL}?id=${record.name}`,
                    success: function (results) {
                        config.edit(results, config.saveURL);
                    }
                });
            }
        });
    }
}

function _createScenarioEditDoc(record, setURL) {
    if (!w2ui.ScenarioEditDoc) {
        $().w2form({
            name: 'ScenarioEditDoc',
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
                    caption: 'Description',
                    field: 'description',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 50px;"',
                        caption: "Description" +
                            "<br><button class=AIButton id='scenariogenerateDescription'></button>"
                    }
                },
                {
                    field: 'given',
                    type: 'textarea',
                    required: true,
                    html: {
                        attr: 'style="width: 450px; height: 50px;',
                        caption: 'Given' +
                            "<br><button class=AIButton id='scenariogenerateGWT'></button>"
                    }
                },
                {
                    field: 'when',
                    type: 'textarea',
                    required: true,
                    html: {
                        attr: 'style="width: 450px; height: 50px;',
                        caption: 'When' +
                            "<br><button class=AIButton id='scenariogenerateGWT'></button>"
                    }
                },
                {
                    field: 'then',
                    type: 'textarea',
                    required: true,
                    readonly: true,
                    html: {
                        attr: 'style="width: 450px; height: 50px;',
                        caption: 'Then' +
                            "<br><button class=AIButton id='scenariogenerateGWT'></button>"
                    }
                },
            ],
            onRender: (event) => {
                setTimeout(function () {
                    let textArea = document.querySelector("#document");
                    w2ui.ScenarioEditDoc.editors = {document: {}};
                    ClassicEditor.create(textArea)
                        .catch(error => {
                            console.log(error)
                        })
                        .then(editor => {
                            w2ui.ScenarioEditDoc.editors.document = editor;
                        });
                }, 10);
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
            $(document).on('click', "#scenariogenerateDescription", function () {
                let clsid = w2ui.ScenarioEditDoc.record.id;
                let url = `scenario/generate?target=Description&id=${clsid}`;
                w2ui.ScenarioEditDoc.lock('description', true);
                w2ui.ScenarioEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        $('html').css('cursor', 'auto');
                        w2ui.ScenarioEditDoc.unlock('description', true);
                        w2ui.ScenarioEditDoc.record.description = results;
                        w2ui.ScenarioEditDoc.refresh();
                        w2ui.ScenarioEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
            $(document).on('click', "#scenariogenerateGWT", function () {
                let clsid = w2ui.ScenarioEditDoc.record.id;
                let url = `scenario/generate?target=GWT&id=${clsid}`;
                w2ui.ScenarioEditDoc.lock('Generating...', true);
                w2ui.ScenarioEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        w2ui.ScenarioEditDoc.unlock('document', true);
                        w2ui.ScenarioEditDoc.record.given = results.given;
                        w2ui.ScenarioEditDoc.record.when = results.when;
                        w2ui.ScenarioEditDoc.record.then = results.then;
                        w2ui.ScenarioEditDoc.refresh();
                        $('html').css('cursor', 'auto');
                        w2ui.ScenarioEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
        })
    }
}

function detailList(result) {
}

function showParameters(params) {
    return Object.keys(params).map(name => {
        return `--${name}=${params[name]}`;
    }).join(' ');
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
                    url: object.link2d + "&diagram=Scenario",
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
            type: 'button', id: 'activities', text: 'Activities', img: 'w2ui-icon-search', onClick: (event) => {
                // 2D
                div.innerHTML = "Fetching UML diagrams";
                $.ajax({
                    url: object.link2d + "&diagram=Scenario",
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
