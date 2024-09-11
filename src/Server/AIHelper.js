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
    let tries = 0;  
    let retval = null;
    while (!valid && tries < 5) {
        try {
            if (response.includes('```')) {
                let strip = response.match(/```[a-zA-Z]*([\s\S]*?)```/i);
                response = strip[1];
                response = response.trimStart();
            }
            if(response[0] === '(') {
                response =  response;
            } else if (response[0] !== '[') {
                response = '[' + response + ']';
            }
            if(response[0] !== '(') {
                repsonse = '(' + response + ')';
            }
            retval = eval(response);
            if (typeof retval === 'string') {
                retval = eval('(' + retval + ')');
            }
            valid = true;
            tries++;
        } catch (e) {
            console.warn("Fixing the response:");
            let nMessages = [
                {
                    role: 'system', content: "Given the following error from evaluting this string with" +
                        ` javascript eval function: ${e}. Make sure the response can` +
                        " is a string that can be evaluated  whith the the following command: eval(response)." +
                        " The results of the eval call should return an array of javascript objects."
                },
                {
                    role: 'user',
                    content: `${response}`
                }];
            response = await _ask(nMessages);
        }
    }
    if(tries === 5) {
        // Try from scratch again.
        return _askForCode(messages);
    } else {
        return retval;
    }
}

async function _ask(messages) {
    const completion = await global.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages
    });
    return completion.choices[0].message.content;
}
