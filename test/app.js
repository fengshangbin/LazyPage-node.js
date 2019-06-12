var express = require('express');
var app = express();

var lazypage = require('..');
app.use(lazypage.filter('test/public'));
app.use(express.static('test/public'));
global.format = require('./public/js/format');

var server = app.listen(8081, function() {
  console.log('LazyPage node.js测试，访问地址为 http://localhost:8081/');
});

//打开默认浏览器
const openDefaultBrowser = function(url) {
  var exec = require('child_process').exec;
  console.log(process.platform);
  switch (process.platform) {
    case 'darwin':
      exec('open ' + url);
      break;
    case 'win32':
      exec('start ' + url);
      break;
    default:
      exec('xdg-open', [url]);
  }
};
openDefaultBrowser('http://localhost:8081/');
