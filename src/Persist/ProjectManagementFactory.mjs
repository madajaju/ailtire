import ProjectZoho from './ProjectZoho.mjs';

export default class ProjectManagementFactory {
    static _instances = [];

    static create(config) {
        console.log(config);
        switch (config.type) {
            case 'zoho':
                return new ProjectZoho(config);
                break;
        }
    }
}
