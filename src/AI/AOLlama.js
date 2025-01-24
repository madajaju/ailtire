const axios = require("axios");
const AIAdaptor = require("./AIAdaptor");
const execSync = require("child_process").execSync;

class AOLlama extends AIAdaptor {
    constructor(config) {
        super();
        if (!config.url) {
            throw new Error("API URL is required to connect to the LLaMA server.");
        }
        this.apiUrl = config.url; // The server URL hosting the LLaMA model
        this.model = config.model || 'llama3.2';
    }

    /**
     * Initialize the LLaMA client connection.
     * Since axios doesn't require real initialization (but a test request could be done),
     * this method can optionally ensure the server is accessible.
     */
    async init() {
        console.log("Initializing LLaMA adaptor...");

        try {
            await _startOLlama(this);
            console.log("LLaMA Pulling model:", this.model);
            let response = await axios.post(`${this.apiUrl}/api/pull`, {
                model: this.model,
            });
            if (response.status === 200) {
                console.log(`LLaMA model ${this.model} is up and ready.`);
                return;
            } else {
                throw new Error(`LLaMA server health check failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error while connecting to the LLaMA server:", error.message || error);
            throw new Error("Failed to connect to the LLaMA API. Ensure the API URL is correct.");
        }
    }

    async generateText(opts) {
        if (!this.apiUrl) {
            throw new Error("LLaMA server URL is not set. Ensure the adaptor is configured correctly.");
        }
        let model = opts.model || this.model;
        try {
            const response = await axios.post(`${this.apiUrl}/api/generate`, {
                model: model,
                prompt: opts.prompt,
            });

            if (response.status === 200 && response.data && response.data.text) {
                return response.data.text.trim(); // Return the generated text
            } else {
                throw new Error("Unexpected response from LLaMA API.");
            }
        } catch (error) {
            console.error("Error while generating text from LLaMA server:", error.message || error);
            throw new Error("Failed to generate text from the LLaMA server.");
        }
    }

    async chat(opts) {
        if (!this.apiUrl) {
            throw new Error("LLaMA server URL is not set. Ensure the adaptor is configured correctly.");
        }

        let model = opts.model || this.model;
        try {
            const response = await axios.post(`${this.apiUrl}/api/chat`, {
                // const response = await Ollama.generate({
                raw: true,
                stream: false,
                model: model,
                messages: opts.messages,
            });

            if (response.status === 200 && response.data) {
                return response.data.message.content.trim();
            } else {
                throw new Error("Unexpected response from LLaMA API.");
            }
        } catch (error) {
            console.error("Error while generating text from LLaMA server:", error.message || error);
            throw new Error("Failed to generate text from the LLaMA server.");
        }
    }
}

const _sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function _startOLlama(obj) {
    let completed = false;
    let timeout = 1000;
    while (!completed) {
        try {
            console.log(`Checking OLlama accessibility at ${obj.apiUrl}/api/version`);
            let response = await axios.get(`${obj.apiUrl}/api/version`);
           
            if (response.status !== 200) {
                console.log("Starting OLlamA server...");
                const cmd = 'docker run -d --rm -v ollama:/root/.ollama -p 11434:11434 --name ailtire-aihelper madajaju/ailtire-aihelper:latest';
                let results = await execSync(cmd);
                console.log(results.toString());
                await _sleep(timeout);
                timeout *= 2;
            } else {
                completed = true;
            }
        } catch(error) {
            console.log("Starting OLlamA server...");
            const cmd = 'docker run -d --rm -v ollama:/root/.ollama -p 11434:11434 --name ailtire-aihelper madajaju/ailtire-aihelper:latest';
            let results = await execSync(cmd);
            console.log(results.toString());
            await _sleep(timeout);
            timeout *= 2;
        }
    }
    return;
}

module.exports = AOLlama;
