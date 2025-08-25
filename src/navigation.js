import fs from 'fs/promises';
import yaml from 'js-yaml';

// async function getAllFilesRecurrent(directoryHandler) {
//     // Recurrent reading
//     const files = [];
//     for await (const [name, handle] of directoryHandler.entries()) {
//         if (handle.kind === 'file') {
//             const extension = name.split('.').pop();
//             if (extension === 'md') {
//                 files.push({name,handle});
//             }
//         } else if (handle.kind === 'directory') {
//             files.push(...await getAllFilesRecurrent(handle));
//         }
//     }
//     return files;
// }

async function getAllFilesRecurrent(path) {
    const files = [];
    const filepaths = await fs.readdir(path);
    for (const file of filepaths) {
        const hasSlash = /\\/.test(path);
        let subpath = path + '/' + file;
        if (hasSlash) {
            subpath = path + '\\' + file;
        }
        const fileType = await fs.lstat(subpath);
        if (fileType.isDirectory()) {
            files.push(...await getAllFilesRecurrent(subpath));
        } else {
            const extension = file.split('.').pop();
            if (extension === 'md') {
                files.push({name:file,path:subpath});
            }
        }
    }
    return files;
}

// async function extractMDFileInfo(handle) {
//     res = {}
//     f = await handle.getFile();
//     fileContent = await f.text();
//     fileContents = fileContent.split('---');
//     console.log(fileContents);
//     header = yaml.load(fileContents[1].trim());
//     console.log(header);
//     return res;
// }

async function extractMDFileInfo(rawFile,index) {
    const fileContent = await fs.readFile(rawFile.path,{encoding:'utf-8'});
    const fileContents = fileContent.split('---');
    const header = yaml.load(fileContents[1].trim());
    const res = {index,...rawFile, ...header, body:fileContents[2]};
    return res;
}

export {getAllFilesRecurrent, extractMDFileInfo};