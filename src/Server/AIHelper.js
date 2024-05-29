module.exports = {
    ask: async (messages) => {
        return _ask(messages);
    },
    askForCode: async (messages) => {
        return _askForCode(messages);
    },
}

async function _askForCode(messages) {
    let response = await _ask(messages);
    let valid = false;
    let retval = null;
    while (!valid) {
        try {
            if (response.includes('```')) {
                let strip = response.match(/```[a-zA-Z]*([\s\S]*?)```/i);
                response = strip[1];
                response = response.trimStart();
            }
            if (response[0] !== '[') {
                response = '[' + response + ']';
            }
            retval = eval('(' + response + ')');
            if (typeof retval === 'string') {
                retval = eval('(' + retval + ')');
            }
            valid = true;
        } catch (e) {
            console.warn("Fixing the response:", response);
            let nMessages = [
                {
                    role: 'system', content: "Given the following error from evaluting this string with" +
                        ` javascript eval function: ${e}. Make sure the response can` +
                        " be evaluated as javascript that can be evalutated with the eval( '(' + response + ')')" +
                        " function. The results of the eval call should return an array of javascript objects."
                },
                {
                    role: 'user',
                    content: `${response}`
                }];
            response = await _ask(nMessages);
        }
    }
    return retval;
}

async function _ask(messages) {
    const completion = await global.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages
    });
    return completion.choices[0].message.content;
}
