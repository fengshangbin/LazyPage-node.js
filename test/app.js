var express = require('express');
var app = express();

var lazypage = require('..');
app.use(lazypage.static('test/public'));
global.format = require('./public/js/format');
 
var server = app.listen(8081, function () {
  console.log("LazyPage node.js测试，访问地址为 http://localhost:8081/")
})