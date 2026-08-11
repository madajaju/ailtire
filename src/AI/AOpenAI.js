const AIAdaptor = require("./AIAdaptor");
const OpenAI = require("openai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

class AOpenAI extends AIAdaptor {
    constructor(config) {
        super();
        if (!config.apiKey) {
            config.apiKey = process.env.OPENAI_KEY;
            if( !config.apiKey) {
                throw new Error("API key is required to use OpenAI.");
            }
        }
        this.apiKey = config.apiKey;
        this.client = null;
        this.model = config.model || 'gpt-5.4-mini';
    }

    /**
     * Initialize the OpenAI client using the provided API key.
     */
    init() {
        console.log("Initializing OpenAI adaptor...");

        this.client = new OpenAI({
            apiKey: this.apiKey
        });
        console.log("OpenAI client initialized successfully.");
    }

    async generateText(opts) {
        if (!this.client) {
            throw new Error("OpenAI client is not initialized. Call init() first.");
        }
        let model = opts.model || this.model;
        if(!model) {
            model = this.model;
        }
        
        try {
            const completion = await this.client.chat.completions.create({
                model: model,
                prompt: opts.prompt,
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error("Error while generating text:", error);
            throw error;
        }
    }

    async chat(opts) {
        if (!this.client) {
            throw new Error("OpenAI client is not initialized. Call init() first.");
        }
        let model = opts.model || this.model;
        if(!model) { model = this.model;} 
        try {
            const completion = await this.client.chat.completions.create({
                model: model,
                messages: opts.messages
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error("Error during chat completion:", error);
            throw error;
        }
    }
    async generateImage(opts) {
        if (!this.client) {
            throw new Error("OpenAI client is not initialized. Call init() first.");
        }
        const response = await this.client.images.generate({
            model: opts.model || 'gpt-image-2',
            prompt: opts.prompt,
            size: opts.size || "1024x1024",
        });

        const imageData = response.data?.[0];
        if (imageData?.url) {
            return await this.#fetchImage(imageData.url, opts.outputFilePath);
        }
        if (imageData?.b64_json) {
            const outputFilePath = opts.outputFilePath || path.join('.tmp', `${Date.now()}-${Math.random()}.png`);
            fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
            fs.writeFileSync(outputFilePath, Buffer.from(imageData.b64_json, 'base64'));
            return outputFilePath;
        }
        return response;
    }
    async #fetchImage(imageUrl, outputFilePath ) {
        try {
            const response = await axios({
                url: imageUrl,
                method: 'GET',
                responseType: 'stream', // To handle the binary stream response
            });

            // Ensure the directory exists
            outputFilePath = outputFilePath || path.join('.tmp', `${Date.now()}-${Math.random()}.png`);
            const dir = path.dirname(outputFilePath);

            fs.mkdirSync(dir, { recursive: true });

            // Create a write stream and pipe the response to it
            const writer = fs.createWriteStream(outputFilePath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(outputFilePath));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(`Error downloading image:`, error);
            throw error;
        }
    }
}

module.exports = AOpenAI;
