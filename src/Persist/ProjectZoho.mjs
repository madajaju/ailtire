import axios from 'axios';
import ProjectManagementAbstract from './ProjectManagementAbstract.mjs';
import querystring from 'querystring';

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
            try {
                let url = `https://projectsapi.zoho.com/restapi/portal/${this.portalId}/projects/${this.projectId}/tasks/`;
                const response = await axios({
                    method: "GET",
                    url: url,
                    data: payload,
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                tasks = response.data;
                done = true;
            } catch (err) {
                    this.config.access_token = this.authToken = await refreshAccessToken(this.clientId, this.clientSecret, this.refreshToken, 'https://accounts.zoho.com/oauth/v2/token');
                done = false;
            }
        }
        // let url = `https://projectsapi.zoho.com/restapi/portal/${this.portalId}/projects/${this.projectId}/tasks/`;
        let url = `https://projectsapi.zoho.com/restapi/portal/859223743/projects/2350016000000231031/tasks/`;
        const now = new Date();
        let now_date = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
        const payload = {
            name: taskInfo.name,
            start_date: "09-17-2024",
            end_date: "09-23-2024",
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
            console.log(response.data);
        }
        catch(e) {
            console.error(e);
        }
        /*
        try {

            const response = await axios({
                method: "GET",
                url: url,
                // data: payload,
                headers: {
                    'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(response.data);
            for(let i in response.data.projects) {
                let project = response.data.projects[i];
                let url = `https://projectsapi.zoho.com/restapi/portal/859223743/projects/${project.id_string}/tasks/`;
                try {
                    const resp = await axios({
                        method: "GET",
                        url: url,
                        // data: payload,
                        headers: {
                            'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(response.data);
                }
                catch(e) {
                    console.error(e.data);
                }
            }
        }

            /* 
             try {
                 const url = `https://projectsapi.zoho.com/restapi/portal/${this.portalId}/projects/${this.projectId}/tasklists/`;
                 let response = await axios.get(url, {
                     headers: {
                         'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                         'Content-Type': 'application/json'
                     }
                 });
     
                 if (response.data) {
                     console.log('Task added successfully:', response.data);
                 } else {
                     console.log('Failed to add task:', response.data);
                 }
             }
         /* 
                 let url = 'https://projectsapi.zoho.com/restapi/portals/';
                 let response = await axios.get(url, {
                     headers: {
                         'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                         'Content-Type': 'application/json'
                     }
                 });
     
                 if (response.data) {
                     console.log('Task added successfully:', response.data);
                 } else {
                     console.log('Failed to add task:', response.data);
                 }
                 console.log(response.data.portals[0].name, response.data.portals[0].id);
                 let portal_id = "859223743";
                 url = `https://projectsapi.zoho.com/restapi/portal/embracingdigital/projects/`;
                 response = await axios.get(url, {
                     headers: {
                         'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                         'Content-Type': 'application/json'
                     }
                 });
                 if (response.data) {
                     console.log('Task added successfully:', response.data);
                 } else {
                     console.log('Failed to add task:', response.data);
                 }
                 url = `https://projectsapi.zoho.com/restapi/portal/embracingdigital/projects/`;
                 response = await axios.get(url, {
                     headers: {
                         'Authorization': `Zoho-oauthtoken ${this.authToken}`,
                         'Content-Type': 'application/json'
                     }
                 });
                 if (response.data) {
                     console.log('Task added successfully:', response.data);
                 } else {
                     console.log('Failed to add task:', response.data);
                 }
                 
            catch (error) {
            console.error('Error adding task:', error);
        }
         */
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
        return response.data.access_token;
    } catch (err) {
        console.error('Error refreshing access token:', err.response ? err.response.data : err.message);
        throw err;
    }
}
