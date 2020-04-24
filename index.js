"use strict";

var parseUrl = require("parseurl");
var fs = require("fs");
var pathNode = require("path");
var template = require("./lib2/template-web");
var analyzeHtml = require("./lib2/analyzeHtml");
var queryLazyPageSelector = require("./lib/queryLazyPage");
var queryhelp = require("./lib/queryhelp").QueryHelp;

var mapping;
let htmlPaths = new Set();
let map = [];
var assets;

module.exports = {
  filter: filter,
  //host: host,
  route: route,
  response: response,
  loadconfig: loadconfig
  //loadjs: loadjs
};

/* function host(_realHost) {
  realHost = _realHost;
} */
function loadjs(code, alias){
  template.defaults.imports.$import[alias] = code;
}

function loadconfig(root){
  try{
    var data=fs.readFileSync(root + "/config.json", 'utf-8');
    try{
      let config = JSON.parse(data);
      if(config.mapping && config.mapping.length>0){
        mapping = config.mapping;
      }
      if(config.import){
        template.defaults.imports.$import = {};
        for(var key in config.import){
          let path = config.import[key];
          try{
            var code=fs.readFileSync(root+"/"+path, 'utf-8');
            loadjs(eval(code), key);
            /* loadjs(require(__dirname+"/"+root+"/"+js.path), js.alias); */
          }catch(e){
            console.log("error js: "+path, e);
          }
        }
      }
      if(config.config){
        var set ={};
        Object.assign(set, config.config);
        template.defaults.imports.$config = set;
      }
    }catch(e){
      console.error("config.json need json format!");
    }
  }catch(e){}
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
    assets = root;
    Object.keys(assets).forEach((key) => {
      addMap(pathNode.sep + key);
    });
  }
  sortMap();
}

function clearMap() {
  htmlPaths = new Set();
  map = [];
}

function sortMap() {
  map.sort(function (a, b) {
    return a.sort < b.sort ? 1 : -1;
  });
  //console.log(map);
}

function addMap(filePath) {
  //console.log(filePah)
  var fileName = pathNode.win32.basename(filePath);
  if (!fileName.startsWith("_") && fileName.endsWith(".html")) {
    let reg = new RegExp(pathNode.sep + pathNode.sep, "g");
    let realPath = filePath.replace(reg, "/");
    let routePath = realPath.replace("-.html", "");
    routePath = routePath.replace(/\+/g, "/");
    routePath = routePath.replace(/\$/g, "([^/]*?)");
    if (routePath != realPath) {
      var sort = 0;
      for (var i = 0; i < realPath.length; i++) {
        var str = realPath.charAt(i);
        sort += (str == "$" ? 1 : 2) * 10 * (realPath.length - i);
      }
      map.push({
        key: "^" + routePath + "$",
        value: realPath,
        sort: sort,
      });
    } else {
      htmlPaths.add(realPath);
    }
  }
}

function response(root) {
  //console.log('root:' + root);
  return (req, res, next) => {
    var path = parseUrl(req).pathname;
    //console.log('---------------' + path);
    var cookies = req.headers.cookie;
    var pathParams = null;
    var ext = pathNode.extname(path);
    ext = ext.length > 0 ? ext.slice(1) : "unknown";
    var fileName = pathNode.basename(path);
    var hitHtml = false;
    if (ext != "unknown" && ext != "html") {
      next();
    } else if (fileName.startsWith("_") && ext == "html") {
      next();
    } else {
      if (htmlPaths.has(path)) {
        hitHtml = true;
      } else if (path.endsWith("/") && htmlPaths.has(path + "index.html")) {
        hitHtml = true;
        path = path + "index.html";
      } else {
        for (var i = 0; i < map.length; i++) {
          var key = map[i].key;
          let reg = new RegExp(key, "i");
          if (reg.test(path)) {
            let group = reg.exec(path);
            path = map[i].value.substring(1);
            if (group.length > 1) {
              pathParams = group.slice(1, group.lengths);
            }
            hitHtml = true;
            break;
          }
        }
      }
      if (hitHtml) {
        //console.log(path);
        if (root && typeof root == "string") {
          fromDir(root, path, function (html) {
            lazypage(req, res, html, pathParams, cookies, next);
          });
        } else {
          lazypage(req, res, assets[path].source(), pathParams, cookies, next);
        }
      } else {
        next();
      }
    }
  };
}

function fromDir(root, path, callback) {
  fs.readFile(root + "/" + path, "utf-8", function (err, html) {
    if (err) {
      console.log(err);
      next("code 404, file not found");
    } else {
      callback(html);
    }
  });
}

function lazypage(req, res, html, pathParams, cookies, next) {
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  var urls = fullUrl.split("?");
  //query = query.length > 1 ? query[1] : null;
  try {
    //console.log(mapping, urls[0], urls[1]);
    new analyzeHtml().parse(mapping, urls[0], urls[1], html, cookies, function (
      code,
      result
    ) {
      //, pathParams
      if (code == 200) {
        if (req.query.lazypageTargetSelector) {
          var block = queryLazyPageSelector(
            result,
            req.query.lazypageTargetSelector
          );
          var resultJSON = {
            block: block,
            hasTargetLazyPage: block != null,
          };
          if (block) {
            resultJSON.title = queryhelp.querySelector(result, "title");
          }
          result = JSON.stringify(resultJSON);
        }
        render(req, res, result);
      } else {
        console.log(result);
        next("server error");
      }
    });
  } catch (error) {
    console.log(error);
    next("server error");
  }
}

function filter(root) {
  loadconfig(root);
  route(root);
  return response(root);
}

function render(req, res, doc) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("Content-Length", Buffer.byteLength(doc));
  res.end(doc);
}
