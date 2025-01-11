const AIAdaptor = require("./AIAdaptor");
const OpenAI = require("openai");

class AOpenAI extends AIAdaptor {
    constructor(config) {
        super();
        if (!config.apiKey) {
            throw new Error("API key is required to use OpenAI.");
        }
        this.apiKey = config.apiKey;
        this.client = null;
        this.model = config.model || 'gpt-4o-mini';
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
}

module.exports = AOpenAI;