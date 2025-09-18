import fs from 'fs/promises';
import yaml from 'js-yaml';
import { dialog } from 'electron';

async function getFiles() {
    const { canceled, filePaths } = await dialog.showOpenDialog({properties:['openDirectory']});
    if (!canceled) {
      let res = [];
      const files = await getAllFilesRecurrent(filePaths[0]);
      // console.log(files);
      let i = 0;
      for (const file of files) {
        const fileInfo = await extractMDFileInfo(file,i);
        res.push(fileInfo);
        i++;
      }
      return res;
    }
  }

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

async function extractMDFileInfo(rawFile,index) {
    const fileContent = await fs.readFile(rawFile.path,{encoding:'utf-8'});
    const fileContents = fileContent.split('---');
    const header = yaml.load(fileContents[1].trim());
    const bodyText = fileContents.slice(2).join("---");
    const linkRegex = new RegExp("\.\.?\\.*?\.md|\.\.?\/.*?\.md","gu");
    const documentLinksSearch = bodyText.matchAll(linkRegex);
    const documentLinks = [];
    Array.from(documentLinksSearch).forEach(link => {
        const fileName = link[0].split(/\/|\\/g);
        documentLinks.push(fileName[fileName.length - 1]);
    });
    const res = {index,...rawFile, ...header, body:bodyText, links:documentLinks};
    return res;
}

export {getFiles};