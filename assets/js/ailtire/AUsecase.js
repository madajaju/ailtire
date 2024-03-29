/*
 * Copyright 2023 Intel Corporation.
 * This software and the related documents are Intel copyrighted materials, and your use of them is governed by
 * the express license under which they were provided to you (License). Unless the License provides otherwise,
 * you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
 * without  Intel's prior written permission. This software and the related documents are provided as is, with no
 * express or implied warranties, other than those that are expressly stated in the License.
 *
 */

import {AActor, AScenario, AText, AInterface, APackage, ASelectedHUD} from './index.js';

export default class AUsecase {
    constructor(config) {
        this.config = config;
    }

    static default = {
        fontSize: 20,
        height: 50,
        width: 100,
        depth: 20,
    }

    static calculateBox(node) {
        let fontSize = node.fontSize || AUsecase.default.fontSize;
        let nameArray = node.name.split(/\s/).map(item => {
            return item.length;
        });
        let maxLetters = nameArray.reduce(function (a, b) {
            return Math.max(a, b);
        }, -Infinity);
        let height = (nameArray.length * fontSize) / 2 + 10;
        let width = maxLetters * (fontSize / 2) + 20;
        let depth = AUsecase.default.depth;
        let radius = Math.sqrt(width * width + height * height + depth * depth) / 2;
        return {w: width, h: height * 2, d: depth, r: radius};
    }

    static showList(panel, parent) {
        $.ajax({
            url: 'usecase/list',
            success: function (results) {
                let ucList = [];
                for (let uname in results) {
                    let uc = results[uname];
                    let ucItem = {
                        id: uname, text: uc.name, img: 'icon-folder', nodes: [],
                        link: `usecase/get?id=${uname}`,
                        view: 'usecase'
                    };
                    let snum = 0;
                    for (let sucname in uc.extended) {
                        let suc = uc.extended[sucname];
                        let node = addUseCaseListNode(suc, uname);
                        ucItem.nodes.push(node);
                        snum += node.count + 1;
                    }
                    for (let sname in uc.scenarios) {
                        snum++;
                        ucItem.nodes.push({
                            id: uname + sname,
                            text: sname,
                            img: 'icon-page',
                            link: `scenario/get?id=${uname}.${sname}`,
                            view: 'scenario'
                        });
                    }
                    ucItem.count = snum;
                    ucList.push(ucItem);
                }
                w2ui[panel].add(parent, ucList);
            }
        });
    }

    static view3D(node, type) {
        let opacity = node.opacity || 0.5;
        let fontSize = node.fontSize || AUsecase.default.fontSize;
        let color = node.color || "#aaaa00";

        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let nameArray = node.name.split(/\s/);
        let size = AUsecase.calculateBox(node);
        let height = size.h;
        let width = size.w;
        let geometry = new THREE.SphereGeometry(1);

        geometry.applyMatrix4(new THREE.Matrix4().makeScale(width, height, size.d));
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
        const retval = new THREE.Mesh(geometry, material);
        retval.position.set(node.x, node.y, node.z);
        let label = AText.view3D({text: nameArray.join('\n'), color: "#ffffff", width: width, size: fontSize});
        label.position.set(0, 0, size.d + 1);
        retval.add(label);
        if (node.rotate) {
            if (node.rotate.x) {
                retval.applyMatrix4(new THREE.Matrix4().makeRotationX(node.rotate.x));
            }
            if (node.rotate.y) {
                retval.applyMatrix4(new THREE.Matrix4().makeRotationY(node.rotate.y));
            }
            if (node.rotate.z) {
                retval.applyMatrix4(new THREE.Matrix4().makeRotationZ(node.rotate.z));
            }
        }
        retval.aid = node.id;
        node.box = size.r;
        node.expandLink = node.expandLink || `usecase/get?id=${node.id}`;
        node.expandView = node.expandView || AUsecase.handle;
        node.getDetail = AUsecase.getDetail;
        return retval;
    }

    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                AUsecase.showDetail(results);
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
        let cols = [
            {field: 'name', size: "20%", resizeable: true, label: "Name", sortable: true},
            {field: 'value', size: "80%", resizeable: true, label: "Value", sortable: true},
        ];
        w2ui['objlist'].columns = cols;
        let i = 0;
        records.push({recid: i++, name: 'name', value: result.name, detail: result.name});
        records.push({recid: i++, name: 'description', value: result.description, detail: result.description});
        records.push({recid: i++, name: 'package', value: result.package, detail: result.package});
        records.push({recid: i++, name: 'method', value: result.method, detail: result.method});
        let actorDetails = Object.keys(result.actors).map(actor => {
            return `<span onclick="expandObject('actor/get?id=${actor}');">${actor}</span>`
        });
        records.push({
            recid: i++,
            name: 'actors',
            value: Object.keys(result.actors).length,
            detail: actorDetails.join("|")
        });
        let scenarioDetails = Object.keys(result.scenarios).map(item => {
            return `<span onclick="expandObject('scenario/get?id=${result.name}.${item}');">${result.scenarios[item].name}</span>, ${result.scenarios[item].description}`
        });
        records.push({
            recid: i++,
            name: 'scenarios',
            value: Object.keys(result.scenarios).length,
            detail: scenarioDetails.join('|')
        });
        w2ui['objlist'].records = records;
        w2ui['objlist'].refresh();
        ASelectedHUD.update('Usecase', records);
    }

    static showListDetail(result) {
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
                drecords.push({recid: k, name: record.name, value: details[i]});
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
        let cols = [
            {field: 'name', size: "20%", resizeable: true, label: "Name", sortable: true},
            {field: 'value', size: "80%", resizeable: true, label: "Value", sortable: true},
        ];
        w2ui['objlist'].columns = cols;

        let i = 0;
        let ucDetails = Object.keys(result).map(ucname => {
            return `<span onclick="expandObject('usecase/get?id=${ucname}');">${ucname}</span>`
        });
        records.push({
            recid: i++,
            name: 'usecases',
            value: Object.keys(result).length,
            detail: ucDetails.join("|")
        });
        let actors = {};
        for (let uname in result) {
            let uc = result[uname];
            for (let aname in uc.actors) {
                actors[aname] = uc.actors[aname];
            }
        }
        let actorDetails = Object.keys(actors).map(item => {
            return `<span onclick="expandObject('actor/get?id=${item}');">${item}</span>`
        });
        records.push({
            recid: i++,
            name: 'actors',
            value: Object.keys(actors).length,
            detail: actorDetails.join('|')
        });
        let scenarios = {};
        for (let uname in result) {
            let uc = result[uname];
            for (let aname in uc.scenarios) {
                scenarios[aname] = uc.scenarios[aname];
            }
        }
        let scDetails = Object.keys(scenarios).map(item => {
            return `<span onclick="expandObject('scenario/get?id=${item}');">${item}</span>`
        });
        records.push({
            recid: i++,
            name: 'scenarios',
            value: Object.keys(scenarios).length,
            detail: scDetails.join('|')
        });
        w2ui['objlist'].records = records;
        w2ui['objlist'].refresh();
    }

    static viewDeep3D(usecase, mode) {
        let data = {nodes: {}, links: []};

        data.nodes[usecase.id] = {
            id: usecase.id, name: usecase.name, fx: 0, fy: 0, fz: 0,
            view: AUsecase.view3D,
            expandView: AUsecase.handle,
            expandLink: `usecase/get?id=${usecase.id}`
        };
        for (let j in usecase.scenarios) {
            let scenario = usecase.scenarios[j];
            let id = scenario.uid;
            data.nodes[id] = {
                id: id, name: scenario.name,
                view: AScenario.view3D,
                rbox: {parent: usecase.id, z: {max: -200, min: -3000}}
            };
            for (let actor in scenario.actors) {
                let aname = actor.replace(/\s/g, '').toLowerCase();
                data.links.push({source: aname, target: id, value: 0.3, width: 2});
            }
            data.links.push({source: usecase.id, target: id, value: 0.1, width: 3, color: 'gray'});
        }

        for (let j in usecase.extended) {
            let suc = usecase.extended[j];
            data.nodes[j] = {
                id: j, name: suc.name, view: AUsecase.view3D,
                color: '#aaaaaa',
                rbox: {parent: usecase.id, z: {max: 400, min: -200}}
            };
            data.links.push({source: usecase.id, target: j, value: 0.1, width: 3, color: 'gray'});
        }

        for (let j in usecase.extends) {
            let sucname = usecase.extends[j];
            let sucid = sucname.replace(/\s/g, '');
            data.nodes[sucid] = {
                id: sucid, name: sucname,
                view: AUsecase.view3D,
                color: '#aaaaff',
                rbox: {parent: usecase.id, z: {max: 400, min: -200}}
            };
            data.links.push({target: usecase.id, source: sucid, value: 0.1, width: 3, color: 'gray'});
        }

        for (let j in usecase.includes) {
            let sucname = usecase.includes[j];
            let sucid = sucname.replace(/\s/g, '');
            data.node[sucid] = {
                id: sucid, name: sucname,
                view: AUsecase.view3D,
                color: '#aaffff',
                rbox: {parent: usecase.id, z: {max: 400, min: -200}}
            };
            data.links.push({source: usecase.id, target: sucid, value: 0.1, width: 3, color: 'gray'});
        }
        for (let j in usecase.included) {
            let suc = usecase.included[j];
            data.nodes[j] = {
                id: j, name: suc.name,
                view: AUsecase.view3D,
                color: '#aaffaa',
                rbox: {parent: usecase.id, z: {max: 400, min: -200}}
            };
            data.links.push({source: usecase.id, target: j, value: 0.1, width: 3, color: 'gray'});
        }

        for (let actor in usecase.actors) {
            let aname = actor.replace(/\s/g, '').toLowerCase();
            data.nodes[aname] = {
                id: aname, name: actor, view: AActor.view3D,
                rbox: {parent: usecase.id, z: {max: 3000, min: 400}}
            };
            data.links.push({source: aname, target: usecase.id, value: 1, width: 3, color: '#ffffff'});
        }

        if (mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
        }
        window.graph.graph.cameraPosition(
            {x: 0, y: 0, z: 1000}, // new position
            {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
            3000  // ms transition duration.
        );
        setTimeout(() => {
            window.graph.graph.zoomToFit(1000)
        }, 4500);
        window.graph.showLinks();
        window.graph.toolbar.setToolBar([]);
    }
    static _viewListPackageMap(objs, mode, pkgs) {
        if(!pkgs) {
            pkgs = {};
        }
        for (let ucname in objs) {
            let uc = objs[ucname];
            let pname = uc.package.replace(/\s/g, '');
            if (!pkgs.hasOwnProperty(pname)) {
                pkgs[pname] = {name: uc.package, usecases: {}, interfaces: {}};
            }
            let mname = uc.method.replace(/\s/g, '');
            pkgs[pname].usecases[ucname] = uc;
            pkgs[pname].interfaces[mname] = {name: uc.method};
            if(mode === "exploded") {
                AUsecase._viewListPackageMap(uc.extended, mode, pkgs);
                AUsecase._viewListPackageMap(uc.included, mode, pkgs);
            }
        }
        return pkgs;
    }
    static viewList3D(objs, mode, data) {
        if (!data) {
            data = {nodes: {}, links: [], offset: {x: 0, y: 0, z: 0}};
        }
        if (mode === "new") {
            window.graph.clearObjects();
        }
        // Run through the use cases to find out how many are in a package to size the packages.
        if(mode !== "exploding") {
            let pkgs = AUsecase._viewListPackageMap(objs, mode);

            for (let pname in pkgs) {
                let box = APackage.calculateGroupBox(pkgs[pname].usecases, AUsecase.calculateBox);
                let topBox = APackage.calculateGroupBox(pkgs[pname].interfaces, AInterface.calculateBox);
                data.nodes[pname] = {
                    id: pname,
                    cube: {x: box.box.w * 2, y: box.box.h * 2, z: topBox.box.h * 2},
                    fz: 0,
                    opacity: 0.5,
                    name: pkgs[pname].name,
                    view: APackage.view3D,
                    expandView: APackage.handle,
                    expandLink: `package/get?id=${pname}`
                };
            }
        }
        for (let ucname in objs) {
            let usecase = objs[ucname];
            usecase.id = ucname;

            let pkgname = usecase.package.replace(/\s/g, '');
            let pkgnode = data.nodes[pkgname];
            if (!data.nodes.hasOwnProperty(usecase.id)) {
                data.nodes[usecase.id] = {
                    id: usecase.id,
                    name: usecase.name,
                    view: AUsecase.view3D,
                    expandView: AUsecase.handle,
                    expandLink: `usecase/get?id=${usecase.id}`
                };
            }
            data.nodes[usecase.id].rbox = {
                parent: pkgname,
                fz: (pkgnode.cube.z / 2) + 10,
                x: {min: -pkgnode.cube.x / 2, max: pkgnode.cube.x / 2},
                y: {min: -pkgnode.cube.y / 2, max: pkgnode.cube.y / 2}
            };
            if (mode === "exploded" || mode === "exploding") {
                for (let j in usecase.extended) {
                    let suc = usecase.extended[j];
                    suc.id = j;
                    data.nodes[suc.id] = {
                        id: suc.id,
                        name: suc.name,
                        view: AUsecase.view3D,
                        expandView: AUsecase.handle,
                        expandLink: `usecase/get?id=${j}`,
                        color: '#aaaaaa'
                    };
                    // Get the actor and the package and method. by making this recursive
                    let item = {};
                    item[j] = suc;
                    AUsecase.viewList3D(item, "exploding", data);
                    data.links.push({target: usecase.id, source: suc.id, value: 1, width: 3, color: '#aaaaaa'});
                }

                for (let j in usecase.included) {
                    let suc = usecase.included[j];
                    suc.id = j;
                    data.nodes[suc.id] = {
                        id: suc.id,
                        name: suc.name,
                        view: AUsecase.view3D,
                        expandView: AUsecase.handle,
                        expandLink: `usecase/get?id=${j}`,
                        color: '#88dddd'
                    };
                    let item = {};
                    item[j] = suc;
                    AUsecase.viewList3D(item, "exploding", data);
                    data.links.push({source: usecase.id, target: suc.id, value: 1, width: 3, color: '#88dddd'});
                }
            }

            for (let actor in usecase.actors) {
                let aname = actor.replace(/\s/g, '').toLowerCase();
                data.nodes[aname] = {
                    id: aname, name: actor,
                    view: AActor.view3D,
                    expandView: AActor.handle,
                    expandLink: `actor/get?id=${aname}`,
                    rbox: {parent: pkgname, x: {min: -3000, max: -pkgnode.cube.x}, fz: 0}
                };
                data.links.push({source: aname, target: usecase.id, value: 0.1, width: 3, color: 'gray'});
            }
            data.nodes[pkgname + usecase.method] = {
                id: pkgname + usecase.method,
                name: usecase.method.replace(/\//, '\n'),
                view: AInterface.view3D,
                rbox: {
                    parent: pkgname,
                    x: {min: -pkgnode.cube.x / 2 - 10, max: pkgnode.cube.x / 2 - 10},
                    y: {min: pkgnode.cube.x / 2 + 10, max: pkgnode.cube.x / 2 + 10},
                    z: {min: -pkgnode.cube.x / 2 - 10, max: pkgnode.cube.x / 2 - 10},
                }
            }
            data.links.push({
                source: usecase.id,
                target: pkgname + usecase.method,
                value: 0.01,
                width: 3,
                color: 'gray'
            });
        }
        if (mode === "new") {
            window.graph.setData(data.nodes, data.links);
        } else {
            window.graph.addData(data.nodes, data.links);
        }
        window.graph.toolbar.setToolBar([
            {
                type: 'button', id: 'fit', text: 'Show All', img: 'w2ui-icon-zoom',
                onClick: (event) => {
                    window.graph.graph.zoomToFit(1000);
                }
            },
            {
                type: 'button', id: 'explode', text: 'Explode', img: 'w2ui-icon-search', onClick: (event) => {
                    AUsecase.viewList3D(objs, "exploded");
                    setTimeout(() => {
                        window.graph.graph.zoomToFit(1000)
                    }, 1500);
                }
            }
        ]);
        window.graph.showLinks();
    }

    static handle(result) {
        AUsecase.viewDeep3D(result, 'new');
        AUsecase.showDetail(result);
    }

    static handleList(result) {
        AUsecase.viewList3D(result, 'new');
        AUsecase.showListDetail(result);
    }

    handleEvent(event, scenario) {
        if (event.includes('scenario.started')) {
            w2ui['scenariolist'].header = scenario.name + ' Started';
        } else if (event.includes('scenario.completed')) {
            w2ui['scenariolist'].header = scenario.name + ' Completed';
        } else if (event.includes('scenario.failed')) {
            w2ui['scenariolist'].header = scenario.name + ' Failed';
        } else if (event.includes('step.started')) {
            w2ui['scenariolist'].set(scenario.currentstep, {"w2ui": {"style": "background-color: #bbffff"}});
            let steprec = w2ui['scenariolist'].get(scenario.currentstep);
        } else if (event.includes('step.completed')) {
            w2ui['scenariolist'].set(scenario.currentstep, {"w2ui": {"style": "background-color: #bbffbb"}});

        } else if (event.includes('step.failed')) {
            w2ui['scenariolist'].set(scenario.currentstep, {"w2ui": {"style": "background-color: #ffbbbb"}});
        }
        w2ui['scenariolist'].refresh();
    }
}

function addUseCaseListNode(usecase, parent) {
    let uname = usecase.name.replace(/\s/g, '');
    let snum = 0;
    let ucItem = {
        id: `${parent}.${uname}`, text: usecase.name, img: 'icon-folder', nodes: [],
        link: `usecase/get?id=${uname}`,
        view: 'usecase'
    };
    for (let sucname in usecase.extended) {
        let suc = usecase.extended[sucname];
        let node = addUseCaseListNode(suc);
        ucItem.nodes.push(node);
        // count the new use case added and all of the sub usecases and scenarios
        snum += node.count + 1;
    }
    for (let sname in usecase.scenarios) {
        snum++;
        ucItem.nodes.push({
            id: uname + sname,
            text: sname,
            img: 'icon-page',
            link: `scenario/get?id=${uname}.${sname}`,
            view: 'scenario'
        });
    }
    ucItem.count = snum;
    return ucItem;
}
