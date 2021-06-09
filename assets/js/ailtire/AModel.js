import {APackage, AText, AAction, AAttribute, AStateNet} from './index.js';

export default class AModel {
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

    static form(model) {
        if (!w2ui['model' + model.name]) {
            let fields = [];
            for (let cname in model.columns) {
                let col = model.columns[cname];
                if (col.cardinality) {
                    // this should be getting the list from the server side.
                    let myItems = ['item 1', 'item 2', 'item 3', 'item 4'];
                    if (col.cardinality === 1) {
                        fields.push({
                            field: cname,
                            type: 'enum',
                            options: {
                                openOnFocus: true,
                                max: 1,
                                url: `${col.type.toLowerCase()}/list?mode=json`,
                                renderItem: (item) => {
                                    return item.name;
                                },
                                renderDrop: (item) => {
                                    return item.name;
                                },
                                onNew: (event) => {
                                    console.log("++ New Item to be added:", event);
                                    $.extend(event.item, event.item);
                                },
                                compare: function (item, search) {
                                    var fname = search,
                                        lname = search;
                                    if (search.indexOf(' ') != -1) {
                                        fname = search.split(' ')[0];
                                        lname = search.split(' ')[1];
                                    }
                                    var match = false;
                                    var re1 = new RegExp(fname, 'i');
                                    var re2 = new RegExp(lname, 'i');
                                    if (fname == lname) {
                                        if (re1.test(item.fname) || re2.test(item.lname)) match = true;
                                    } else {
                                        if (re1.test(item.fname) && re2.test(item.lname)) match = true;
                                    }
                                    return match;
                                },
                            },
                            html: {caption: col.name, attr: 'style="width:375px"'}
                        });
                    } else {
                        fields.push({
                            field: cname,
                            type: 'enum',
                            options: {
                                url: `${col.type.toLowerCase()}/list?mode=json`,
                                renderItem: (item) => {
                                    console.log("Render Item:", item);
                                    return item.name.name;
                                },
                                renderDrop: (item) => {
                                    console.log("Render Drop:", item);
                                    return item.name.name;
                                },
                                onNew: (event) => {
                                    console.log("++ New Item to be added:", event);
                                    $.extend(event.item, event.item);
                                },
                                compare: function (item, search) {
                                    let re1 = new RegExp(search, 'i');
                                    if (re1.test(item.id)) {
                                        return true;
                                    } else
                                        return re1.test(item.name.name);
                                },
                                openOnFocus: true,
                            },
                            html: {caption: col.name, attr: 'style="width:375px"'}
                        });
                    }
                } else {
                    if (!col.multiline) {
                        let limit = col.limit || 100;
                        fields.push({
                            field: cname,
                            limit: limit,
                            type: 'text',
                            required: true,
                            html: {caption: col.name, attr: `size="${limit}" style="width:375px"`}
                        });
                    } else {
                        let limit = col.limit || 100;
                        fields.push({
                            field: cname,
                            type: 'textarea',
                            required: true,
                            html: {caption: col.name, attr: `size="${limit}" style="width:375px; height:150px"`}
                        });
                    }
                }
            }
            $().w2form({
                name: 'model' + model.name,
                style: 'border: 0px; background-color: transparent;',
                fields: fields,
                actions: {
                    "save": function () {
                        this.validate();
                        console.log(this.record);
                    },
                    "reset": function () {
                        this.clear();
                    }
                }
            });
        }
    }

    static popup(item) {
        let modelName = w2ui['objlist'].modelName || 'Model';
        $().w2popup('open', {
            title: 'Edit',
            body: '<div id="editModelDialog" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 600,
            height: 800,
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
                    $('#editModelDialog').w2render('model' + modelName);
                }
            }
        });
    }

    static view3D(node, type) {
        let color = node.color || "orange";
        if (type === 'Selected') {
            color = "yellow";
        } else if (type === 'Targeted') {
            color = "red";
        } else if (type === 'Sourced') {
            color = "green";
        }
        let w = 100;
        let h = 100;
        let d = 20;
        if (node.cube) {
            w = node.cube.w;
            h = node.cube.h;
            d = node.cube.d;
        }
        let opacity = node.opacity || 1;

        let geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshPhongMaterial({color: color, transparent: true, opacity: opacity});
        const retval = new THREE.Mesh(geometry, material);
        // const myText = new SpriteText(node.name.replace(/\s/g, '\n'));
        // myText.position.set(0,40,15);
        // retval.add(myText);
        retval.aid = node.id;
        // Find the Model Element and show it here.
        let objID = "#" + node.name + '3D';
        let aframeobj = document.querySelector(objID);
        if (!aframeobj) {
            aframeobj = document.querySelector('#default3D');
        }
        let obj3D = aframeobj.object3D.clone();
        // Make the obj3D larger based on the size of the width and height.
        obj3D.applyMatrix4(new THREE.Matrix4().makeScale(w / 100, w / 100, w / 100));
        obj3D.position.set(0, 0, (d / 2) + 10);
        retval.add(obj3D);
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
        let label = AText.view3D({text: node.name, color: "#ffffff", width: w, size: 15 * (w / 100)});
        // label.applyMatrix4(new THREE.Matrix4().makeScale(w/100, w/100, w/100));
        label.position.set(0, (h / 2) - 20, (d / 2) + 1);
        retval.add(label)
        if (typeof node.box !== 'string') {
            node.box = node.box || Math.sqrt(d * d + h * h + w * w);
        } else {
            node.box = null;
        }
        node.expandLink = `model/get?id=${node.id}`;
        return retval;
    }

    static viewDeep3D(cls, mode) {
        let data = {nodes: {}, links: []};
        let atnum = Object.keys(cls._attributes).length; // XZ on the tp of the Model
        let acnum = Object.keys(cls.methods).length; //  YZ on right of the Model
        let asnum = Object.keys(cls._associations).length; // YZ on left of the Model
        let snum = 0; // XZ on the bottom of the Model.
        if (cls.statenet) {
            snum = Object.keys(cls.statenet).length;
        }
        let xnum = Math.max(acnum, snum * 3);
        let ynum = Math.max(acnum, asnum * 3);
        let znum = Math.max(acnum, atnum, asnum * 3, snum * 3);

        let xfactor = Math.round(Math.sqrt(xnum) + 0.5);
        let yfactor = Math.round(Math.sqrt(ynum) + 0.5);
        let zfactor = Math.round((znum / xfactor) + 0.5);

        const theta = 3.14 / 2;
        let model3d = {w: xfactor * 100 + 50, h: yfactor * 100 + 25, d: zfactor * 100 + 50};
        let bbox = {
            parent: cls.id,
            x: {min: -model3d.w / 2 + 20, max: model3d.w / 2 - 20},
            y: {min: -model3d.h / 2 + 20, max: model3d.h / 2 - 20},
            z: {min: -model3d.d / 2 + 20, max: model3d.d / 2 - 20},
        }

        data.nodes[cls.id] = {
            id: cls.id,
            name: cls.name,
            cube: model3d,
            opacity: 0.5,
            fx: 0, fy: 0, fz: 0,
            box: "None",
            view: AModel.view3D
        };

        let prevID = cls.id;
        let col = 0;
        let row = 0;
        let arbox = {
            parent: prevID,
            x: {min: bbox.x.min + 70, max: bbox.x.min + 70},
            y: {min: bbox.y.max + 40, max: bbox.y.max + 40},
            z: {min: bbox.z.max - 60, max: bbox.z.max - 60},
        }
        for (let aname in cls._associations) {
            let assoc = cls._associations[aname];
            let clsid = assoc.type;
            if (!data.nodes.hasOwnProperty(clsid)) {
                data.nodes[clsid] = {
                    id: clsid, name: clsid, view: AModel.view3D,
                    rbox: {
                        parent: cls.id,
                        x: {min: bbox.x.min - 200, max: bbox.x.min - 200},
                        y: {min: bbox.y.min - 200, max: bbox.x.max + 200},
                        z: {min: bbox.z.min - 200, max: bbox.z.max + 200}
                    },
                    rotate: {y: -theta}
                };
            }
            // data.links.push({target:clsid, source: cls.id, value: 0.1, name: aname, arrow: 20, relpos: 1, curve: 0.1 });
            data.nodes[`Assoc${clsid}`] = {
                id: `Assoc${clsid}`, name: `${aname} : ${assoc.type}`, view: AAttribute.view3D,
                color: 'magenta',
                rbox: arbox,
                rotate: {x: -theta}
            };
            if (clsid !== cls.id) {
                data.links.push({target: clsid, source: `Assoc${clsid}`, value: 0.0, color: 'magenta'});
            }
            prevID = `Assoc${clsid}`;
            row++;
            if (row < yfactor) {
                arbox = {
                    parent: prevID,
                    x: {min: 0, max: 0}, // Col
                    y: {min: 0, max: 0},
                    z: {min: -80, max: -80}, // Row
                }

            } else {
                row = 0;
                col++;
                arbox = {
                    parent: cls.id,
                    x: {min: bbox.x.min + 70 + (col * 120), max: bbox.x.min + 70 + (col * 120)},
                    y: {min: bbox.y.max + 40, max: bbox.y.max + 40},
                    z: {min: bbox.z.max - 60, max: bbox.z.max - 60},
                }
            }
        }

        for (let aname in cls._attributes) {
            let attr = cls._attributes[aname];
            let clsid = cls.id + aname
            data.nodes[clsid] = {
                id: clsid, name: `${aname} : ${attr.type}`, view: AAttribute.view3D,
                rbox: arbox,
                rotate: {x: -theta}
            };
            prevID = clsid;
            row++;
            if (row < yfactor) {
                arbox = {
                    parent: prevID,
                    x: {min: 0, max: 0}, // Col
                    y: {min: 0, max: 0},
                    z: {min: -80, max: -80}, // Row
                }

            } else {
                row = 0;
                col++;
                arbox = {
                    parent: cls.id,
                    x: {min: bbox.x.min + 70 + (col * 120), max: bbox.x.min + 70 + (col * 120)},
                    y: {min: bbox.y.max + 40, max: bbox.y.max + 40},
                    z: {min: bbox.z.max - 60, max: bbox.z.max - 60},
                }
            }
        }

        prevID = cls.id;
        col = 0;
        row = 0;
        arbox = {
            parent: prevID,
            x: {min: bbox.x.max + 40, max: bbox.x.max + 40},
            y: {min: bbox.y.max - 40, max: bbox.y.max - 40},
            z: {min: bbox.z.max - 60, max: bbox.z.max - 60},
        }
        for (let mname in cls.methods) {
            data.nodes[`${cls.id}-${mname}`] = {
                id: `${cls.id}-${mname}`, name: mname, view: AAction.view3D,
                rbox: arbox,
                rotate: {x: -theta, z: -theta, y: theta}
            };
            prevID = `${cls.id}-${mname}`;
            row++;
            if (row < yfactor) {
                arbox = {
                    parent: prevID,
                    x: {min: 0, max: 0}, // Col
                    y: {min: -100, max: -100}, // Row
                    z: {min: 0, max: 0},
                }
            } else {
                row = 0;
                col++;
                arbox = {
                    parent: cls.id,
                    x: {min: bbox.x.max + 40, max: bbox.x.max + 40},
                    y: {min: bbox.y.max - 40, max: bbox.y.max - 40},
                    z: {min: bbox.z.max - 60 - (col * 150), max: bbox.z.max - 60 - (col * 150)},
                }
            }
        }
        if (mode === 'add') {
            window.graph.addData(data.nodes, data.links);
        } else {
            window.graph.setData(data.nodes, data.links);
        }
        // State Net it if exists.
        if (cls.statenet) {
            let mode = {
                id: cls.id,
                ibox: {parent: cls.id, y: {min: bbox.y.min - 40, max: bbox.y.min - 40}},
                /*ibox: {
                    parent: cls.id,
                    x: {min: bbox.x.min + 40, max: bbox.x.min + 40},
                    y: {min: bbox.y.min - 40, max: bbox.min - 40},
                    z: {min: bbox.z.max - 40, max: bbox.max - 40}
                },
                */
                rbox: {parent: cls.id, y: {min: bbox.y.min - 40, max: bbox.y.min - 40}},
                rotate: {x: theta},
                mode: 'add'
            };
            AStateNet.viewDeep3D(cls.statenet, mode);
        }
        window.graph.graph.cameraPosition(
            {x: 0, y: 0, z: 1000}, // new position
            {x: 0, y: 0, z: 0}, // lookAt ({ x, y, z })
            3000  // ms transition duration.
        );
        window.graph.showLinks();
    }

    static objectList(result) {
        if (!w2ui['objlist']) {
            $('#objlist').w2grid({name: 'objlist'});
        }
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

        let records = [];
        let size = `${100 / Object.keys(result.columns).length + 1}%`;
        let cols = [{field: 'state', size: size, resizeable: true, caption: 'State', sortable: true}];
        for (let i in result.columns) {
            cols.push({
                field: result.columns[i].name,
                size: size,
                resizeable: true,
                caption: result.columns[i].name,
                sortable: true
            });
        }
        for (let i in result.records) {
            let rec = result.records[i];
            let color = AModel.scolor[`${rec.state.toLowerCase()}`];
            let ritem = {
                recid: rec.id,
                state: rec.state,
                statedetail: rec.state,
                "w2ui": {"style": {0: `background-color: ${color}`}}
            };
            for (let j in result.columns) {
                let attr = rec[j];
                let colname = j.charAt(0).toUpperCase() + j.slice(1);

                if (attr) {
                    if (attr.count) {
                        // set the non-detaul value to the count
                        ritem[colname] = attr.count;

                        // Now set the detail value
                        let values = [];
                        for (let k in attr.values) {
                            let mvalue = attr.values[k];
                            if (mvalue.link) {
                                values.push(`<span onclick="AModel.expandObject('${mvalue.link}');">${mvalue.name}</span>`);
                            } else {
                                values.push(mvalue.name);
                            }
                        }
                        ritem[j + 'detail'] = values.join(', ');
                    } else {
                        ritem[colname] = rec[j].name;
                        ritem[j + 'detail'] = rec[j].name;
                    }
                }
            }
            records.push(ritem);
        }
        w2ui['objlist'].newCallback = AModel.popup;
        w2ui['objlist'].editCallback = AModel.popup;
        w2ui['objlist'].modelName = result.name;
        w2ui['objlist'].columns = cols;
        w2ui['objlist'].records = records;
        w2ui['objlist'].onClick = function (event) {
            w2ui['objlist'].selected = event.recid;
            w2ui['objdetail'].clear();
            let record = this.get(event.recid);
            let drecords = [];
            let k = 0;
            for (let name in record) {
                if (name.includes('detail')) {
                    k++;
                    let aname = name.replace('detail', '');
                    drecords.push({recid: k, name: aname, value: record[name]});
                }
            }
            w2ui['objdetail'].add(drecords);
            window.graph.selectNodeByID(event.recid);
        }
        result.name = AModel.form(result);
        w2ui['objlist'].refresh();

        AModel.processObjectsForGraph(result, 'new');
    }

    static expandObject(link) {
        $.ajax({
            url: link,
            success: AModel.processObjectShow
        });
    }

    static processObjectShow(result) {
        if (!w2ui['objlist']) {
            $('#objlist').w2grid({name: 'objlist'});
        }
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

        let records = [];
        let cols = [
            {field: 'name', size: "20%", resizeable: true, caption: "Name", sortable: true},
            {field: 'value', size: "80%", resizeable: true, caption: "Value", sortable: true},
        ];
        let rec = result.record;
        let i = 0;
        for (let j in result.columns) {
            i++;
            let attr = rec[j];
            let ritem;
            if (attr) {
                if (attr.count) {
                    // set the non-detaul value to the count
                    // Now set the detail value
                    let values = [];
                    for (let k in attr.values) {
                        let mvalue = attr.values[k];
                        if (mvalue.link) {
                            values.push(`<span onclick="expandObject('${mvalue.link}');">${mvalue.name}</span>`);
                        } else {
                            values.push(mvalue.name);
                        }
                    }
                    ritem = {recid: rec.id, name: j, value: attr.count, detail: values.join(', ')};
                } else {
                    if (result.columns[j].cardinality === 1) {
                        ritem = {
                            recid: rec.id,
                            name: j,
                            value: rec[j].name,
                            detail: `<span onclick="expandObject('${rec[j].link}');">${rec[j].name}</span>`
                        };
                    } else {
                        ritem = {recid: rec.id, name: j, value: rec[j].name, detail: rec[j].name};
                    }
                }
                records.push(ritem);
            }
        }
        w2ui['objlist'].columns = cols;
        w2ui['objlist'].records = records;
        // Clear the detail list
        w2ui['objdetail'].clear();
        w2ui['objlist'].refresh();
        let retval = {records: {}, columns: result.columns};
        retval.records[result.record.id] = result.record;
        AModel.processObjectsForGraph(retval, 'new');
    }

    static processObjectsForGraph(objs, mode) {
        let data = {nodes: {}, links: []};
        for (let i in objs.records) {
            let rec = objs.records[i];
            data.nodes[rec.id] = {
                id: rec.id,
                name: rec.name.name,
                group: rec.className,
                level: rec.package,
                view: rec.className + '3D'
            }
            // Now add the nodes of the associations
            // Go through the cols and get the associations
            for (let j in objs.columns) {
                let col = objs.columns[j];
                let colname = col.name.toLowerCase();
                // this checks if it was an association
                if (rec[colname] && col.hasOwnProperty('cardinality')) {
                    let obj = rec[colname];
                    if (col.cardinality === 1) {
                        data.nodes[obj.id] = {
                            id: obj.id,
                            name: obj.name,
                            group: obj.type,
                            level: col.package,
                            view: obj.type + '3D'
                        };
                        if (col.owner || col.composition) {
                            data.links.push({
                                source: rec.id,
                                target: obj.id,
                                value: 0.1
                            });
                        } else {
                            data.links.push({
                                source: obj.id,
                                target: rec.id,
                                value: 0.1
                            });
                        }
                    } else {
                        for (let k in obj.values) {
                            let aobj = obj.values[k];
                            data.nodes[aobj.id] = {
                                id: aobj.id,
                                name: aobj.name,
                                group: aobj.type,
                                level: col.package,
                                view: aobj.type + '3D'
                            };
                            if (col.owner || col.composition) {
                                data.links.push({
                                    source: rec.id,
                                    target: aobj.id,
                                    value: 5
                                });
                            } else {
                                data.links.push({
                                    target: rec.id,
                                    source: aobj.id,
                                    value: 5
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

    handle(result) {
        AModel.viewDeep3D(result, 'new');
        let records = [];
        if (!w2ui['objlist']) {
            $('#objlist').w2grid({name: 'objlist'});
        }
        if (!w2ui['objdetail']) {
            $('#objdetail').w2grid({
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
        w2ui['objlist'].onClick = function (event) {
            w2ui['objdetail'].clear();
            let record = this.get(event.recid);
            let drecords = [];
            let k = 0;
            for (let name in record) {
                if (name.includes('detail')) {
                    k++;
                    let aname = name.replace('detail', '');
                    drecords.push({recid: k, name: aname, value: record[name]});
                }
            }
            w2ui['objdetail'].add(drecords);
            window.graph.selectNodeByID(event.recid);
        };
        let i = 0;
        for (let aname in result._attributes) {
            let attr = result._attributes[aname];
            records.push({recid: i++, name: aname, value: attr.type, descriptiondetail: attr.description});

        }
        for (let aname in result._associations) {
            let assoc = result._associations[aname];
            let record = {recid: i++, name: aname, value: assoc.type};
            for (let dname in assoc) {
                record[`${dname}detail`] = assoc[dname];
            }
            records.push(record);
        }
        w2ui['objlist'].records = records;
        w2ui['objlist'].refresh();
        AModel.form(result);
    }
}
