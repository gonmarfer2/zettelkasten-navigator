import graphology from 'graphology';
import noverlap from 'graphology-layout-noverlap';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { forEachConnectedComponent } from 'graphology-components';
import { subgraph } from 'graphology-operators';

function createGraph(files) {
    const graph = new graphology.Graph();
    const nodes = [];
    // const nodesCoords = [];
    // Create nodes
    for (const file of files) {
        // let nodeX = 0;
        // let nodeY = 0;
        // let usedLinks = 0;
        // if (file.links.length > 0) {
        //     for (const link of file.links) {
        //         if(graph.hasNode(link)) {
        //             graph.forEachNode((node) => {
        //                 if (node.key == link) {
        //                     nodeX += node.getAttribute('x');
        //                     nodeY += node.getAttribute('y');
        //                     usedLinks += 1;
        //                 }
        //             });
        //         }
        //     }
        //     nodeX /= usedLinks;
        //     nodeY /= usedLinks;
        // }

        // if (usedLinks == 0) {
        //     nodeX = Math.random();
        //     nodeY = Math.random();
        // }
        const nodeLabel = file.title;
        // if (nodeLabel.length > 32) {
        //     const spaceAmount = Math.floor(nodeLabel.length / 32);
        //     nodeLabel = nodeLabel.split('');
        //     for (let i = spaceAmount - 1; i >= 1; i--) {
        //         nodeLabel.splice(32*i,0,'\n');
        //     }
        //     nodeLabel = nodeLabel.join('');
        // }
        // console.log(nodeLabel);
        const nodeX = Math.random();
        const nodeY = Math.random();
        let nodeColorArray = [1,1,1];
        let i = 0;
        file.title.split('').forEach((c)=>{
            nodeColorArray[i%3] += c.charCodeAt(0);
            nodeColorArray[i%3] = nodeColorArray[i%3] % 256;
            i += 1;
        });
        const nodeColor = '#' + nodeColorArray.map((c) => c.toString(16).padStart(2,'0')).join('');
        graph.addNode(file.name,{x:nodeX,y:nodeY,label:nodeLabel,size:10,color:nodeColor});
        nodes.push(file.name);
    }
    // Create edges
    for (const file of files) {
        for (const link of file.links) {
            if (nodes.includes(link)) {
                graph.mergeEdge(file.name,link);
            }
        }
    }
    return graph;
}

function getPartialGraph(files,fileId) {
    const thisFile = files.filter((file) => {
        return String(file.index) == fileId;
    })[0];
    const fullGraph = createGraph(files);
    const fileKey = thisFile.name;
    let partialGraph = null;
    forEachConnectedComponent(fullGraph, component => {
        const componentGraph = subgraph(fullGraph,component);
        if (componentGraph.hasNode(fileKey)) {
            partialGraph = componentGraph;
        }
    });
    forceAtlas2.assign(partialGraph,{iterations:150});
    // noverlap.assign(partialGraph,{iterations:150});
    return partialGraph;
}

function importGraph(jsonData) {
    const graph = new graphology.Graph();
    graph.import (jsonData);
    return graph;
}

function exportGraph(graph) {
    return graph.export();
}

export {createGraph, getPartialGraph, importGraph, exportGraph};