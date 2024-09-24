import path from "path";
import fs from "fs";
import ProjectManagementFactory from "../Persist/ProjectManagementFactory.mjs";

export default class AActionItem {
    static _instances = [];

    constructor(params) {
        for(let pname in params) {
            this[pname] = params[pname];
        }
        return this;
    }

    async save() {
        let projectManager = await ProjectManagementFactory.create(global.ailtire.config.projectManager);
        let retval = await projectManager.addTask(this);
        return retval;
    }

}