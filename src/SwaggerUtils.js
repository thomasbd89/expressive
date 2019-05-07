const fs = require("fs");
const SwaggerUi = require("swagger-ui-express");
const RouteUtil = require("./RouteUtil.js");


function registerExpress(express, swaggerJson) {
    express.use("/docs", SwaggerUi.serve, SwaggerUi.setup(swaggerJson, {
        explorer: true,
    }));
}

function convertDocsToSwaggerDoc(
    router,
    swaggerHeader,
    swaggerDefinitions = undefined
) {
    const infoList = RouteUtil.getRoutesInfo(router);
    const paths = {};
    let tags = [];

    infoList.forEach((route) => {
        let doc = route.doc;
        if (!doc) doc = {};
        if (paths[route.path]) {
            paths[route.path][route.method] = doc;
        } else {
            paths[route.path] = {
                [route.method]: doc,
            };
        }
        tags = tags.concat(doc.tags);
    });

    tags = Array.from(new Set(tags)).map((t) => ({ name: t }));
    return {
        ...swaggerHeader,
        definitions: swaggerDefinitions,
        tags,
        paths,
    };
}

const sampleSwaggerInfo = {
    version: "1.0.0",
    title: "Expressive API",
    contact: {
        name: "Author",
        email: "Your email address",
        url: "",
    },
};

function writeSwaggerJson(
    router,
    output,
    basePath = "/",
    swaggerInfo = sampleSwaggerInfo
) {
    const swaggerHeader = getSwaggerHeader(basePath, swaggerInfo);
    const swaggerJson = convertDocsToSwaggerDoc(router, swaggerHeader);
    fs.writeFileSync(output, JSON.stringify(swaggerJson, null, 4));
}

function getSwaggerHeader(
    basePath = "/",
    swaggerInfo = sampleSwaggerInfo
) {
    return {
        "swagger": "2.0",
        "info": swaggerInfo,
        "basePath": basePath,
        "schemes": [
            "http",
            "https",
        ],
        "consumes": [
            "application/json",
        ],
        "produces": [
            "application/json",
        ],
    };
}

module.exports = {
    getSwaggerHeader,
    registerExpress,
    convertDocsToSwaggerDoc,
    writeSwaggerJson,
};
