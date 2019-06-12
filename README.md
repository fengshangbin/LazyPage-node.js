# LazyPage-node.js

LazyPage server node.js version  
LazyPage 后端 node.js 版本  
GitHub Pages: https://github.com/fengshangbin/LazyPage-node.js

# 关于 LazyPage

参见 https://github.com/fengshangbin/LazyPage

# 如何使用 LazyPage-node.js

1，导入 lazypage-node.js 到你的项目  
var lazypage = require('./LazyPage-node.js');  
2，在项目初始化时 执行 LazyPage 初始化 app.use(lazypage.static('public'));  
注: lazypage 静态资源初始化入口代码采用 serve-static（express.static） 详见https://github.com/expressjs/serve-static  
3, 注册全局格式化函数 global.format = require('./public/js/format');

### LazyPage-node.js 使用示例

test/app.js

```
var express = require('express');
var app = express();

var lazypage = require('..');
app.use(lazypage.filter('test/public'));
app.use(express.static('test/public'));
global.format = require('./public/js/format');

var server = app.listen(8081, function() {
  console.log('LazyPage node.js测试，访问地址为 http://localhost:8081/');
});
```
