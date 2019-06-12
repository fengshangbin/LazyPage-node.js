var document = require('./document');
var ajax = require('./httpProxy');
var baidu = require('./baiduTemplate');

//eval("console.log(LazyPage.data)");
var analyzeHtml = function() {
  //global.LazyPage={"data":{}, "baidu":baidu};
  var dataMap = {};
  var doc;
  var rootPath;
  var paths;
  var query;
  var pathParams;
  var cookies;
  var callback;

  this.parse = function(path, _query, html, _pathParams, _cookies, _callback) {
    //console.log("path", path);
    doc = new document(html);
    rootPath = getRootPath(path);
    var regex = '(' + rootPath + '/?)';
    var pattern = new RegExp(regex, 'g');
    path = path.replace(pattern, '');
    if (path.endsWith('/')) path += 'end';
    paths = path.split('/');
    paths.pop();
    //console.log("this.paths", paths);
    query = _query;
    pathParams = _pathParams;
    cookies = _cookies;
    callback = _callback;
    checkBlocks();
  };
  function getRootPath(path) {
    var regex = '^((https|http|ftp|rtsp|mms)?://[^/]*)';
    var pattern = new RegExp(regex, 'i');
    var m = pattern.exec(path);
    if (m.length > 0) {
      return m[1];
    }
    return null;
  }
  function checkBlocks() {
    var blocks = doc.queryBlocks();
    var lazyCount = 0;
    for (var block of blocks) {
      //for(var i=0; i<blocks.size; i++){
      //var block = blocks.get(i);
      if (block.getRunStated() > 0) continue;
      var lazyStr = block.getAttribute('lazy');
      if (lazyStr != null && lazyStr != 'false') {
        lazyCount++;
        continue;
      }
      var waitStr = block.getAttribute('wait');
      //System.out.println("+++--"+block.getAttrHtml()+"+++++"+waitStr+".");
      if (waitStr != null && waitStr.length > 0) {
        var waits = waitStr.split(' ');
        var removeWait = false;
        for (var j = 0; j < waits.length; j++) {
          var waitID = waits[j];
          if (dataMap[waitID] != null) {
            var regex = waitID + ' ?';
            var pattern = new RegExp(regex, 'g');
            waitStr = waitStr.replaceAll(pattern, '');
            removeWait = true;
          }
        }
        if (removeWait == true) block.setAttribute('wait', waitStr);
      }
      if (waitStr != null && waitStr.length > 0) {
        lazyCount++;
        continue;
      }
      //System.out.println("+++"+block.getAttrHtml());
      runBlock(block);
    }
    if (blocks.size == lazyCount) {
      //readyLazy.trigger();
      //console.log("lazypage render over");
      var result = doc.getHtml().replace(/x-tmpl-lazypage-tag/g, 'x-tmpl-lazypage');
      var dataMapStr = JSON.stringify(dataMap);
      if (dataMapStr != '{}') {
        var bodyEnd = result.lastIndexOf('</body>');
        if (bodyEnd > 0) {
          result = result.substring(0, bodyEnd) + '<script>LazyPage.data=' + dataMapStr + '</script>\n' + result.substring(bodyEnd);
        } else {
          result += '\n<script>LazyPage.data=' + dataMapStr + '</script>';
        }
      }
      callback(200, result);
    }
  }
  function addModeData(block, data) {
    if (data == null) {
      block.setRunStated(2);
      return;
    }
    try {
      //console.log("JSON data: "+data);
      data = JSON.parse(data);
    } catch (e) {
      block.setRunStated(2);
      console.log('LazyPage need JSON data: ' + data);
      console.log(block.getAttrHtml());
      return;
    }
    block.setData(data);
    var id = block.getAttribute('id');
    if (id != null) {
      dataMap[id] = data;
      var array = Array.from(doc.getBlocks());
      var blocks = array.filter(function(ele, index, array) {
        return ele.hasAttribute('wait');
      });
      for (var i = 0; i < blocks.length; i++) {
        var item = blocks[i];
        var wait = item.getAttribute('wait');
        if (wait.indexOf(id) > -1) {
          var regex = id + ' ?';
          var pattern = new RegExp(regex, 'g');
          wait = wait.replace(pattern, '');
          item.setAttribute('wait', wait);
        }
      }
    }
  }

  function replaceParamAsValue(html, isString) {
    html = html.replace(/{&(.*?)}/g, function(match, p1, offset) {
      return toValueString(getQueryString(p1), isString);
    });
    html = html.replace(/{\$(.*?)}/g, function(match, p1, offset) {
      return toValueString(getPathString(p1), isString);
    });
    html = html.replace(/{@(.*?)}/g, function(match, p1, offset) {
      return toValueString(eval('dataMap.' + p1), isString);
    });
    return html;
  }
  function toValueString(value, isString) {
    if (isString) return value;
    if (typeof value == 'string') return '"' + value + '"';
    else return value;
  }

  /* function replaceParamAsString(html) {
    html = html.replace(/{{&(.*?)}}/g, function(match, p1, offset) {
      return getQueryString(p1);
    });
    html = html.replace(/{{\$(.*?)}}/g, function(match, p1, offset) {
      return getPathString(p1);
    });
    html = html.replace(/{{@(.*?)}}/g, function(match, p1, offset) {
      return eval('dataMap.' + p1);
    });
    return html;
  } */

  function getQueryString(name) {
    if (query == null) return '';
    var regStr = '(^|&)' + name + '=([^&]*)(&|$)';
    var reg = new RegExp(reg, 'i');
    var r = query.match(reg);
    if (r != null) return r[2];
    return '';
  }

  function getPathString(index) {
    if (pathParams == null) return '';
    var i = parseInt(index);
    if (i >= 0 && i < pathParams.length) {
      return pathParams[i];
    }
    return '';
  }
  function runBlock(block) {
    //console.log("block.getRunStated(): "+block.getRunStated());
    block.setRunStated(1);
    var src = block.getAttribute('src');
    var source = block.getAttribute('source');
    let matchJson = /(^\{(.*?)\}$)|(^\[(.*?)\]$)/;
    if (source != null && source != '') {
      if (matchJson.test(source)) {
        source = source.replace(/'/g, '"');
        addModeData(block, source);
      } else {
        let ajaxType = block.getAttribute('ajax-type');
        let ajaxData = block.getAttribute('ajax-data') || '';
        ajaxData = replaceParamAsValue(ajaxData, true);
        /* ajaxData = ajaxData.replace(/{&(.*?)}/g, function(match, p1, offset) {
          return getQueryString(p1);
        });
        ajaxData = ajaxData.replace(/{\$(.*?)}/g, function(match, p1, offset) {
          return getPathString(p1);
        });
        ajaxData = ajaxData.replace(/{@(.*?)}/g, function(match, p1, offset) {
          return eval('dataMap.' + p1);
        }); */
        source = replaceParamAsValue(source, true);
        ajax(rootPath, paths, ajaxType, source, ajaxData, cookies, function(result) {
          addModeData(block, result);
          renderDom(block);
        });
      }
    } else {
      addModeData(block, '{}');
    }
    if (src != null && src != '') {
      src = replaceParamAsValue(src, true);
      ajax(rootPath, paths, null, src, null, cookies, function(result) {
        block.setHtml(result);
        if (result == null) block.setRunStated(2);
        renderDom(block);
      });
    } else {
      var html = block.getInnerHtml();
      html = html.replace(/jscript/g, 'script');
      block.setHtml(html);
    }
    renderDom(block);
  }
  function renderDom(block) {
    var html = block.getHtml();
    var data = block.getData();
    //console.log("---"+html+"---");
    //console.log("+++"+data+"+++");
    try {
      if (html != null && data != null) {
        //html = replaceParamAsString(html);
        html = replaceParamAsValue(html, false);
        var out = baidu(html, data);
        //var out = html;
        //console.log(out);
        block.setOutHtml(out);
        //block=null;
        checkBlocks();
      }
    } catch (error) {
      callback(500, error);
    }
  }
};
module.exports = analyzeHtml;
