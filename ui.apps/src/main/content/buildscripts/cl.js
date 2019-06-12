const fs = require('fs-extra');

const clfrags = require('./cl-fragments.js');

function outSample(name, sample) {
    const data = fs.readJSONSync('../fragments/'+name+'/'+sample);
    let out = ""
    out += clfrags.subtitle(`${data.title} (${data.group})`);
    const attrs = [['jcr:primaryType', 'nt:unstructured'], ['sling:resourceType','themecleanflex/components/'+name]];
    const children = [];
    for(let prop in data.model) {
        if(typeof data.model[prop] === 'string') {
            attrs.push( [prop, data.model[prop]] );
        } else {
            const ret = ['<'+prop+' jcr:primaryType="nt:unstructured">'];
            const list = data.model[prop];
            for(let i = 0; i < list.length; i++) {
                const child = list[i];
                const attrs = [['jcr:primaryType', 'nt:unstructured']];
                for(let prop in child) {
                    if(typeof child[prop] === 'string') {
                        attrs.push( [prop, child[prop]] );
                    }
                }
                ret.push(clfrags.tag('c',attrs));
            }
            ret.push('</'+prop+'>');
            children.push(ret.join(''));
        }
    }
    out += clfrags.tag(name, attrs, children);
    return out;
}


function buildPage(target, name, samples, readme) {
    
    const targetFolder = target+'/'+name;
    fs.mkdirsSync(targetFolder);
    const out = fs.createWriteStream(targetFolder + '/.content.xml');
    out.write(clfrags.header(name));
    out.write(clfrags.home());

    let readmeContent = ""
    if( readme ) {
        let md = fs.readFileSync('../fragments/' + name + '/readme.md', 'utf-8');
        readmeContent = clfrags.intro(md);
    }

    const samplesContent = samples.reduce( (val, sample) => val + outSample(name,sample), readmeContent )
    out.write(clfrags.container('main', samplesContent));
    out.write(clfrags.footer());
    out.close();
}

function buildIndexPage(target, pages) {
    
    const targetFolder = target;
    fs.mkdirsSync(targetFolder);
    const out = fs.createWriteStream(targetFolder + '/.content.xml');
    out.write(clfrags.header('component library'));

    let mainContent = ""
    mainContent += clfrags.title('component library');
    mainContent += clfrags.listChildren('library/',pages);

    out.write(clfrags.container('main',mainContent));
    out.write(clfrags.footer());
    out.close();
}

function forEachComponent(target = 'src/main/content/jcr_root/content/sites/themecleanflex/library', root = '../fragments/') {
    const pages = [];
    const components = fs.readdirSync(root);
    components.forEach( (name) => {
        const entry = fs.statSync(root+name);
        if(entry.isDirectory()) {
            pages.push(name);
            const files = fs.readdirSync(root+name);
            let hasEmptySample = false;
            const samples = files.filter( (name) => { 
                if (name == 'sample-empty.json') {
                    hasEmptySample = true;
                    return false;
                }
                return name.startsWith('sample') && name.endsWith('.json');
            } );
            if (hasEmptySample) samples.push('sample-empty.json');
            const readme = files.includes( 'readme.md' );
            buildPage(target, name, samples, readme);
        }
    });
    buildIndexPage(target, pages);
}

forEachComponent();
