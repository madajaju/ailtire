import {AScenario, AWorkFlow, AText, AUsecase, A3DGraph, ASelectedHUD} from './index.js';

export default class AActor {
    constructor(config) {
        this.config = config;
    }
    static default = {
        fontSize: 20,
        height: 100,
        width: 50,
        depth: 50
    }


    static calculateBox(node) {
        let height = AActor.default.height;
        let width = AActor.default.width;
        let depth = AActor.default.depth;
        let radius = Math.max(Math.sqrt(width*width + height*height), Math.sqrt(height*height + depth*depth), Math.sqrt(width*width + depth*depth))/2;
        return {w: width, h: height, d: depth, r:radius};
    }

    static showList(panel, parent) {
        $.ajax({
            url: 'actor/list',
            success: function (results) {
                let actorNodes = [];
                for (let aname in results) {
                    let actor = results[aname];
                    let actorItem = {
                        id: actor.shortname,
                        text: actor.name,
                        img: 'ailtire-actor',
                        link: `actor/get?id=${actor.shortname}`,
                        link2d: `actor/uml?id=${actor.shortname}`,
                        nodes: [],
                        view: 'actor'
                    };
                    let ucnum = 0;
                    for (let ucname in actor.usecases) {
                        ucnum++;
                        let ucase = actor.usecases[ucname];
                        let ucItem = {
                            id: actor.shortname + ucname,
                            text: ucase.name,
                            img: 'ailtire-usecase',
                            link: `usecase/get?id=${ucname}`,
                            nodes: [],
                            view: 'usecase'
                        };
                        let snum = 0;
                        for (let sname in ucase.scenarios) {
                            let scenario = ucase.scenarios[sname]
                            if (actor.scenarios && actor.scenarios.hasOwnProperty(sname)) {
                                snum++;
                                let sItem = {
                                    id: actor.shortname + ucname + sname,
                                    text: sname,
                                    img: 'ailtire-scenario',
                                    link: `scenario/get?id=${ucname}.${sname}`,
                                    method: `${scenario.method}`,
                                    view: 'scenario'
                                };
                                actor.scenarios[sname].used = true;
                                ucItem.nodes.push(sItem);
                            }
                        }
                        ucItem.count = snum;
                        actorItem.nodes.push(ucItem);

                    }
                    for (let sname in actor.scenarios) {
                        ucnum++;
                        let scenario = actor.scenarios[sname];
                        if (!scenario.used) {
                            let sItem = {
                                id: actor.shortname + sname,
                                text: sname,
                                img: 'ailtire-scenario',
                                method: `${scenario.method}`
                            };
                            actorItem.nodes.push(sItem);
                        }
                    }
                    actorItem.count = ucnum;
                    actorNodes.push(actorItem);
                }
                w2ui[panel].add(parent, actorNodes);
            }
        });
    }
    static view3D(node, type) {
        let color = node.color || "#aaaaaa";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let size = AActor.calculateBox(node);
        const theta = Math.PI / 2;
        const group = new THREE.Group();
        const head = new THREE.SphereGeometry(15, 16, 12);
        const material = new THREE.MeshLambertMaterial({color: color, opacity: 1});
        const headObj = new THREE.Mesh(head, material);
        group.add(headObj);
        const body = new THREE.CylinderGeometry(3, 3, 50);
        const bodyObj = new THREE.Mesh(body, material);
        bodyObj.position.set(0, -25, 0);
        group.add(bodyObj);
        const arms = new THREE.CylinderGeometry(3, 3, 30);
        const armsObj = new THREE.Mesh(arms, material);
        armsObj.applyMatrix4(new THREE.Matrix4().makeRotationZ(theta));
        armsObj.position.set(0, -25, 0);
        group.add(armsObj);
        const rleg = new THREE.CylinderGeometry(3, 3, 30);
        const rlegObj = new THREE.Mesh(rleg, material);
        rlegObj.applyMatrix4(new THREE.Matrix4().makeRotationZ(theta / 2));
        rlegObj.position.set(11, -58, 0);
        group.add(rlegObj);

        const lleg = new THREE.CylinderGeometry(3, 3, 30);
        const llegObj = new THREE.Mesh(lleg, material);
        llegObj.applyMatrix4(new THREE.Matrix4().makeRotationZ(-theta / 2));
        llegObj.position.set(-11, -58, 0);
        group.add(llegObj);

        let label = AText.view3D({text: node.name.replace(/\s/g, '\n'), color: "#ffffff", width: size.w, size: AActor.default.fontSize});
        label.position.set(0, -30, 10);
        group.add(label);

        group.position.set(node.x, node.y, node.z);
        if (node.rotate) {
            if (node.rotate.x) {
                group.applyMatrix4(new THREE.Matrix4().makeRotationX(node.rotate.x));
            }
            if (node.rotate.y) {
                group.applyMatrix4(new THREE.Matrix4().makeRotationY(node.rotate.y));
            }
            if (node.rotate.x) {
                group.applyMatrix4(new THREE.Matrix4().makeRotationZ(node.rotate.z));
            }
        }
        group.aid = node.id;
        node.box = size.r;
        node.expandLink = node.expandLink || `actor/get?id=${node.id}`;
        node.link2d = `actor/uml?id=${node.id}`;
        node.expandView = node.expandView || AActor.handle;
        node.getDetail = AActor.getDetail;

        return group;
    }
    static editDocs(results, setURL) {
        let editForm = getEditForm(results, setURL);
        w2popup.open({
            height: 850,
            width: 850,
            title: `Edit ${results.name}`,
            body: '<div id="editActorDocDialog" style="width: 100%; height: 100%;"></div>',
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editActorDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.ActorDialog.box).show();
                    w2ui.ActorDialog.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    $('#editActorDocDialog').w2render(editForm.name);
                    w2ui.ActorEditTabs.click('docs');
                }
            }
        })
    }
    static viewList3D(objs) {
        let data = {nodes: {}, links: []};

        window.graph.clearObjects();
        for (let aname in objs) {
            let actor = objs[aname];

            let node = {
                id: actor.shortname,
                name: actor.name.replace(/\s/g, '\n'),
                view: AActor.view3D,
                expandView: AActor.handle,
                expandLink: `actor/get?id=${actor.shortname}`,
                link2d: `actor/uml?id=${actor.shortname}`
            };

            data.nodes[actor.shortname] = node;
            let i = 0;

            for (let j in actor.usecases) {
                let uc = actor.usecases[j];
                let node = {
                    id: j,
                    name: uc.name.replace(/\s/g, '\n'),
                    view: AUsecase.view3D,
                    expandView: AUsecase.handle,
                    expandLink: `usecase/get?id=${j}`,
                    bbox: {
                        x: {min: -200, max: 200},
                        y: {min: -200, max: 200},
                        z: {min: -200, max: 200},
                    }
                }
                data.nodes[j] = node;
                i++;
                data.links.push({source: actor.shortname, target: j, value: 0.1});
                for (let k in uc.scenarios) {
                    if (data.nodes.hasOwnProperty(k)) {
                        data.links.push({source: j, target: k, value: 0.1});
                    }
                }
            }
        }

        window.graph.setData(data.nodes, data.links);
        window.graph.showLinks();

    }

    static viewDeep3D(actor,mode) {
        let data = {nodes: {}, links: []};

        window.graph.clearObjects();
        let node = {
            id: actor.shortname,
            name: actor.name.replace(/\s/g, '\n'),
            view: AActor.view3D,
            expandView: AActor.handle,
            expandLink: `actor/get?id=${actor.shortname}`,
            link2d: `actor/uml?id=${actor.shortname}`,
            fx: 0,
            fy: 0,
            fz: 0
        };

        data.nodes[actor.shortname] = node;
        let i = 0;
        for (let j in actor.scenarios) {
            let scenario = actor.scenarios[j];
            let node = {
                id: scenario.uid,
                name: scenario.name.replace(/\s/g, '\n'),
                view: AScenario.view3D,
                expandView: AScenario.handle,
                expandLink: `scenario/get?id=${scenario.uid}`,
            };
            data.nodes[node.id] = node;
            i++;
        }
        i = 0;
        for (let j in actor.usecases) {
            let uc = actor.usecases[j];
            let node = {
                id: j, name: uc.name.replace(/\s/g, '\n'),
                view: AUsecase.view3D,
                expandView: AUsecase.handle,
                expandLink: `usecase/get?id=${j}`,
            }
            data.nodes[j] = node;
            i++;
            data.links.push({source: actor.shortname, target: j, value: 0.1});
            for (let k in uc.scenarios) {
                let id = `${j}.${k}`
                if (data.nodes.hasOwnProperty(id)) {
                    data.links.push({source: j, target: id, value: 0.1});
                }
            }
        }
        i = 0;
        for (let j in actor.workflows) {
            let wf = actor.workflows[j];
            let node = {
                id: j, name: wf.name.replace(/\s/g, '\n'),
                view: AWorkFlow.view3D,
                expandView: AWorkFlow.handle,
                expandLink: `workflow/get?id=${j}`,
                link2d: `workflow/uml?id=${j}`,
            }
            data.nodes[j] = node;
            i++;
            data.links.push({source: actor.shortname, target: j, value: 0.1});
        }
        window.graph.graph.cameraPosition(
            {x: 0, y: 0, z: 1000}, // new position
            {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
            3000  // ms transition duration.
        );
        setTimeout(() => {
            window.graph.graph.zoomToFit(1000)
        }, 4500);
        if (mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
        }
        window.graph.showLinks();
    }
    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                AActor.showDetail(results);
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
                if(!value) { value = name; name = record.name; }
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
        records.push({recid: i++, name: 'name', value: result.name, detail: result.name});
        records.push({recid: i++, name: 'shortname', value: result.shortname, detail: result.shortname});
        records.push({recid: i++, name: 'description', value: result.description, detail: result.description});
        let ucdetails = getDetails(result.usecases);
        if (result.usecases) {
            records.push({
                recid: i++,
                name: 'usecases',
                value: Object.keys(result.usecases).length,
                detail: ucdetails.join('|')
            });
        }
        let sdetails = getDetails(result.scenarios);
        if (result.scenarios) {
            records.push({
                recid: i++,
                name: 'scenarios',
                value: Object.keys(result.scenarios).length,
                detail: sdetails.join('|')
            });
        }
        w2ui['objlist'].records = records;
        ASelectedHUD.update("Actor", records);
        w2ui['objlist'].refresh();
    }
    static handle2d(result, object, div) {
        _setGraphToolbar(object);
        div.innerHTML = result;
    }
    static handle(result) {
        AActor.viewDeep3D(result, "new");
        AActor.showDetail(result);
    }
}

function getDetails(objs) {
    let items = [];
    let inum = 0;
    for (let j in objs) {
        let item = objs[j];
        inum++;
        let name = item.name || j;
        items.push(`<span onclick="expandObject('${item.link}');">${name}</span>^${item.description}`);
    }
    return items;
}

function getEditForm(record, setURL) {
    if (!w2ui['ActorEditGeneral']) {
        $().w2layout({
            name: 'ActorEditGeneral',
            panels: [
                {type: 'left', size: 150, resizable: true, minSize: 35},
                {type: 'main', overflow: 'hidden'}
            ],
            onRender: (event) => {
                if (event.target === 'ActorEditGeneral') {
                    if (w2ui.ActorEditGeneral.record) {
                        w2ui.ActorEditGeneral.record = {};
                    }
                }
            }
        });
    }
    if (!w2ui['ActorEditTabs']) {
        $().w2sidebar({
            name: 'ActorEditTabs',
            flatButton: true,
            nodes: [
                {id: 'docs', text: 'Docs', selected: true},
            ],
            onClick(event) {
                switch (event.target) {
                    case 'docs':
                        w2ui['ActorEditGeneral'].html('main', w2ui.ActorEditDoc);
                        break;
                }
            }
        });
    }
    _createActorEditDoc(record, setURL);

    w2ui['ActorEditGeneral'].record = record;
    w2ui['ActorEditDoc'].record = record;
    w2ui['ActorEditGeneral'].saveURL = setURL;
    w2ui.ActorEditGeneral.html('left', w2ui.ActorEditTabs);
    w2ui.ActorEditGeneral.html('main', w2ui.ActorEditDoc);
    return w2ui['ActorEditGeneral'];
}

function _createActorEditDoc(record, setURL) {
    if (!w2ui.ActorEditDoc) {
        $().w2form({
            name: 'ActorEditDoc',
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
                            "<br><button class=AIButton id='actorgenerateDescription'></button>"
                    }
                },
                {
                    field: 'document',
                    type: 'textarea',
                    html: {
                        attr: 'style="width: 450px; height: 500px;"',
                        caption: "Details" +
                            "<br><button class=AIButton id='actorgenerateDocumentation'></button>"
                    }
                },
            ],
            onRender: (event) => {
                setTimeout(function () {
                    let textArea = document.querySelector("#document");
                    w2ui.ActorEditDoc.editors = {document: {}};
                    ClassicEditor.create(textArea)
                        .catch(error => {
                            console.log(error)
                        })
                        .then(editor => {
                            w2ui.ActorEditDoc.editors.document = editor;
                        });
                }, 10);
            },
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
        $(document).ready(function () {
            $(document).on('click', "#actorgenerateDescription", function () {
                let clsid = w2ui.ActorEditDoc.record.name;
                let url = `actor/generate?target=Description&id=${clsid}`;
                w2ui.ActorEditDoc.lock('description', true);
                w2ui.ActorEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        $('html').css('cursor', 'auto');
                        w2ui.ActorEditDoc.unlock('description', true);
                        w2ui.ActorEditDoc.record.description = results;
                        w2ui.ActorEditDoc.refresh();
                        w2ui.ActorEditTabs.click('docs');
                    },
                    failure: function (results) {
                        console.error(results);
                    }
                });
            });
            $(document).on('click', "#actorgenerateDocumentation", function () {
                let clsid = w2ui.ActorEditDoc.record.name;
                let url = `actor/generate?target=Documentation&id=${clsid}`;
                w2ui.ActorEditDoc.lock('Generating...', true);
                w2ui.ActorEditDoc.refresh();
                $('html').css('cursor', 'wait');
                $.ajax({
                    url: url,
                    success: function (results) {
                        w2ui.ActorEditDoc.unlock('document', true);
                        w2ui.ActorEditDoc.record.document = results;
                        w2ui.ActorEditDoc.refresh();
                        $('html').css('cursor', 'auto');
                        w2ui.ActorEditTabs.click('docs');
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
                    url: object.link2d +"&diagram=UseCase",
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
                    url: object.link2d +"&diagram=UseCase",
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
                    url: object.link2d +"&diagram=Workflows",
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
