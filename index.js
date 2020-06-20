"use strict";

var fs = require("fs");
var pathNode = require("path");
var template = require("./lib/template-web");
var application = require("./core/application");
var routeMap = require("./core/routeMap");
var response = require("./core/response");

let clearMap = routeMap.clearMap,
  sortMap = routeMap.sortMap,
  addMap = routeMap.addMap;

function filter(root) {
  loadconfig(root);
  route(root);
  return response(root);
}

function loadconfig(root) {
  try {
    var data = fs.readFileSync(root + "/config.json", "utf-8");
    try {
      let config = JSON.parse(data);
      if (config.mapping && config.mapping.length > 0) {
        application.data.mapping = config.mapping;
      }
      if (config.import) {
        template.defaults.imports.$import = {};
        for (var i = 0; i < config.import.length; i++) {
          let path = config.import[i];
          try {
            var code = fs.readFileSync(root + "/" + path, "utf-8");
            code =
              "(function(root) {" +
              code +
              "})(template.defaults.imports.$import);";
            eval(code);
          } catch (e) {
            console.log("error js: " + path, e);
          }
        }
      }
      if (config.config) {
        var set = {};
        Object.assign(set, config.config);
        template.defaults.imports.$config = set;
      }
      if (config.ignorePath) {
        var ignorePath = config.ignorePath;
        if (ignorePath.startsWith("/")) ignorePath = ignorePath.substring(1);
        if (ignorePath.endsWith("/"))
          ignorePath = ignorePath.substring(0, ignorePath.length - 1);
        application.data.ignorePath = ignorePath;
      }
      if (config.debug != undefined) {
        application.data.debug = config.debug;
      }
    } catch (e) {
      console.error("config.json need json format!");
    }
  } catch (e) {}
}

function route(root) {
  clearMap();
  if (typeof root == "string") {
    let rootLen = root.length;
    readDirSync(root);
    function readDirSync(pathStr) {
      var files = fs.readdirSync(pathStr);
      files.forEach(function (ele, index) {
        let filePath = pathNode.join(pathStr, ele);
        let info = fs.statSync(filePath);
        if (info.isDirectory()) {
          if (ele != "node_modules") readDirSync(filePath);
        } else {
          addMap(filePath.substring(rootLen));
        }
      });
    }
  } else {
    application.data.assets = root;
    Object.keys(root).forEach((key) => {
      addMap(pathNode.sep + key);
    });
  }
  sortMap();
}

module.exports = {
  filter: filter,
  route: route,
  response: response,
  loadconfig: loadconfig,
};
