import {
    APackage,
    AScenario,
    AUsecase,
    AActor,
    AModel,
    AStack,
    AEnvironment,
    AObject,
    AComponent,
    AImage,
    A3DGraph,
    AEventHUD,
    AEvent,
    ASelectedHUD,
    AUserActivity,
    AGenerativeAI,
} from './index.js';

import ALocation from './ALocation.js';
import ANote from './ANote.js';
import ADevice from './ADevice.js';
import AWorkFlow from './AWorkFlow.js';
import ACategory from './ACategory.js';

import {Graph3D} from '../Graph3D.js';

export default class AMainWindow {
    static selectedObject = {};
    static currentView = undefined;
    static previewWindow = undefined;
    static scolor = {
        started: "#00ffff",
        created: "#00ffff",
        inprogress: "#00aaff",
        blocked: "#ffbb44",
        completed: "#aaffaa",
        failed: "#ffaaaa",
        error: "#ffaaaa",
        enabled: "#aaffaa",
        disable: "#aaaaaa",
        rejected: "#ffaaaa",
        accepted: "#aaffff",
        update: "#aaffff",
        needed: "#ffbb44",
        selected: "#aaffaa",
        evaluated: "#ffffaa",
        moved: "#00ff00",
        nocontact: "#ff0000"
    };

    static config = {
        title: "<%= global.ailtire.config.prefix %>",
        toolbar: {
            "background-color": "#880088",
            "color": "#000000"
        },
        mainDiv: "#main",
        graphDiv: "#modelGraph",
        graph3D: {
            div: "#modelGraph",
            color: "#220033"
        },
        graph2D: {
            div: "#model2D",
            color: "#ffffff"
        }
    };
    static handlers = {
        scenario: AScenario.handle,
        package: APackage.handle,
        usecase: AUsecase.handle,
        actor: AActor.handle,
        model: AModel.handle,
        stack: AStack.handle,
        environment: AEnvironment.handle,
        component: AComponent.handle,
        image: AImage.handle,
        workflow: AWorkFlow.handle,
        category: ACategory.handle,
        device: ADevice.handle,
        location: ALocation.handle,
        deployment: AEnvironment.handleList,
        physical: AEnvironment.handlePhysicalList,
        note: ANote.handle
    };
    static handlers2d = {
        scenario: AScenario.handle2d,
        package: APackage.handle2d,
        usecase: AUsecase.handle2d,
        actor: AActor.handle2d,
        note: ANote.handle2d,
        model: AModel.handle2d,
        stack: AStack.handle,
        environment: AEnvironment.handle,
        component: AComponent.handle,
        image: AImage.handle,
        workflow: AWorkFlow.handle2d,
        category: ACategory.handle2d,
        device: ADevice.handle,
        location: ALocation.handle,
        deployment: AEnvironment.handleList,
        physical: AEnvironment.handlePhysicalList
    };
    static editors = {
        package: APackage.editDocs,
        model: AModel.editDocs,
        actor: AActor.editDocs,
        note: ANote.editDocs,
        usecase: AUsecase.editDocs,
        scenario: AScenario.editDocs,
        workflow: AWorkFlow.editDocs,
        category: ACategory.editDocs,
    };

    static initialize(pconfig) {
        let config = AMainWindow.setupConfig(pconfig);
        AMainWindow.setupUI(config);
        AMainWindow.setup3DGraphics(config)
        AMainWindow.setupEventWatcher(config);
        AMainWindow.showObjectList();
        AMainWindow.showEventList();
        AMainWindow.objectEditors = pconfig.objectEditors;
    }

    static graphOpening() {
        let data = A3DGraph.openingScene();
        window.graph.setData(data.nodes, data.links);
        window.graph.graph.cameraPosition({x: 0, y: 0, z: 1000}, // new position
            {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
            3000  // ms transition duration.
        );
    }

    static setupConfig(pconfig) {
        for (let name in pconfig) {
            let pc = pconfig[name];
            AMainWindow.config[name] = pc;
        }
        let config = {
            layout: {
                name: 'layout',
                padding: 0,
                panels: [
                    {
                        type: 'top',
                        size: 30,
                        resizable: true,
                        overflow: 'hidden',
                        style: 'border: 1px solid #0088ff; background-color:#4a96d3; color:white;',
                        toolbar: {
                            style: `background-color: ${AMainWindow.config.toolbar["background-color"]}; color: ${AMainWindow.config.color};`,
                            items: [
                                {
                                    type: 'html',
                                    id: 'app',
                                    html: `<h3 style="color:white;">${AMainWindow.config.title}</h3>`
                                },
                                {type: 'spacer'},
                                {type: 'button', id: 'home', group: '1', text: 'Home Screen', style: 'color: white;'},
                                {type: 'button', id: 'eventHUD', group: '1', text: 'Event HUD', style: 'color: white;'},
                                {type: 'button', id: 'hud', group: '1', text: 'HUD', style: 'color: white;'},
                                {type: 'button', id: 'expand', group: '1', text: 'Graph Only', style: 'color: white;'},
                                {type: 'button', id: 'normal', group: '1', text: 'All', style: 'color: white;'},
                            ],
                            onClick: function (event) {
                                if (event.target === 'expand' && !event.object.checked) {
                                    w2ui['layout'].toggle('right');
                                    w2ui['layout'].toggle('left');
                                    w2ui['layout'].toggle('bottom');
                                    w2ui['layout'].toggle('main')
                                    w2ui['layout'].sizeTo('preview', "100%");
                                } else if (event.target === 'normal') {
                                    w2ui['layout'].toggle('right');
                                    w2ui['layout'].toggle('left');
                                    w2ui['layout'].toggle('bottom');
                                    w2ui['layout'].toggle('main');
                                    w2ui['layout'].sizeTo('preview', "80%");
                                } else if (event.target === 'home') {
                                    graphOpening();
                                } else if (event.target === 'hud') {
                                    ASelectedHUD.toggle();
                                } else if (event.target === 'eventHUD') {
                                    AEventHUD.toggle();
                                }
                            }
                        }
                    },
                    {type: 'left', size: 200, resizable: true, content: 'left', style: 'border: 1px solid #aaaaff'},
                    {
                        type: 'main',
                        size: 200,
                        content: 'Details',
                        overflow: 'hidden',
                        resizable: true,
                        style: 'border: 1px solid #aaaaff',
                        toolbar: {
                            style: "background-color: #00aaaa; color: black;",
                            items: [
                                {type: 'button', id: 'editItem', text: 'Documentation'},
                                {type: 'button', id: 'errorItem', text: 'View Model Errors'},
                                {type: 'button', id: 'userActivity', text: 'User Activities'},
                                {type: 'button', id: 'generate', text: 'GenAI', img: 'ailtire-ai-icon'},
                            ],
                            onClick: function (event) {
                                AMainWindow.processTopMenu(event);
                            }
                        },
                    },
                    {
                        type: 'preview',
                        size: "80%",
                        content: 'Graph',
                        overflow: 'hidden',
                        resizable: true,
                        style: 'border: 1px solid #aaaaff',
                        toolbar: {
                            items: [
                                {
                                    type: 'menu-radio', id: "dim", dim: "View: Select", img: 'icon-search',
                                    text: function (item) {
                                        let el = this.get('View:' + item.selected);
                                        if (el) {
                                            return 'View: ' + el.text;
                                        } else {
                                            return 'View: 3d';
                                        }
                                    },
                                    selected: '3D',
                                    items: [
                                        {text: '2D', icon: 'icon-page', id: '2d'},
                                        {text: '3D', icon: 'icon-page', id: '3d'},
                                    ]
                                },
                                {type: 'break'},
                                {
                                    type: 'menu-radio', id: 'dago', caption: 'DAG: Select', img: 'icon-folder',
                                    text: function (item) {
                                        let text = item.selected;
                                        let el = this.get('dago:' + item.selected);
                                        if (el) {
                                            return 'DAG: ' + el.text;
                                        } else {
                                            return 'DAG: Null';
                                        }
                                    },
                                    selected: 'Null',
                                    items: [
                                        {text: 'Top Down', icon: 'icon-page', id: 'td'},
                                        {text: 'Bottom Up', icon: 'icon-page', id: 'bu'},
                                        {text: 'Left Right', icon: 'icon-page', id: 'lr'},
                                        {text: 'Right Left', icon: 'icon-page', id: 'rl'},
                                        {text: 'Z Out', icon: 'icon-page', id: 'zout'},
                                        {text: 'Z In', icon: 'icon-page', id: 'zin'},
                                        {text: 'Radial Out', icon: 'icon-page', id: 'radialout'},
                                        {text: 'Radial In', icon: 'icon-page', id: 'radialin'},
                                        {text: 'Null', id: 'null', icon: 'icon-page'}
                                    ]
                                },
                                {type: 'break'},
                                {
                                    type: 'button', id: 'visibility', caption: 'Trim', img: 'icon-cut',
                                },

                            ],
                            onClick: function (event) {
                                let [item, selected] = event.target.split(':');
                                if (item === 'dago') {
                                    if (selected) {
                                        window.graph.graph.dagMode(selected);
                                    }
                                } else if (item === 'visibility') {
                                    window.graph.showSelectedOnly();
                                } else if (item === 'dim') {
                                    if (selected === '3d') {
                                        document.getElementById('preview2d').style.display = "none";
                                        document.getElementById('preview3d').style.display = "block";
                                    } else if (selected === '2d') {
                                        document.getElementById('preview3d').style.display = "none";
                                        document.getElementById('preview2d').style.display = "block";
                                    }

                                } else if (event.target === 'expand') {
                                    w2ui['layout'].toggle('right');
                                    w2ui['layout'].toggle('left');
                                    w2ui['layout'].toggle('bottom');
                                    w2ui['layout'].toggle('main')
                                    w2ui['layout'].sizeTo('preview', "100%");
                                } else if (event.target === 'normal') {
                                    w2ui['layout'].toggle('right');
                                    w2ui['layout'].toggle('left');
                                    w2ui['layout'].toggle('bottom');
                                    w2ui['layout'].toggle('main');
                                    w2ui['layout'].sizeTo('preview', "80%");
                                }
                            }
                        }
                    },
                    {type: 'right', size: 200, resizable: true, content: 'right', style: 'border: 1px solid #aaaaff'},
                    {type: 'bottom', size: 100, resizable: true, content: 'bottom', style: 'border: 1px solid #aaaaff'}
                ]
            },
            rightbar: {
                name: 'rightbar',
                nodes: [
                    {id: 'classes', text: 'Classes', group: true, expanded: true, nodes: []}
                ],
                onClick: function (event) {
                    if (event.object.link) {
                        // Get the information from the link and load it in the mainpage and the preview
                        AMainWindow.currentView = event.object.link;
                        $.ajax({
                            url: event.object.link,
                            success: AObject.handle
                        });
                    }
                }
            },
            sidebar: {
                name: 'sidebar',
                img: null,
                nodes: [
                    {
                        id: 'usecaseview', text: 'UseCase View', group: true, expanded: false, nodes: [
                            {id: 'actors', text: 'Actors', img: 'icon-folder', expanded: false, nodes: []},
                            {id: 'usecases', text: 'Use Cases', img: 'icon-folder', expanded: false, nodes: []},
                        ]
                    },
                    {id: 'logical', text: 'Logical View', group: true, expanded: false, nodes: []},
                    {
                        id: 'implementation', text: 'Implementation View', group: true, expanded: true, nodes: [
                            {
                                id: 'libraries',
                                text: 'External Libraries',
                                img: 'icon-folder',
                                expanded: true,
                                nodes: []
                            },
                            {id: 'images', text: 'Images', img: 'icon-folder', expanded: false, nodes: []},
                        ]
                    },
                    {
                        id: 'deployment', text: "Deployment View", group: true, expanded: true, nodes: [
                            {
                                id: 'environments',
                                text: 'Logical Environments',
                                img: 'icon-folder',
                                expanded: false,
                                nodes: []
                            },
                            {
                                id: 'locations',
                                text: 'Physical Environments',
                                img: 'icon-folder',
                                expanded: false,
                                nodes: []
                            },
                        ]
                    },
                    {id: 'process', text: 'Process View', group: true, expanded: false, nodes: []},
                    {id: 'notes', text: 'Notes', group: true, expanded: false, nodes: []},
                ],
                onExpand: (event) => {
                    if (event.object.id === 'logical') {
                        AMainWindow.currentView = 'package';
                        A3DGraph.logicalView();
                    } else if (event.object.id === 'actors') {
                        AMainWindow.currentView = 'actor';
                        window.graph.toolbar.setToolBar();
                        $.ajax({
                            url: 'actor/list',
                            success: AActor.viewList3D,
                            error: function (req, text, err) {
                                console.log(text);
                            }
                        });
                    } else if (event.object.id === 'usecases') {
                        AMainWindow.currentView = 'usecase';
                        A3DGraph.usecaseView();
                    } else if (event.object.id === 'locations') {
                        AMainWindow.currentView = 'physical';
                        A3DGraph.physicalView();
                    } else if (event.object.id === 'environments') {
                        AMainWindow.currentView = 'environment';
                        A3DGraph.deploymentView();
                    } else if (event.object.id === 'implementation') {
                        AMainWindow.currentView = 'component';
                        A3DGraph.implementationView();
                    } else if (event.object.id === 'process') {
                        AMainWindow.currentView = 'category';
                        A3DGraph.processView();
                    }

                },
                onCollapse: (event) => {
                    if (event.object.id === 'logical') {
                        window.graph.toolbar.setToolBar();
                        $.ajax({
                            url: './package/list',
                            success: APackage.viewDeep3D,
                            error: function (req, text, err) {
                                console.log(text);
                            }
                        })
                    } else if (event.object.id === 'usecases') {
                        A3DGraph.usecaseView();
                    } else if (event.object.id === 'actors') {
                        window.graph.toolbar.setToolBar();
                        $.ajax({
                            url: 'actor/list',
                            success: AActor.viewList3D,
                            error: function (req, text, err) {
                                console.log(text);
                            }
                        })
                    } else if (event.object.id === 'usecases') {
                        A3DGraph.usecaseView();
                    } else if (event.object.id === 'physical') {
                        A3DGraph.physicalView()
                    } else if (event.object.id === 'environments') {
                        A3DGraph.deploymentView();
                    } else if (event.object.id === 'implementation') {
                        A3DGraph.implementationView();
                    } else if (event.object.id === 'process') {
                        A3DGraph.processView();
                    }
                },
                onClick: function (event) {
                    // Show the top level Architecture
                    if (event.object.link) {
                        // Get the information from the link and load it in the mainpage and the preview
                        AMainWindow.selectedObject = event.object;
                        AMainWindow.currentView = event.object.view;
                        $.ajax({
                            url: event.object.link,
                            success: (results) => {
                                AMainWindow.handlers[event.object.view](results, event.object);
                            },
                            error: (req, text, err) => {
                                console.log(text);
                            }
                        });
                        if (event.object.link2d) {
                            document.getElementById('preview2d').innerHTML = "Generating UML...";
                            $.ajax({
                                url: event.object.link2d,
                                success: (results) => {
                                    let div = document.getElementById('preview2d');
                                    AMainWindow.handlers2d[event.object.view](results, event.object, div);
                                },
                                error: (req, text, err) => {
                                    console.error(text);
                                }
                            });
                        }
                    } else {
                        if(AMainWindow.handlers.hasOwnProperty(event.object.view)) {
                            AMainWindow.handlers[event.object.view](event.object.data);
                        }
                    }
                }
            },
            mainDiv: AMainWindow.config.mainDiv,
            graphDiv: AMainWindow.config.graphDiv,
            graph3D: AMainWindow.config.graph3D,
        };
        return config;
    }

    static setupUI(config) {

        // Bottom Layout is three Panels. WorkflowInstances, Workflows, and Events
        $("#bottomLayout").w2layout({
            name: 'bottomLayout',
            panels: [
                {type: 'left', size: '25%', resizeable: true, minSize: 100, content: `<div id="workflowInstanceList">WorkFlow Instance List </div>`},
                {type: 'main', size: '50%', resizeable: true, minSize: 100 , content: `<div id="simulationWindow"> Simulation Window</div>`},
                {type: 'right', size: '25%', resizeable: true, minSize: 100 , content: `<div id="eventlist"> Event List</div>`},
            ]
        });
        $(config.mainDiv).w2layout(config.layout);
        w2ui.layout.content('left', $().w2sidebar(config.sidebar));
        w2ui.layout.content('right', $().w2sidebar(config.rightbar));
        w2ui.layout.content('main', `<div style="position: relative; height: 200px;"> <div id="objlist" style="position: absolute; left: 0px; width: 49.9%; height: 200px;">Object List Select item to see</div> <div id="objdetail" style="position: absolute; right: 0px; width: 49.9%; height: 200px;">Select Object to view details</div> </div>`);
        w2ui.layout.content('preview', '<div id="preview3d" style="display:block;"> <div className="modelGraph"' +
            ' id="DrawingArea" style="position: absolute; left: 0px;"></div></div> <div id="preview2d"' +
            ' style="display:none;">2D Preview</div>');
        w2ui.layout.html('bottom', w2ui['bottomLayout']);
        w2ui.layout.on("resize", (event) => {
            if (!AMainWindow.previewWindow) {
                for (let i in w2ui.layout.panels) {
                    let panel = w2ui.layout.panels[i];
                    if (panel.type === 'preview') {
                        AMainWindow.previewWindow = panel;
                    }
                }
            }
            if (event.panel === 'preview' || event.panel === 'left') {
                AMainWindow.previewWindow.width -= event.diff_x;
                AMainWindow.previewWindow.height -= event.diff_y;
            } else {
                AMainWindow.previewWindow.width += event.diff_x;
                AMainWindow.previewWindow.height += event.diff_y;
            }

            window.graph.resize({width: AMainWindow.previewWindow.width, height: AMainWindow.previewWindow.height});
        });
        AModel.showList('rightbar', 'classes');
        AActor.showList('sidebar', 'actors');
        AUsecase.showList('sidebar', 'usecases');
        APackage.showList('sidebar', 'logical');
        AEnvironment.showList('sidebar', 'environments', 'locations');
        AComponent.showList('sidebar', 'libraries');
        AImage.showList('sidebar', 'images');
        AWorkFlow.showList('sidebar', 'process');
        AWorkFlow.showInstances('#workflowInstanceList');
        ANote.showList('sidebar', 'notes');
    }

    static setupEventWatcher(config) {
        let socket = io(window.location.origin,
            {path: window.location.pathname + '/socket.io'}
        );
        socket.onAny((event, msg) => {
            AMainWindow.showEvent(event, msg);
            let [eventClass, methodClass] = event.split('.');
            if (methodClass === "create") {
                let rec = w2ui['rightbar'].get(eventClass);
                if(rec) {
                    w2ui['rightbar'].set(eventClass, {count: rec.count + 1});
                    w2ui['rightbar'].select(eventClass);
                }
            } else if(event.includes('ship.')) {
                // Add the ship to the list on the left.
                w2ui['sidebar'].add('ships', {id: msg.MMSI, text:msg.VesselName, view: 'ship', data: msg} );
            }
            if (AMainWindow.currentView) {
                let [model, view] = AMainWindow.currentView.split('/');
                model = model.toLowerCase();
                let obj = msg;
                if (msg.obj) {
                    obj = msg.obj;
                }
                if(AMainWindow.currentView.includes('note')) {
                    ANote.handleEvent(event, obj, msg.message);
                } else if (AMainWindow.currentView.includes('workflow')) {
                    AWorkFlow.handleEvent(event, obj, msg.message);
                } else if (AMainWindow.currentView.includes('category')) {
                    ACategory.handleEvent(event, obj);
                } else if (AMainWindow.currentView.includes('scenario')) {
                    AScenario.handleEvent(event, obj);
                } else if (event.includes(model)) {
                    // Add the node to the list and to the graph.
                    if (obj) {
                        AObject.addObject(obj);
                    }
                }
            }
        });
    }

    static setup3DGraphics(config) {
        let graphPanel = new A3DGraph({toolbar: w2ui['layout_preview_toolbar']});
        let width = $(config.graph3D.div).width();
        let height = $(config.graph3D.div).height();
        let graph = new Graph3D("DrawingArea", {nodes: {}, links: {}}, {
            background: config.graph3D.color,
            width: width,
            height: height,
            selectCallback: (node) => { // What to do when the object is selected in the graph
                if (w2ui['objlist']) {
                    w2ui['objlist'].selectNone();
                    w2ui['objlist'].select(node.id);
                    if (node.hasOwnProperty('getDetail')) {
                        node.getDetail(node);
                    } else {
                        AObject.showDetail(node.id);
                    }
                }
            },
            expandObject: (link) => {
                AObject.expandObject(link);
            },
            expandDesign: (node) => {
                if (node.expandLink != 'nolink') {
                    $.ajax({
                        url: node.expandLink,
                        success: (results) => {
                            node.expandView(results, "new");
                        },
                        failed: (error) => {
                            console.error("Error:", error);
                        }
                    });
                } else {
                    node.expandView(node.data);
                }
            }
        });
        window.graph = graph;
        graph.toolbar = graphPanel;
        AMainWindow.graphOpening();
        AEventHUD.setColors(AMainWindow.scolor);
        AEvent.setColors(AMainWindow.scolor);
    }

    static showObjectList() {
        $('#objlist').w2grid({name: 'objlist'});
        w2ui['objlist'].onClick = function (event) {
            w2ui['objdetail'].clear();
            let record = this.get(event.recid);
            let drecords = [];
            let k = 0;
            let values = record.detail.split('|');
            for (let i in values) {
                let value = values[i];
                k++;
                drecords.push({recid: k, name: record.name, value: value});
            }
            w2ui['objdetail'].add(drecords);
            window.graph.selectNodeByID(event.recid);
            AMainWindow.selectedObject = record;
        }
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

    static showEventList() {
        $('#eventlist').w2grid({
            name: 'eventlist',
            show: {header: false, columnHeaders: true, toolbar: true},
            toolbar: {
                items: [
                    {type: 'button', id: 'showEvents', text: 'Show Events', style: 'color: black;'},
                    {type: 'button', id: 'hideEvents', text: 'Hide Events', style: 'color: black;'},
                ],
                onClick: function (event) {
                    if(event.target === "showEvents") {
                        AEvent.showEvents();
                    } else if(event.target === "hideEvents") {
                        AEvent.hideEvents();
                    }
                }
            },
            columns: [
                {field: 'object', caption: 'Object', size: '10%', attr: "align=right", sortable: true},
                {field: 'count', caption: 'Count', size: '10%', attr: "align=right", sortable: true},
                {
                    field: 'events', caption: 'Event', size: '30%', render: function (record) {
                        let retval = "";
                        /*if(record.currentEvent) {
                            let [pevent, sevent] = record.currentEvent.split('.');
                            let bgcolor = AMainWindow.scolor[sevent] || '#ffbb88';
                            retval = `<div style="background-color:${bgcolor};" >`;

                         */

                        for (let i in record.events) {
                            let val = record.events[i];
                            let bcolor = AMainWindow.scolor[i] || '#ffbb88';
                            retval += `<span title="${i}" style="padding: 3px; background-color:${bcolor};" >${val}</span>`;
                        }
                        return retval;
                    }
                },
                {field: 'message', caption: 'Message', size: '50%', attr: "align=left", sortable: false},
            ]
        });
        w2ui['bottomLayout'].html('right', w2ui.eventlist);
    }

    static showEvent(event, msg) {
        if (w2ui['eventlist']) {
            let [object, ename] = event.split(/\./);
            let rec = w2ui['eventlist'].get(object);
            if (!rec) {
                rec = {recid: object, object: object, count: 0, events: {}, message: msg};
                w2ui['eventlist'].add(rec);
            }
            if (ename) {
                if (!rec.events.hasOwnProperty(ename)) {
                    rec.events[ename] = 0;
                }
                rec.events[ename]++;
            }
            rec.currentEvent = event;
            rec.count++;
            rec.message = msg.message;
            w2ui['eventlist'].set(object, rec);
            w2ui['eventlist'].select(object);
            AEventHUD.updateHUD(rec);
            AEvent.handle(event,msg, "add");
        }

    }

    setToolBar(tools) {
        let itemsToRemove = [];
        let toolmap = {};
        for (let i in this.defaultToolbarItems) {
            toolmap[this.defaultToolbarItems[i].id] = this.defaultToolbarItems[i];
        }
        for (let i in tools) {
            toolmap[tools[i].id] = tools[i];
        }
        for (let i in this.config.toolbar.items) {
            itemsToRemove.push(this.config.toolbar.items[i].id);
        }
        for (let i in itemsToRemove) {
            this.config.toolbar.remove(itemsToRemove[i]);
        }
        for (let i in toolmap) {
            this.config.toolbar.add(toolmap[i]);
        }
        this.config.toolbar.refresh();
    }

    static processTopMenu(event) {
        if (event.target === 'errorItem') {
            $.ajax({
                url: './app/errors',
                success: function (results) {
                    AMainWindow.createErrorDialog(results);
                    w2popup.open({
                        title: 'Errors',
                        body: '<div id="errorDialog" style="width: 100%; height: 100%;"></div>',
                        style: 'padding: 15px 0px 0px 0px',
                        width: 800,
                        height: 800,
                        showMax: true,
                        onToggle: function (event) {
                            $(w2ui.errorDialog.box).hide();
                            event.onComplete = function () {
                                $(w2ui.errorDialog.box).show();
                                w2ui.errorDialog.resize();
                            }
                        },
                        onOpen: function (event) {
                            event.onComplete = function () {
                                // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                                w2ui['ErrorList'].refresh();
                                $('#errorDialog').w2render("ErrorList");
                                w2ui['ErrorList'].refresh();
                            }
                        }
                    });
                }
            });
        } else if (event.target === 'editItem') {
            if (AMainWindow.selectedObject.link) {
                $.ajax({
                    url: AMainWindow.selectedObject.link + '&doc=true',
                    success: function (results) {
                        let setURL = AMainWindow.selectedObject.link.replace('get', 'update');
                        if (AMainWindow.editors.hasOwnProperty(AMainWindow.selectedObject.view)) {
                            AMainWindow.editors[AMainWindow.selectedObject.view](results, setURL);
                        } else {
                            AModel.editDocs(results, setURL);
                        }
                    }
                });
            } else {
                let sobj = AMainWindow.selectedObject.results;
                let url = `${sobj._type.toLowerCase()}?id=${sobj._id}`
                $.ajax({
                    url: url,
                    success: function (results) {
                        let sobj = results;
                        AObject.editObject(sobj);
                    }
                });
            }
        } else if (event.target === 'userActivity') {
            $.ajax({
                url: './useractivity/list',
                success: function (results) {
                    AUserActivity.showListDialog(results);
                }
            });
        } else if (event.target === 'generate') {
            if (AMainWindow.selectedObject.link) {
                // let url = `${AMainWindow.currentView}/generate?target=Items`;
                let url = `app/generate`;
                AMainWindow.currentView = 'note';
                AGenerativeAI.inputPopup(url);
            } else if (AMainWindow.currentView) {
                // let url = `${AMainWindow.currentView}/generate?target=Items`;
                let url = `app/generate`;
                AMainWindow.currentView = 'note';
                AGenerativeAI.inputPopup(url);
            } else {
                let url = `app/generate`;
                AMainWindow.currentView = 'note';
                AGenerativeAI.inputPopup(url);
            }
        }
    }

    static submitDocForm() {
        let form = $("#docForm");
        let url = form.attr("action");
        $.ajax({
            type: "POST",
            url: url,
            data: form,
            dataType: "json", encode: true,
        }).done(function (data) {
            w2popup.close();
        });
    }

    static createErrorDialog(results) {
        for (let i in results) {
            results[i].recid = i;
            let result = results[i];
            switch (results[i].type) {
                case "model.associations":
                    result.dataView = result.data.name + ':' + result.data.type;
                    result.objectView = result.object.name;
                    break;
                case "package.depend":
                    result.dataView = result.data;
                    result.objectView = result.object.name;
                    break;
                default:
                    result.dataView = result.data;
                    result.objectView = results.object;
                    break;
            }
        }
        $().w2grid({
            name: "ErrorList",
            columns: [
                {field: 'type', size: "20%", resizable: true, caption: 'Type', sortable: true},
                {field: 'message', size: "20%", resizable: true, caption: 'Message', sortable: true},
                {field: 'objectView', size: "20%", resizable: true, caption: 'Object', sortable: true},
                {field: 'dataView', size: "20%", resizable: true, caption: 'Data', sortable: true},
                {field: 'lookup', size: "20%", resizable: true, caption: 'Lookup', sortable: true}
            ],
            show: {
                header: true,
                columnHeaders: true,
            },
            records: results
        });
    }
}
