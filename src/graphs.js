import graphology from 'graphology';
import noverlap from 'graphology-layout-noverlap';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { forEachConnectedComponent } from 'graphology-components';
import { subgraph, toUndirected } from 'graphology-operators';

function createGraph(files) {
    const graph = new graphology.Graph();
    const nodes = [];
    // Create nodes
    for (const file of files) {
        const nodeLabel = file.title;
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
        graph.addNode(file.name,{x:nodeX,y:nodeY,label:nodeLabel,size:15,color:nodeColor});
        nodes.push(file.name);
    }
    // Create edges
    for (const file of files) {
        for (const link of file.links) {
            if (nodes.includes(link)) {
                graph.mergeEdge(file.name,link,{size:5});
            }
        }
    }
    return graph;
}

function createGraphTags(files) {
    const graph = new graphology.Graph();
    const nodes = [];
    const NODE_COLOR = '#2864D3';
    const TAG_COLOR = '#D3283F';
    // Create nodes
    for (const file of files) {
        const nodeLabel = file.title;
        const nodeX = Math.random();
        const nodeY = Math.random();
        // let nodeColorArray = [1,1,1];
        // let i = 0;
        // file.title.split('').forEach((c)=>{
        //     nodeColorArray[i%3] += c.charCodeAt(0);
        //     nodeColorArray[i%3] = nodeColorArray[i%3] % 256;
        //     i += 1;
        // });
        // const nodeColor = '#' + nodeColorArray.map((c) => c.toString(16).padStart(2,'0')).join('');
        graph.addNode(file.name,{x:nodeX,y:nodeY,label:nodeLabel,size:15,color:NODE_COLOR,subtype:'file'});
        nodes.push(file.name);
        // Edges for tags
        for (const tag of file.tags) {
            const tagX = Math.random();
            const tagY = Math.random();
            graph.mergeNode(tag,{x:tagX,y:tagY,label:tag,size:15,color:TAG_COLOR,subtype:'tag'});
            graph.mergeEdge(file.name,tag);
        }
    }
    // Create edges for files
    for (const file of files) {
        for (const link of file.links) {
            if (nodes.includes(link)) {
                graph.mergeEdge(file.name,link,{size:5});
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
    forceAtlas2.assign(partialGraph,{iterations:1000});
    noverlap.assign(partialGraph,{iterations:500});
    return partialGraph;
}

function getPartialGraphLevel1(files,fileId) {
    const thisFile = files.filter((file) => {
        return String(file.index) == fileId;
    })[0];
    const fullGraph = createGraph(files);
    const fileKey = thisFile.name;
    let partialGraph = new graphology.Graph();
    fullGraph.forEachNode((node,attributes) => {
        if (node==fileKey) {
            partialGraph.mergeNode(node,attributes);
            fullGraph.forEachNeighbor(node,(neighbor,neighbor_attributes) => {
                partialGraph.mergeNode(neighbor,neighbor_attributes);
                partialGraph.mergeEdge(node,neighbor);
            });
        }
    });
    forceAtlas2.assign(partialGraph,{iterations:1000});
    noverlap.assign(partialGraph,{iterations:500});
    return partialGraph;
}

function getPartialGraphTags(files,fileId) {
    const thisFile = files.filter((file) => {
        return String(file.index) == fileId;
    })[0];
    const fullGraph = createGraphTags(files);
    const fileKey = thisFile.name;
    let partialGraph = new graphology.Graph();
    fullGraph.forEachNode((node,attributes) => {
        if (node==fileKey) {
            partialGraph.mergeNode(node,attributes);
            fullGraph.forEachNeighbor(node,(neighbor,neighbor_attributes) => {
                if (fullGraph.getNodeAttribute(neighbor,'subtype')=='tag') {
                    partialGraph.mergeNode(neighbor,neighbor_attributes);
                    partialGraph.mergeEdge(node,neighbor);
                    fullGraph.forEachNeighbor(neighbor,(tag_neighbor,tag_neighbor_attributes) => {
                        if (fullGraph.getNodeAttribute(tag_neighbor,'subtype')=='file') {
                            partialGraph.mergeNode(tag_neighbor,tag_neighbor_attributes);
                            partialGraph.mergeEdge(neighbor,tag_neighbor);
                        }
                    });
                }
            });
        }
    });
    forceAtlas2.assign(partialGraph,{iterations:1000});
    noverlap.assign(partialGraph,{iterations:500});
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

export {createGraph, getPartialGraph, getPartialGraphLevel1, getPartialGraphTags, importGraph, exportGraph};