const portfinder = require('portfinder');
const express = require("express");
const fs = require("fs");
const path = require("path");
const del = require('del');
const lazypage = require("./index");
const io = require("./core/ioUtils");
const pathUtils = require("./core/pathUtils");
const fastdom = require("fastdomparse-node");
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
    await del("export");
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
    var finaleURL = pathUtils.getFinalURL(target.parent, target.path);
    var targetDomain = pathUtils.getDomain(finaleURL);
    if (
      targetDomain != "http://localhost:" + port ||
      loaded[finaleURL] == true
    ) {
      requestPage();
    } else {
      loaded[finaleURL] = true;
      ajax(
        "GET",
        finaleURL,
        null,
        null,
        function (data) {
          //console.log(data);
          var doc = new fastdom(data);
          var allHrefs = doc.querySelectorAll("a[href]");
          for (var i = 0; i < allHrefs.length; i++) {
            var url = allHrefs[i].getAttribute("href");
            if (url == null || /^javascript/i.test(url) || /^tel:/i.test(url) || /^mailto:/i.test(url)) {
              continue;
            }
            urlQueue.push({ parent: finaleURL, path: url });
          }

          var finalePath = pathUtils.getPath(finaleURL);
          if (finalePath.indexOf(".") == -1)
            finalePath = finalePath + (finalePath.endsWith("/") ? "" : "/") + "index.html";
          var savePath = "./export/" + finalePath;

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
          requestPage();
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
