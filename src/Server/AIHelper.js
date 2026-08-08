class AIHelper {
    static async ask(messages){
        if(!global.ai) {
            let aiAdaptor = global.ailtire.ai.adaptor;
            if(aiAdaptor) {
                try {
                    if(global.ailtire.ai) {
                        global.ai = new aiAdaptor(global.ailtire.ai);
                        // this might need an await.
                        global.ai.init();
                    } else {
                        return "";
                    }
                }
                catch(e) {
                    console.error("Error initializing AI:", e.message);
                    return "";
                }
            }
        }
        return _ask(messages);
    }
    static async askForCode(messages) {
        if(!global.ai) {
            let aiAdaptor = global.ailtire.ai.adaptor;
            if(aiAdaptor) {
                try {
                    if(global.ailtire.ai) {
                        global.ai = new aiAdaptor(global.ailtire.ai);
                        // this might need an await.
                        global.ai.init();
                    } else {
                        return "";
                    }
                }
                catch(e) {
                    console.error("Error initializing AI:", e.message);
                    return "";
                }
            }
        }
        return _askForCode(messages);
    }

    static async chat(userText, session) {
        const { userId, actorKey } = session;
        const context = { userId, actorKey };

        let user = AUser.get(userId);
        let actor = AActor.get(actorKey);

        // 1) Load history as moments
        context.history = user.recentMoment({actor:actor});

        // 2) Load Practices & Insights
        context.practices = actor.practice();
        context.insights  = user.getInsight({actor:actor});

        // 3) Select the correct Guidance flow
        const guidance = await user.getGuidance({actor: actor, context:context});

        // 4) guidance.pre (inject persona, system prompts)
        const promptForHints = guidance.pre
            ? await guidance.pre(userText, context)
            : userText;

        // 5) Delegate to guidance.handle (runs hint pre/post, LLM, backend actions)
        const { replyText, nextHints, actionsToTrigger, contextUpdates, feedback } =
            await guidance.handle(promptForHints, context);

        // 6) Record a Moment for this interaction
        await AMoment.create({
            user:    userId,
            actor:   actorKey,
            action:  'chat',
            outcome: replyText,
            prompt:  userText,
            // context: { input: userText, ...contextUpdates }
        });

        // 7) Update Insights based on any feedback
        if (feedback) {
            await AInsight.updateFromFeedback(userId, actorKey, feedback);
        }

        // 8) Return structured result
        return {
            reply:       replyText,
            suggestions: nextHints || [],
            actions:     actionsToTrigger || []
        };
    }
}
module.exports=AIHelper;

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
            console.warn("Fixing the response:", e);
            console.warn(response);
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
    if(global.ai) {
        try {
            const content = await global.ai.chat({
                messages: messages
            });
            return content;
        }
        catch(e) {
            console.error("Calling OpenAI Error:", e.message);
        }
    }
    return "";
}

function _limitMessages(messages) {
    let totalLength = 0;
    let numOfMessages = 0;
    for(let i in messages) {
        totalLength += messages[i].content.length;
        if(messages[i].role === 'system') {
            numOfSystems++;
        }
    }
    if(totalLength > 100000) {
        // Find the longest system prompt and cut the end off?
        let cutNumber = Math.floor((totalLength - 100000)/numOfSystems);
        for(let i in messages) {
            if(messages[i].role === 'system') {
               messages[i].content = messages[i].content.substring(0, messages[i].content.length - cutNumber);
            }
        }
    }
    return messages;
}
