export default class ProjectManagementAbstract {
    static _instances = [];

    constructor(params) {
        this.config = params;
    }

    async addTask(taskInfo) {
        throw new Error("addTask method must be implemented!");
    }
    async getTask(taskId) {
        throw new Error("getTask method must be implemented!");
    }
    async getTasks() {
        throw new Error("getTasks method must be implemented!");
    }
}
