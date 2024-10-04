import axios from 'axios';
import ProjectManagementAbstract from './ProjectManagementAbstract.mjs';
import querystring from 'querystring';
import AAplication from '../../src/Server/AApplication.js';
import AIHelper from '../../src/Server/AIHelper.js';

export default class ProjecgtZoho extends ProjectManagementAbstract {
    static _instances = [];

    constructor(params) {
        super(params);
        this.config = params;
        this.authToken = this.config.access_token;
        this.projectId = this.config.projectId;
        this.clientId = this.config.client_id;
        this.clientSecret = this.config.client_secret;
        this.refreshToken = this.config.refresh_token;
        this.portalId = this.config.portalId;
    }
    async addTask(taskInfo) {
        // First make sure the project is correct by getting the tasks of the project.
        let done = false;
        let tasks = null;
        while (!done) {
            // Get all of the tasks.
            try {
                let url = `https://projectsapi.zoho.com/restapi/portal/${this.portalId}/projects/${this.projectId}/tasks/`;
                const response = await axios({
                    method: "GET",
                    url: url,
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                tasks = response.data;
                done = true;
            } catch (err) {
                if(err.status === 401) {
                    this.config.access_token = this.authToken = await refreshAccessToken(this.clientId, this.clientSecret, this.refreshToken, 'https://accounts.zoho.com/oauth/v2/token');
                    global.ailtire.config.projectManager = this.config;
                    AAplication.saveConfig();
                } else {
                    console.error(err);
                }
                done = false;
            }
        }
        // check if the actionitem is already in the project.
        let task = await _getProjectTasks(tasks.tasks, taskInfo);
        // let url = `https://projectsapi.zoho.com/restapi/portal/${this.portalId}/projects/${this.projectId}/tasks/`;
        if(task) {
            return task;
        } else {
            // let url = `https://projectsapi.zoho.com/restapi/portal/859223743/projects/2350016000000231031/tasks/`;
            let url = `https://projectsapi.zoho.com/restapi/portal/${this.portalId}/projects/${this.projectId}/tasks/`;
            const now = new Date();
            let now_date = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getFullYear()}`;
            const payload = {
                name: taskInfo.name,
                start_date: now_date,
                end_date: now_date,
                description: taskInfo.description,
            };
            url += `?${querystring.stringify(payload)}`;
            try {
                const response = await axios({
                    method: "POST",
                    url: url,
                    data: payload,
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return {id: response.data.tasks[0].key};
            } catch (e) {
                console.error(e);
            }
        }
    }

    async getTask(taskId) {
        throw new Error("getTask method must be implemented!");
    }

    async getTasks() {
        throw new Error("getTasks method must be implemented!");
    }
}

async function refreshAccessToken(clientId, clientSecret, refreshToken, tokenUrl) {
    try {
        const response = await axios({
            method: 'post',
            url: tokenUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }).toString(),
        });
        if(response.data.error) {
            throw new Error(response.data.error);
        }
        return response.data.access_token;
    } catch (err) {
        console.error('Error refreshing access token:', err.response ? err.response.data : err.message);
        throw err;
    }
}

async function _getProjectTasks(tasks,info) {

    let queryTasks = {};
    for(let i in tasks) {
        queryTasks[tasks[i].key] = { name: tasks[i].name, description: tasks[i].description, key: tasks[i].key };
    }
    // First pass is to not use AI but just look to see if the info matches
    let messages= [
        {
            role:'system',
            content: `Take the user prompt and find a matching task based on the name and return the key. If one does not exists return an empty array. The list of tasks is as follows: ${JSON.stringify(queryTasks)}`,
        },
        {
            role:'user',
            content: JSON.stringify(info),
        }
    ]
    let results = await AIHelper.askForCode(messages);
    if(results.length > 0) {
        return results[0];
    }  else { return null; }
}