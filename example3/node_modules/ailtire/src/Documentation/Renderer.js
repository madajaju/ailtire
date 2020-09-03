const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

module.exports = {
    render: (layout, page, objs) => {
        // Render page first and then inject it into the layout.
        let tmpString = renderPage(page,objs);
        objs.body = tmpString;
        if(!layout) {
            layout = "default"
        }
        let pageString = renderPage('layouts/' + layout, objs);
        return pageString;
    },
    partial: (page, objs) => {
        let tmpString = renderPage(page, objs);
        return tmpString;
    },
    renderString: (layout, str, objs) => {
        let tmpString = renderString(str, objs);
        objs.body = tmpString;
        if(!layout) {
            layout = "default"
        }
        let pageString = renderPage('layouts/' + layout, objs);
        return pageString;
    },
};
const renderString = (str, objects) => {
    objects.partial = partialProcess;
    try {
        let retval = ejs.render(str, objects);
        return retval;
    } catch (e) {
        console.error("Renderering Error:", e);
        console.error("Renderering Error:", str, "with", objects);
    }
    return "";
};
const renderPage = (page, objects) => {
    let apath = path.resolve('./views/' + page + '.ejs');
    objects.partial = partialProcess;
    try {
        let str = fs.readFileSync(apath, 'utf8');
        let retval = ejs.render(str, objects);
        return retval;
    } catch (e) {
        console.error("Renderering Error:", e);
        console.error("Renderering Error:", page, "with", objects);
    }
    return "";
};
const partialProcess = (file, objects) => {
    // Look to find the file starting with the views directory
    let apath = path.resolve(file);
    if(!fs.existsSync(apath)) {
        apath = path.resolve('./views/' + file);
        if(!fs.existsSync(apath)) {
            apath = path.resolve(__dirname + '../../views/' + file);
        }
    }

    try {
        let str = fs.readFileSync(apath, 'utf8');
        let retval = ejs.render(str, objects);
        return retval;
    } catch (e) {
        console.error("Partial Parsing Error:", e);
        console.error("Partial Parsing:", file);
        return "";
    }
};
