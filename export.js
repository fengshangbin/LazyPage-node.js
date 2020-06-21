const getPort = require("get-port");
var express = require("express");
var lazypage = require("./index");

var args = process.argv.splice(2);
(async () => {
  let port = await getPort({ port: getPort.makeRange(8080, 9000) });
  let path = args[0];
  if (path == null) {
    console.error("需要设置导出目录  eg. node export.js sourcePath");
    return;
  }
  //console.log(args, port);
  var app = express();
  app.use(lazypage.filter(path));
  app.use(express.static(path));

  var server = app.listen(port, function () {
    console.log(
      "LazyPage node.js测试，访问地址为 http://localhost:" + port + "/"
    );
  });
  //server.close();
  //console.log(server);
})();
