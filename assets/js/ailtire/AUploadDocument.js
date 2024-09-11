export default class AUploadDocument {
    static init() {
        $().w2field('addType', 'fileUploader', function(options) {
            AUploadDocument.handleFileUploader(this, options);
        });
    }

    static handleFileUploader(mObj, options) {
        let obj = $(mObj.el);
        const fieldId = `fileUpload_${Math.random().toString(36).substr(2, 9)}`;
        const fieldHtml = `
        <div id="${fieldId}_container">
            <input id="${fieldId}_file" type="file" multiple />
            <button id="${fieldId}_btn" type="submit" class="uploadButton"></button>
            <progress id="${fieldId}_status" value="0" max="100" style="display:none; width:100%;"></progress>
            <table id="${fieldId}_statusGraph"></table>
        </div>
        `
        obj.after(fieldHtml);
        obj.remove();
        mObj.url = options.url;
        $(`#${fieldId}_btn`).on('click', (event) => AUploadDocument.uploadFiles(mObj, fieldId));

    }

    static uploadFiles(obj, fieldId) {
        let file = document.getElementById(`${fieldId}_file`)
        let status = document.getElementById(`${fieldId}_status`);
        let statusGraph = document.getElementById(`${fieldId}_statusGraph`);
        status.style.display = 'block';
        status.value = 0;
        status.max = 100*file.files.length;
        const formName = $(file).closest('.w2ui-field').parents('.w2ui-form').attr('name');
        const form = w2ui[formName];
        const fieldName = $(obj.el).attr('name');
        form.record[fieldName] = [];
        let totalCount = 0;

        for (let fileIndex = 0; fileIndex < file.files.length; fileIndex++) {
            let myFile = file.files[fileIndex];
            const fileName = Math.random().toString(36).slice(-6) + myFile.name;
            form.record[fieldName].push(fileName);
            statusGraph.innerHTML = statusGraph.innerHTML + '<tr><td align="right">' + myFile.name + `</td><td><progress id="${fieldId}status${myFile.name}" max="100"></progress></td></tr>`;
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(myFile);
            fileReader.onload = async (event) => {
                const content = event.target.result;
                const CHUNK_SIZE = 50000;
                const totalChunks = event.target.result.byteLength / CHUNK_SIZE;

                // generate a file name
                let url = obj.url || 'document/upload';
                for (let chunk = 0; chunk < totalChunks + 1; chunk++) {
                    let CHUNK = content.slice(chunk * CHUNK_SIZE, (chunk + 1) * CHUNK_SIZE)
                    await fetch(`${url}?name=${myFile.name}&fileName=` + fileName, {
                        'method': 'POST',
                        'headers': {
                            'content-type': "application/octet-stream",
                            'content-length': CHUNK.length,
                        },
                        'body': CHUNK
                    });
                    let percent = Math.round(100 * chunk / totalChunks);
                    totalCount += 100/totalChunks;
                    const myFileStatus = document.getElementById(`${fieldId}status${myFile.name}`)
                    myFileStatus.value = percent;
                    status.value = totalCount;
                }
                await fetch(`${url}&name=${myFile.name}&fileName=${fileName}&completed=true`, {
                    'method': 'POST',
                    'headers': {
                        'content-type': "application/octet-stream",
                        'content-length': 0
                    },
                    'body': []
                });
                status.value = status.max;
            }
        }
    }
}