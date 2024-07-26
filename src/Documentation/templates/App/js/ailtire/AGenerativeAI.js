/*
 * Copyright 2023 Intel Corporation.
 * This software and the related documents are Intel copyrighted materials, and your use of them is governed by
 * the express license under which they were provided to you (License). Unless the License provides otherwise,
 * you may not use, modify, copy, publish, distribute, disclose or transmit this software or the related documents
 * without  Intel's prior written permission. This software and the related documents are provided as is, with no
 * express or implied warranties, other than those that are expressly stated in the License.
 *
 */

export default class AGenerativeAI {
    constructor(config) {
        this.config = config;
    }

    static default = {
        fontSize: 20,
        height: 20,
        width: 100,
        depth: 20
    }

    static inputPopup(url) {
        let myForm = AGenerativeAI.inputForm(url);

        $().w2popup('open', {
            title: 'Generative AI Prompt',
            body: '<div id="WorkflowPopup" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 800,
            height: 900,
            showMax: true,
            onToggle: function (event) {
                $(w2ui.editModelDialog.box).hide();
                event.onComplete = function () {
                    $(w2ui.workflowInput.box).show();
                    w2ui.workflowInput.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler,
                    // which would make this code execute too early and hence not deliver.
                    $('#WorkflowPopup').w2render(myForm.name);
                }
            }
        });
    }
    static inputForm(saveURL) {
        let fields = [];
        let record = { url: saveURL };
        fields.push({
            field: 'prompt',
            type: 'textarea',
            required: true,
            html: {label: 'Prompt', attr: `style="width:500px; height:700px"`}
        });
        if(!w2ui['GenerativeAI']) {
            $().w2form({
                name: 'GenerativeAI',
                style: 'border: 0px; background-color: transparent;',
                fields: fields,
                actions: {
                    Save: {
                        caption: "Ask GenAI", style: "background: #aaffaa",
                        onClick(event) {
                            let url = w2ui['GenerativeAI'].record.url;
                            let prompt = w2ui['GenerativeAI'].record.prompt;
                            w2ui.GenerativeAI.lock('Asking GenAI. Generating...', true);
                            let data = { prompt: prompt };
                            $.ajax({
                                url: url,
                                type: "POST",
                                data: JSON.stringify(data),
                                contentType: "application/json",
                                success: function (result) {
                                    w2ui.GenerativeAI.unlock();
                                    w2popup.close();
                                    let workflowsAdded = "";
                                    for(let i in result) {
                                        let workflow = result[i];
                                        workflowsAdded += `${workflow.category}/${workflow.name}\n`;
                                    }
                                    alert(`Workflows Added:\n${workflowsAdded}\n`);
                                }
                            });
                        }
                    },
                    custom: {
                        caption: "Close", style: 'background: pink;',
                        onClick(event) {
                            w2popup.close();
                        }
                    }
                }
            });
        }
        w2ui.GenerativeAI.record = record;
        return w2ui['GenerativeAI'];
    }
}

