var pathNode = require("path");
var application = require("./application");

let htmlPaths = application.data.htmlPaths,
  map = application.data.map;

function clearMap() {
  htmlPaths.clear();
  map.splice(0, map.length);
}

function sortMap() {
  map.sort(function (a, b) {
    return a.sort < b.sort ? 1 : -1;
  });
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

module.exports = {
  clearMap: clearMap,
  sortMap: sortMap,
  addMap: addMap,
};
