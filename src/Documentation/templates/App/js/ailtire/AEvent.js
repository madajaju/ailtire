import {AText} from './index.js';

export default class AEvent {
    static colors = {};
    static events = {};
    static count = 0;
    static eventOffset = 0;
    static eventPosition = {row: 0, col: 0};
    static previousEvent = undefined;
    static nodes = {};
    static legend = {};
    static visible = false;
    static default = {
        fontSize: 5,
        height: 10,
        width: 40,
        depth: 5,
        corner: 1,
        cols: 40/10,
    }
    static xOffset = AEvent.default.width * 1.20;

    constructor(config) {
        this.config = config;
    }
    static showEvents() {
        AEvent.visible = true;
        window.graph.setData(AEvent.nodes, []);
    }
    static hideEvents() {
        AEvent.visible = false;
        window.graph.setData({}, []);
    }
    static calculateBox(node) {
        let nameArray = node.name.split(/\s/).map(item => {
            return item.length;
        });
        let maxLetters = nameArray.reduce(function (a, b) {
            return Math.max(a, b);
        }, -Infinity);

        let height = nameArray.length * AEvent.default.fontSize * 2;
        let width = Math.max(maxLetters * (AEvent.default.fontSize / 1.5), AEvent.default.width);
        let depth = AEvent.default.depth;
        let radius = Math.max(Math.sqrt(width * width + height * height), Math.sqrt(height * height + depth * depth), Math.sqrt(width * width + depth * depth)) / 2;

        return {w: width, h: height, d: depth, r: radius};
    }
    static viewGroup3D(node, type) {
        let size = AEvent.calculateBox(node);
        // This is the rounded cube
        let width = size.w;
        let height = size.h
        let halfWidth = width / 2;
        let halfHeight = height / 2;
        let depth = size.d;

        let color = node.color || "#ffbb88";
        let opacity = node.opacity || 0.50;

        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }

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

        // This is the rounded cube
        let group = new THREE.Mesh(geometry, material);
        let labelText = node.name.replace(/\s/g, '\n');
        let label = AText.view3D({
            text: labelText,
            color: "#ffffff",
            width: node.width,
            size: AEvent.default.fontSize
        });
        label.position.set(0, 0, (depth/2)+1);
        group.add(label);
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
        node.expandLink = `nolink`;
        node.description = node.description || node.name;
        node.getDetail = AEvent.getDetail;
        node.box = 0;
        return group;
    }
    static viewEvent3D(node, type) {
        let size = AEvent.calculateBox(node);
        // This is the cube for each event.
        let width = size.w;
        let height = size.h
        let halfWidth = width / 2;
        let halfHeight = height / 2;
        let depth = size.d;
        node.width = width;
        node.height = height;
        node.depth = depth;

        let color = node.color || "#ffbb88";
        let opacity = node.opacity || 0.50;

        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
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

        // This is the rounded cube
        let group = new THREE.Mesh(geometry, material);
        let labelText = node.name.replace(/\s/g, '\n');
        let label = AText.view3D({
            text: labelText,
            color: "#ffffff",
            width: node.width,
            size: AEvent.default.fontSize
        });
        label.position.set(0, 0, (depth/2) + 1);
        group.add(label);

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
        node.expandLink = `nolink`;
        node.getDetail = AEvent.getDetail;
        node.description = node.description || node.name;
        node.box = 0;
        return group;
    }
    static viewInstance3D(node, type) {
        // This is the rounded cube
        let width = AEvent.default.depth*2;
        let height = AEvent.default.depth;
        let halfWidth = width / 2;
        let halfHeight = height / 2;
        let depth = AEvent.default.depth;

        let color = node.color || "#ffbb88";
        let opacity = node.opacity || 0.50;

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

        let group = new THREE.Mesh(geometry, material);
        let labelText = node.name.replace(/\s/g, '\n');
        let label = AText.view3D({
            text: labelText,
            color: "#ffffff",
            width: node.width,
            size: AEvent.default.fontSize
        });
        label.position.set(0, 0, (depth/2) + 1);
        group.add(label);
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
        node.expandLink = `nolink`;
        node.getDetail = AEvent.getDetail;
        node.description = node.description || node.name;
        node.box = 0;
        return group;
    }

    static getDetail(node) {
        AEvent.showDetail(node);
    }

    static showDetail(result) {
        let records = [];
        let cols = [
            {field: 'name', size: "20%", resizeable: true, label: "Name", sortable: true},
            {field: 'value', size: "80%", resizeable: true, label: "Value", sortable: true},
        ];
        w2ui['objdetail'].clear();
        w2ui['objdetail'].columns = cols;
        let i = 0;
        records.push({recid: i++, name: 'name', value: result.object.name, detail: result.object.name});
        records.push({
            recid: i++,
            name: 'Description',
            value: result.object.description,
            detail: result.object.description
        });
        records.push({
            recid: i++,
            name: 'Type',
            value: result.object.type,
            detail: result.object.type
        });
        if (result.object.actor) {
            records.push({
                recid: i++,
                name: 'Actor',
                value: result.object.actor,
                detail: result.object.actor
            });
        }
        if (result.object.package) {
            records.push({
                recid: i++,
                name: 'Actor',
                value: result.object.package,
                detail: result.object.package
            });
        }
        // Next Activity
        for (let aname in result.object.next) {
            let next = result.object.next[aname];
            let details = new Array();
            details.push(`name^${aname}`);
            if (next.condition) {
                details.push(`condition^${next.condition.test}[${next.condition.value}]`);
            }

            records.push({recid: i++, name: "Next", value: aname, detail: details.join('|')});
        }

        w2ui['objdetail'].records = records;
        // Clear the detail list

        ASelectedHUD.update('Activity', records);
        w2ui['objdetail'].refresh();
    }

    static handle(event, message, mode) {
        let msg = "";
        if(typeof message?.message === "string") {
            msg = message.message;
        } else if(message.obj) {
            msg = message.obj.description;
        } else {
            msg = message.toString();
        }
        let data = {nodes: {}, links: []};
        // parse the event and subevent.
        let [pevent, sevent] = event.split('.');
        let pid = `E:${pevent}`;
        if (!AEvent.events.hasOwnProperty(pid) || !AEvent.nodes[pid]) {
            let numOfGroups = Object.keys(AEvent.events).length;
            data.nodes[pid] = AEvent.nodes[pid] = {
                id:pid,
                name: pevent,
                view: AEvent.viewGroup3D,
                fx: 0,
                fy: 0,
                fz: -(numOfGroups * AEvent.default.height) * 1.20,
                rotate: { x: -Math.PI/2 },
                description: pevent,
            }
            AEvent.events[pid] = {
                name: pevent,
                events: {},
                node: AEvent.nodes[pid]
            }
        }
        AEvent.nodes[pid].color = AEvent.colors[sevent] || "#ffbb88";
        AEvent.nodes[pid].description = `${msg}`;

        let id = `E:${pevent}.${sevent}`;
        let iid = `${id}.${AEvent.count++}`;
        if(!AEvent.legend.hasOwnProperty(sevent)) {
            AEvent.legend[sevent] = { name: sevent, x: AEvent.xOffset};
            AEvent.xOffset += (AEvent.default.width * 1.20);
        }
        if (!AEvent.events[pid].events.hasOwnProperty(id) || !AEvent.nodes[id]) {

            data.nodes[id] = AEvent.nodes[id] = {
                id: id,
                name: `${sevent} (1)`,
                view: AEvent.viewEvent3D,
                rotate: { x: -Math.PI/2 },
                rbox: {
                    parent: pid,
                    fx: AEvent.legend[sevent].x,
                    fy: 0,
                    fz: 0
                }
            }
            AEvent.events[pid].events[id] = {
                id: id,
                name: sevent,
                instances: [],
                node: AEvent.nodes[id],
            }

        }
        let numOfIEvents = AEvent.events[pid].events[id].instances.length;
        AEvent.nodes[id].color = AEvent.colors[sevent] || "#ffbb88";
        AEvent.nodes[id].name = `${sevent}(${numOfIEvents+1})`;
        AEvent.nodes[id].description = `${msg}`;
        let rbox = {
            parent: id,
            fz: 0
        }
        if(AEvent.previousEvent === event) {
            // Add the event on the same line as the previous
            rbox.fy = -(AEvent.eventOffset * AEvent.default.depth) * 1.20;
            rbox.fy -= (AEvent.eventPosition.row * AEvent.default.depth) * 1.20;

            // Start on the left side of the width of the event.
            rbox.fx = -((AEvent.default.width / 2) - AEvent.default.depth) + (AEvent.eventPosition.col * AEvent.default.depth*2) * 1.20;
//            rbox.fx = ((AEvent.eventPosition.col - (AEvent.default.cols/2)) * AEvent.default.depth*2) * 1.20;
            AEvent.eventPosition.col++;
            if(AEvent.eventPosition.col >= AEvent.default.cols) {
                AEvent.eventPosition = {
                    col: 0,
                    row: AEvent.eventPosition.row+1,
                }
            }
        } else  {
            AEvent.eventOffset = AEvent.eventOffset + AEvent.eventPosition.row+1;
            AEvent.eventPosition= { col: 0, row: 0};
            rbox.fx = -((AEvent.default.width / 2) - AEvent.default.depth) + (AEvent.eventPosition.col * AEvent.default.depth*2) * 1.20;
            rbox.fy = -(AEvent.eventOffset * AEvent.default.depth) * 1.20;
            AEvent.eventPosition.col++;
        }
        AEvent.previousEvent = event;
        data.nodes[iid] = AEvent.nodes[iid] = {
            id: iid,
            count: AEvent.count,
            name: `${AEvent.count}`,
            description: `${pevent}.${sevent}\n${msg}`,
            view: AEvent.viewInstance3D,
            rbox: rbox,
            color: AEvent.colors[sevent] || "#ffbb88"
        }
        AEvent.events[pid].events[id].instances.push({
            id: iid,
            name: sevent,
            message: `${msg}`,
            node: AEvent.nodes[iid]
        });
        if(AEvent.visible) {
            if (mode === 'add') {
                window.graph.addData(data.nodes, []);
            } else {
                window.graph.setData(AEvent.nodes, []);
            }
            window.graph.graph.zoomToFit(1000)
        }
    }

    static setColors(scolor) {
        AEvent.colors = scolor;
    }
}
