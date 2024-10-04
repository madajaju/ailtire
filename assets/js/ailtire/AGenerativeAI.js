import ANote from './ANote.js';

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
            title: 'GenAI Helper',
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
        let record = {url: saveURL};

        fields.push({
            field: 'prompt',
            type: 'textarea',
            required: true,
            html: {caption: 'Notes', attr: `style="width:500px; height:700px"`}
        });
        if (!w2ui['GenerativeAI']) {
            $().w2form({
                name: 'GenerativeAI',
                style: 'border: 0px; background-color: transparent;',
                fields: fields,
                actions: {
                    Save: {
                        caption: "Ask GenAI", style: "background: #88ff88",
                        onClick(event) {
                            let url = w2ui['GenerativeAI'].record.url;
                            let prompt = w2ui['GenerativeAI'].record.prompt;
                            w2ui.GenerativeAI.lock('Asking GenAI. Generating...', true);
                            let data = {prompt: prompt, filters:{}};
                            let filterSelected = false;
                            for(let i in w2ui.GenerativeAI.toolbar.items) {
                                let item = w2ui.GenerativeAI.toolbar.items[i];
                                if(item.checked && item.id !== "selectAll") {
                                   data.filters[item.id] = true;
                                }
                                filterSelected =true;
                            }
                            if(!filterSelected) {
                                w2alert('Please select at least one generator');
                                return;
                            }
                            $.ajax({
                                url: url,
                                type: "POST",
                                data: JSON.stringify(data),
                                contentType: "application/json",
                                success: function (result) {
                                    w2ui.GenerativeAI.unlock();
                                    w2popup.close();
                                    ANote.editDocs(result, `note/update?id=${result.id}`, "Items");
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
                },
                toolbar: {
                    items: [
                        {type: 'check', id: 'selectAll', text: 'Select All', checked: false},
                        {type: 'check', id: 'actionItems', text: 'Action Items', checked: false},
                        {type: 'check', id: 'actors', text: 'Actors', checked: false},
                        {type: 'check', id: 'classes', text: 'Classes', checked: false},
                        {type: 'check', id: 'interfaces', text: 'Interfaces', checked: false},
                        {type: 'check', id: 'packages', text: 'Packages', checked: false},
                        {type: 'check', id: 'scenarios', text: 'Scenarios', checked: false},
                        {type: 'check', id: 'useCases', text: 'Use Cases', checked: false},
                        {type: 'check', id: 'workflows', text: 'Workflows', checked: false},
                    ],
                    onClick: function (event) {
                        var toolbar = this;
                        let form = w2ui.infoForm;

                        if (event.target === 'selectAll') {
                            let selectAllChecked = !toolbar.get('selectAll').checked;

                            // Set all toolbar check item states to match 'selectAll' value
                            toolbar.set('classes', {checked: selectAllChecked});
                            toolbar.set('actionItems', {checked: selectAllChecked});
                            toolbar.set('packages', {checked: selectAllChecked});
                            toolbar.set('workflows', {checked: selectAllChecked});
                            toolbar.set('useCases', {checked: selectAllChecked});
                            toolbar.set('scenarios', {checked: selectAllChecked});
                            toolbar.set('interfaces', {checked: selectAllChecked});
                            toolbar.set('actors', {checked: selectAllChecked});
                        } else {
                            // Uncheck 'selectAll' if any individual checkbox is unchecked
                            if (!toolbar.get(event.target).checked) {
                                toolbar.set('selectAll', {checked: true});
                            }
                        }
                    }
                }
            });
        }
        w2ui.GenerativeAI.record = record;
        return w2ui['GenerativeAI'];
    }
}

