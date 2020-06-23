const portfinder = require('portfinder');
const express = require("express");
const fs = require("fs");
const path = require("path");
const lazypage = require("./index");
const io = require("./lib/io");
const fastdom = require("./lib/fastdom/fastdom");
const ajax = require("./core/httpProxy");

let root, port, server, assets, indexPage, unlinkPage, urlQueue;
let loaded = {};

function exportHTML(_root, option) {
  (async () => {
    root = _root;
    if (root == null) {
      console.error("需要设置导出根目录  eg. node export.js rootPath");
      return;
    }
    port = await portfinder.getPortPromise({ port: 8080, stopPort: 9000 });

    var defaultOption = {
      assets: [],
      indexPage: "/",
      unlinkPage: [],
    };
    Object.assign(defaultOption, option);

    assets = defaultOption.assets;
    indexPage = defaultOption.indexPage;
    unlinkPage = defaultOption.unlinkPage;
    urlQueue = [{ parent: "http://localhost:" + port, path: indexPage }];
    for (var i = 0; i < unlinkPage; i++) {
      urlQueue.push({
        parent: "http://localhost:" + port,
        path: unlinkPage[i],
      });
    }

    listen(root, port);
    //server.close();
  })();
}

function listen(root, port) {
  var app = express();
  app.use(lazypage.filter(root));
  app.use(express.static(root));

  server = app.listen(port, function () {
    requestPage();
  });
}

function requestPage() {
  var target = urlQueue.shift();
  if (target != undefined) {
    var pathsObject = getPathsObject(target.parent);
    var rootPath = pathsObject.rootPath;
    var paths = pathsObject.paths;
    var finaleURL = io.getRealUrl(rootPath, paths, target.path);
    var targetObject = getPathsObject(finaleURL);
    //console.log(targetObject);
    if (
      targetObject.rootPath != "http://localhost:" + port ||
      loaded[finaleURL] == true
    ) {
      requestPage();
    } else {
      loaded[finaleURL] = true;
      ajax(
        rootPath,
        paths,
        "GET",
        target.path,
        null,
        null,
        function (data) {
          //console.log(data);
          var doc = new fastdom(data);
          var allHrefs = doc.querySelectorAll("a[href]");
          for (var i = 0; i < allHrefs.length; i++) {
            var url = allHrefs[i].getAttribute("href");
            if (url == null || /^javascript/i.test(url)) {
              continue;
            }
            urlQueue.push({ parent: finaleURL, path: url });
          }

          var finalePaths = targetObject.paths;
          if (finalePaths[finalePaths.length] == "") finalePaths.pop();
          var finalePath = finalePaths.join("/");
          if (finalePath.indexOf(".") == -1)
            finalePath = finalePath + "/index.html";
          var savePath = "./export/" + finalePath;
          savePath = savePath.replace(/\/\//g, "/");

          var savePathDir = path.parse(savePath).dir;
          (async () => {
            await io.dirExists(savePathDir);
            fs.writeFile(savePath, data, "utf-8", function (error) {
              if (error) {
                console.error("error at write " + savePath);
              }
              requestPage();
            });
          })();
        },
        function (error) {
          console.error(error);
        }
      );
    }
  } else {
    server.close();
    (async () => {
      for (var i = 0; i < assets.length; i++) {
        var source = root + "/" + assets[i];
        source = source.replace(/\/\//g, "/");
        await io.copyFiles(source, "./export");
      }
      console.log("export html complete!");
    })();
  }
}

function getPathsObject(url) {
  var domain = /^((https|http|ftp|rtsp|mms)?:\/\/[^/]*)/i.exec(url)[0];
  var paths = url
    .replace(new RegExp(domain, "i"), "")
    .replace(/(\?.*)|(#.*)/, "")
    .replace(/\/\//g, "/")
    .split("/");
  if (paths[0] == "") paths.shift();
  return {
    rootPath: domain,
    paths: paths,
  };
}
module.exports = exportHTML;
