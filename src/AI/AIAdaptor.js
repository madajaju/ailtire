class AIAdaptor {
    constructor() {
        if (new.target === AIAdaptor) {
            throw new Error("Cannot instantiate an abstract class.");
        }
    }

    /**
     * Abstract method to initialize the AI adaptor
     * Must be implemented by subclasses
     */
    init() {
        throw new Error("Abstract method 'init()' must be implemented.");
    }
    async chat(model, messages) {
        return messages;
    }
    async generateText(model, prompt) {
        return prompt;
    }
    // Add other methods if needed
}
module.exports = AIAdaptor;