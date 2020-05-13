'use strict';

var fs = require('fs');
var pathNode = require('path');
var template = require('./lib/template-web');
var responseObj = require('./lib/response');

let htmlPaths = responseObj.htmlPaths,
  map = responseObj.map,
  response = responseObj.response;

function filter(root) {
  loadconfig(root);
  route(root);
  return response(root);
}

function loadconfig(root) {
  try {
    var data = fs.readFileSync(root + '/config.json', 'utf-8');
    try {
      let config = JSON.parse(data);
      if (config.mapping && config.mapping.length > 0) {
        responseObj.mapping = config.mapping;
      }
      if (config.import) {
        template.defaults.imports.$import = {};
        for (var i = 0; i < config.import.length; i++) {
          let path = config.import[i];
          try {
            var code = fs.readFileSync(root + '/' + path, 'utf-8');
            code = '(function(root) {' + code + '})(template.defaults.imports.$import);';
            eval(code);
          } catch (e) {
            console.log('error js: ' + path, e);
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
        if (ignorePath.startsWith('/')) ignorePath = ignorePath.substring(1);
        if (ignorePath.endsWith('/')) ignorePath = ignorePath.substring(0, ignorePath.length - 1);
        responseObj.ignorePath = ignorePath;
      }
      if (config.debug != undefined) {
        responseObj.debug = config.debug;
      }
    } catch (e) {
      console.error('config.json need json format!');
    }
  } catch (e) {}
}

function route(root) {
  clearMap();
  if (typeof root == 'string') {
    let rootLen = root.length;
    readDirSync(root);
    function readDirSync(pathStr) {
      var files = fs.readdirSync(pathStr);
      files.forEach(function(ele, index) {
        let filePath = pathNode.join(pathStr, ele);
        let info = fs.statSync(filePath);
        if (info.isDirectory()) {
          if (ele != 'node_modules') readDirSync(filePath);
        } else {
          addMap(filePath.substring(rootLen));
        }
      });
    }
  } else {
    responseObj.assets = root;
    Object.keys(assets).forEach(key => {
      addMap(pathNode.sep + key);
    });
  }
  sortMap();
}

function clearMap() {
  htmlPaths.clear();
  map.splice(0, map.length);
}

function sortMap() {
  map.sort(function(a, b) {
    return a.sort < b.sort ? 1 : -1;
  });
}

function addMap(filePath) {
  //console.log(filePah)
  var fileName = pathNode.win32.basename(filePath);
  if (!fileName.startsWith('_') && fileName.endsWith('.html')) {
    let reg = new RegExp(pathNode.sep + pathNode.sep, 'g');
    let realPath = filePath.replace(reg, '/');
    let routePath = realPath.replace('-.html', '');
    routePath = routePath.replace(/\+/g, '/');
    routePath = routePath.replace(/\$/g, '([^/]*?)');
    if (routePath != realPath) {
      var sort = 0;
      for (var i = 0; i < realPath.length; i++) {
        var str = realPath.charAt(i);
        sort += (str == '$' ? 1 : 2) * 10 * (realPath.length - i);
      }
      map.push({
        key: '^' + routePath + '$',
        value: realPath,
        sort: sort
      });
    } else {
      htmlPaths.add(realPath);
    }
  }
}

module.exports = {
  filter: filter,
  route: route,
  response: response,
  loadconfig: loadconfig
};
