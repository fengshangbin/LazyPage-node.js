var parseUrl = require("parseurl");
var fs = require("fs");
var pathNode = require("path");
var analyzeHtml = require("./analyzeHtml");
var application = require("./application");

var htmlPaths = application.data.htmlPaths,
  map = application.data.map;

function response(root) {
  //console.log('root:' + root);
  return (req, res, next) => {
    var path = parseUrl(req).pathname.replace("//", "/");
    //console.log('---------------' + path);
    var cookies = req.headers.cookie;
    //var pathParams = null;
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
            path = map[i].value.substring(1);
            hitHtml = true;
            /* let group = reg.exec(path);
            if (group.length > 1) {
              pathParams = group.slice(1, group.lengths);
            } */
            break;
          }
        }
      }
      if (hitHtml) {
        if (root && typeof root == "string") {
          fromDir(root, path, next, function (html) {
            lazypage(req, res, html, cookies, next);
          });
        } else {
          lazypage(
            req,
            res,
            application.data.assets[path].source(),
            cookies,
            next
          );
        }
      } else {
        next();
      }
    }
  };
}
function fromDir(root, path, next, callback) {
  fs.readFile(root + "/" + path, "utf-8", function (err, html) {
    if (err) {
      next("code 404, file not found");
    } else {
      callback(html);
    }
  });
}
function lazypage(req, res, html, cookies, next) {
  var fullUrl =
    req.protocol + "://" + req.get("host") + req.originalUrl.replace("//", "/");
  //console.log(fullUrl);
  var urls = fullUrl.split("?");
  //query = query.length > 1 ? query[1] : null;
  try {
    //console.log(mapping, urls[0], urls[1]);
    new analyzeHtml().parse(
      /* mapping,
      ignorePath, */
      urls[0],
      urls[1],
      html,
      cookies,
      function (code, result) {
        if (code == 200) {
          result = result.html.replace(/(\r|\n)( *(\r|\n))+/g, "\r");
          render(req, res, result);
        } else {
          if (application.data.debug) next(result);
          else next("server error");
          //next("server error");
        }
      }
    );
  } catch (error) {
    //next("server error");
    next(error);
  }
}
function render(req, res, doc) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("Content-Length", Buffer.byteLength(doc));
  res.end(doc);
}

module.exports = response;
