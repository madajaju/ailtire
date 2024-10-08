

import {AText, AState, AStateCondition} from './index.js';

export default class AStateNet {
    constructor(config) {
        this.config = config;
    }

    static calculateBox(statenet) {
        let retval = 0;
        for (let sname in statenet) {
            let size = AState.calculateBox({name: sname});
            retval += size.r;
        }
        return retval;
    }

    static view3D(node, type) {
        let color = node.color || "green";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }

        const theta = Math.PI / 2;
        const group = new THREE.Group();
        const material = new THREE.MeshLambertMaterial({color: color, opacity: 1});
        const left = new THREE.SphereGeometry(10, 16, 12);
        let leftObj = new THREE.Mesh(left, material);
        leftObj.position.set(-40, 0, 0)
        const right = new THREE.SphereGeometry(10, 16, 12);
        let rightObj = new THREE.Mesh(right, material);
        rightObj.position.set(40, 0, 0)
        const center = new THREE.CylinderGeometry(10, 10, 80);
        let centerObj = new THREE.Mesh(center, material);
        centerObj.applyMatrix4(new THREE.Matrix4().makeRotationZ(theta));
        group.add(leftObj);
        group.add(rightObj);
        group.add(centerObj);

        let label = AText.view3D({text: node.name, color: "#ffffff", width: 80, size: 12});
        label.position.set(0, 0, 11);
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
        node.box = 1;
        node.expandLink = `statenet/get?id=${node.id}`;
        node.expandView = AStateNet.handle;
        node.getDetail = AStateNet.getDetail;

        return group;
    }

    static getDetail(node) {
        $.ajax({
            url: node.expandLink,
            success: (results) => {
                AStateNet.showDetail(results);
            }
        });
    }

    static showDetail(result) {

    }

    static viewDeep3D(statenet, opts) {
        let data = {nodes: {}, links: []};
        const theta = Math.PI / 2;
        if (statenet) {
            for (let sname in statenet) {
                let state = statenet[sname];
                let rbox = opts.rbox;
                if (sname === 'Init') {
                    rbox = opts.ibox;
                }
                data.nodes[opts.id + sname] = {
                    id: opts.id + sname,
                    name: sname,
                    view: AState.view3D,
                    rbox: rbox,
                    object: state,
                    rotate: opts.rotate,
                };
                for (let ename in state.events) {
                    let tevent = state.events[ename];
                    for (let tstate in tevent) {
                        let fevent = tevent[tstate];
                        // Check for a condition on the transition
                        if(fevent.condition) {
                            data.nodes[opts.id + sname +"-Cond"] = {
                                id: opts.id + sname + "-Cond",
                                name: "Condition",
                                view: AStateCondition.view3D,
                                rbox: rbox,
                                rotate: opts.rotate
                            }
                            data.links.push({
                                target: opts.id + sname + "-Cond",
                                source: opts.id + sname,
                                width: 2.0,
                                value: 10,
                                name: ename,
                                relpos: 1,
                                arrow: 20,
                                color: '#aaffaa'
                            });
                            data.links.push({
                                source: opts.id + sname + "-Cond",
                                target: opts.id + tstate,
                                width: 2.0,
                                value: 10,
                                name: `[${fevent.condition.description}]` || "[TBD]",
                                relpos: 1,
                                arrow: 20,
                                color: '#aaffaa'
                            });
                        } else {
                            // Show the transition to the next state.
                            data.links.push({
                                target: opts.id + tstate,
                                source: opts.id + sname,
                                width: 2.0,
                                value: 10,
                                name: ename,
                                relpos: 1,
                                arrow: 20,
                                color: '#aaffaa'
                            });
                        }
                        // Connect the Action being called for the event
                        data.links.push({
                            source: opts.id + sname,
                            target: `${opts.id}-${ename}`,
                            width: 1.0,
                            value: 30,
                            color: "#cccccc"
                        });
                        // Connect the next state that the event transitions too.
                        data.links.push({
                            target: opts.id + tstate,
                            source: `${opts.id}-${ename}`,
                            width: 1.0,
                            value: 30,
                            color: "#ffffaa"
                        });
                    }
                }
            }
        }
        if (opts.mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
        }
        window.graph.showLinks();
    }

    static handle(results, config) {
        AStateNet.viewDeep3D(results, config);
    }
}

