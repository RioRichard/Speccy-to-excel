// import fs from "node:fs/promises";
// import { xml2js, xml2json } from "xml-js";
// import excel from "excel4node";
// import __dirname from "path";

const fs = require("node:fs/promises");
const convert = require("xml-js");
const excel = require("excel4node");
const path = require("path");
// const xml = await fs.readFile("./Config_XML_PC/BINHNHT-PC.xml", "utf-8");

const header = ["Name", "Operating System", "CPU", "RAM", "Monitors", "Graphics", "Graphics 1", "Graphics 2", "Storage"];
async function exportData(timestamp) {
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Sheet 1');

    for (let index = 0; index < header.length; index++) {
        worksheet.cell(1, index + 1).string(header[index]);
    }

    try {
        const files = await fs.readdir(path.join(__dirname, "uploads", timestamp), { recursive: true });
        const supportFiles = files.filter(file => file.endsWith(".xml"));
        for (let index = 0; index < supportFiles.length; index++) {
            const element = supportFiles[index];
            const xml = await fs.readFile(path.join(__dirname, "uploads", timestamp, element), "utf-8");
            const summaryInfo = getData(xml);
            const name = element.replace(".xml", "");
            worksheet.cell(index + 2, 1).string(name);
            let column = 0;
            for (let index2 = 0; index2 < summaryInfo.length; index2++) {
                const info = summaryInfo[index2];
                if (Array.isArray(info)) {
                    let graphicsColumn = column;
                    info.forEach(element => {
                        worksheet.cell(index + 2, graphicsColumn + 2).string(element);
                        graphicsColumn++;
                    });
                    column += 4;
                }
                else {
                    worksheet.cell(index + 2, column + 2).string(info);
                    column++;
                }
            }

        }
        await workbook.write('output.xlsx');
    } catch (error) {
        console.log(error);
    }
}

function getData(xmlFile) {

    const json = convert.xml2js(xmlFile, {
        spaces: 4
    });
    const summaryInfo = json.elements[0].elements[0].elements;

    const data = summaryInfo.map((pcAttrs) => {
        const check = header.includes(pcAttrs.attributes.title)
        if (check) {
            if (['Graphics', 'Storage'].includes(pcAttrs.attributes.title)) {
                return [...pcAttrs.elements.map(item => item.attributes.title)];
            }
            else {
                return pcAttrs.elements[0].attributes.title
            }
        }
        return null;
    });
    return data.filter(item => item !== null);
}

module.exports = function (timestamp) {
    exportData(timestamp)
};

