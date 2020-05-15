var fastdom = require('./fastdom');
var ajax = require('./httpProxy');
var template = require('./template-web');
require('./template-global');

var analyzeHtml = function() {
  var dataMap = {};
  var doc;
  var mapping;
  var rootPath;
  var paths;
  var query;
  var pathnames;
  var cookies;
  var callback;

  var blockMarkIndex = 0;
  var contextID = Date.now() + '-' + parseInt(Math.random() * 10000);

  this.parse = function(
    _mapping,
    ignorePath,
    path,
    _query,
    html,
    //_pathParams,
    _cookies,
    _callback
  ) {
    //console.log("path", path);
    doc = new fastdom(html);
    mapping = _mapping;
    rootPath = getRootPath(path);
    var regex = '(' + rootPath + '/?)';
    //if (realHost) rootPath = realHost;
    var pattern = new RegExp(regex, 'g');
    path = path.replace(pattern, '');
    pathnames = path.replace(new RegExp('/?' + ignorePath + '/?', 'i'), '').split('/');
    if (path.endsWith('/')) path += 'end';
    paths = path.split('/');
    paths.pop();
    //console.log("this.paths", paths);
    query = _query;
    //pathParams = _pathParams;
    cookies = _cookies;
    callback = _callback;

    parseBlock();
  };

  function checkTemplateContext() {
    if (template.defaults.imports.contextID != contextID) {
      template.defaults.imports.contextID == contextID;
      template.defaults.imports.$path = function(index) {
        return index < pathnames.length ? pathnames[index] : null;
      };
      template.defaults.imports.$query = function(key) {
        if (query == null) return null;
        var regStr = '(^|&)' + key + '=([^&]*)(&|$)';
        var reg = new RegExp(regStr, 'i');
        var r = query.match(reg);
        if (r != null) return r[2];
        return null;
      };
      template.defaults.imports.$block = dataMap;
    }
  }
  function getRootPath(path) {
    var regex = '^((https|http|ftp|rtsp|mms)?://[^/]*)';
    var pattern = new RegExp(regex, 'i');
    var m = pattern.exec(path);
    if (m.length > 0) {
      return m[1];
    }
    return null;
  }
  function parseBlock() {
    var block = doc.querySelector('block:not([wait])');
    if (block != null) {
      var attrHTML = block.getAttrHTML();
      attrHTML = attrHTML.replace(/:([\w-_]*?) *= *"(.*?)"/g, function(match, p1, p2, offset) {
        return p1 + '="{{@' + p2 + '}}"';
      });
      checkTemplateContext();
      try {
        attrHTML = template.render(attrHTML);
      } catch (error) {
        callback(500, error);
        return;
      }

      block.setAttrHTML(attrHTML);

      var source = block.getAttribute('source');
      let matchJson = /(^\{(.*?)\}$)|(^\[(.*?)\]$)/;
      if (source != null && source != '') {
        if (matchJson.test(source)) {
          source = source
            .replace(/\\'/g, '&#39;')
            .replace(/'/g, '"')
            .replace(/&#39;/g, "'");
          block.source = JSON.parse(source);
        } else {
          let ajaxType = block.getAttribute('rquest-type');
          let ajaxData = block.getAttribute('rquest-param');
          ajax(
            mapping,
            rootPath,
            paths,
            ajaxType,
            source,
            ajaxData,
            cookies,
            function(result) {
              try {
                block.source = JSON.parse(result);
                renderDom(block);
              } catch (error) {
                callback(500, error);
              }
            },
            function(error) {
              callback(500, error);
            }
          );
        }
      } else {
        block.source = {};
      }

      var src = block.getAttribute('src');
      if (src != null && src != '') {
        ajax(
          mapping,
          rootPath,
          paths,
          null,
          src,
          null,
          cookies,
          function(result) {
            block.hasHTML = true;
            if (result != null) block.setInnerHTML(result);
            renderDom(block);
          },
          function(error) {
            callback(500, error);
          }
        );
      } else {
        block.hasHTML = true;
      }
      renderDom(block);
    } else {
      //var result = doc.html.replace(/(\r|\n)( *(\r|\n))+/g, "\r");
      //var result = doc.html.replace(/\r( *\r)+/g, "\r");
      //callback(200, result);
      callback(200, doc);
    }
  }
  function renderDom(block) {
    var source = block.source;
    try {
      if (block.hasHTML && source != null) {
        var blockChildren = {};
        var blockChild = block.querySelector('block:not([mark])');
        while (blockChild) {
          var innerHTML = blockChild.getInnerHTML();
          blockMarkIndex++;
          var key = '<!-- lzb' + blockMarkIndex + ' -->';
          blockChildren[key] = innerHTML;
          blockChild.setInnerHTML(key);
          blockChild.setAttribute('mark', 'true');
          blockChild = block.querySelector('block:not([mark])');
        }
        var html = block.getInnerHTML();
        //html = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        var pattern = new RegExp('<[^>]* +:[\\w-_]*? *= *".*?" *[^>]*>', 'g');
        html = html.replace(pattern, function(match, offset) {
          //console.log(match);
          return match.replace(/:([\w-_]*?) *= *"(.*?)"/g, function(match, p1, p2, offset) {
            return p1 + '="{{@' + p2 + '}}"';
          });
        });

        var id = block.getAttribute('id');
        if (id != null) {
          dataMap[id] = source;
          var waitBlocks = doc.querySelectorAll('block[wait=' + id + ']');
          waitBlocks.forEach(item => {
            var waitAttr = item.getAttribute('wait');
            var regex = id + ' ?';
            var pattern = new RegExp(regex, 'g');
            waitAttr = waitAttr.replace(pattern, '');
            waitAttr = waitAttr.trim();
            if (waitAttr == '') waitAttr = null;
            item.setAttribute('wait', waitAttr);
          });
        }

        checkTemplateContext();
        var result = template.render(html, source);
        for (var key in blockChildren) {
          result = result.replace(key, blockChildren[key]);
        }
        //console.log(result);
        block.setOuterHTML(result);

        parseBlock();
      }
    } catch (error) {
      callback(500, error);
    }
  }
};

module.exports = analyzeHtml;
