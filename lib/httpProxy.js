const { URL } = require('url');
const http = require('http');
const https = require('https');
//var request = require('sync-request');

/*module.exports=test;
function test(){
	var path = "Http://www.baidu.com/1/2/3/ni.html";
	var rootPath = getRootPath(path);
	var regex = "("+rootPath+"/?)";
	var pattern = new RegExp(regex, "g");
	path = path.replace(pattern, "");
	if(path.endsWith("/"))path+="end";
	var paths = path.split("/");
	paths.pop();
	var url = getRealUrl(rootPath, paths, "/a1.data");
	console.log(url);
	var result = ajax(rootPath, paths, "post", "/a1.data", "id=2&no=4", "LazyPageSpider=0");
	console.log(result);
}*/

function getRealUrl(rootPath, paths, url) {
  if (checkUrl(url)) return url;
  else {
    //console.log("paths", paths);
    if (url.startsWith('/')) {
      return rootPath + url;
    } else if (url.startsWith('../')) {
      var count = 0;
      while (url.startsWith('../')) {
        url = url.substring(3);
        count++;
      }
      var pathBuffer = '/';
      for (var i = 0; i < paths.length - count; i++) {
        pathBuffer += paths[i];
      }
      if (pathBuffer.length > 1) pathBuffer += '/';
      return rootPath + pathBuffer + url;
    } else {
      url = url.replace(/\.\//g, '');
      var pathStr = paths.join('/');
      if (pathStr.length > 0) pathStr += '/';
      return rootPath + '/' + pathStr + url;
    }
  }
}
function checkUrl(url) {
  var regex = '^((https|http|ftp|rtsp|mms)?://)(.*?)';
  var pattern = new RegExp(regex, 'i');
  return pattern.test(url);
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
function ajax(mapping, rootPath, paths, method, urlString, parameters, cookies, callback, error) {
  //rootPath = 'http://localhost:8181/';
  if (method == null) method = 'GET';
  method = method.toUpperCase();
  urlString = getRealUrl(rootPath, paths, urlString);
  if (mapping) {
    for (var i = 0; i < mapping.length; i++) {
      var map = mapping[i];
      urlString = urlString.replace(map.from, map.to);
    }
  }
  var options = {
    timeout: 15000,
    method: method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  if (cookies != null) options.headers.Cookie = cookies;
  if (method == 'GET' && parameters != '' && parameters != null) {
    urlString += urlString.indexOf('?') > 0 ? '&' : '?';
    urlString += parameters;
  } else if (method == 'POST' && parameters != '' && parameters != null) {
    options.headers['Content-Length'] = Buffer.byteLength(parameters);
  }
  var url = new URL(urlString);
  options.hostname = url.hostname;
  options.port = url.port;
  options.path = url.pathname;
  var httpClient = url.protocol == 'https' ? https : http;
  var body = '';
  const req = httpClient.request(options, res => {
    //console.log(`状态码: ${res.statusCode}`);
    //console.log(`响应头: ${JSON.stringify(res.headers)}`);
    if (res.statusCode > 200) {
      var message = `error on ajax ${urlString}: statusCode ${res.statusCode}`;
      //console.error(message);
      //callback(null);
      error(message);
    } else {
      res.setEncoding('utf8');
      res.on('data', chunk => {
        //console.log(`响应主体: ${chunk}`);
        body += chunk;
      });
      res.on('end', () => {
        //console.log('响应中已无数据');
        callback(body);
      });
    }
  });

  req.on('error', e => {
    var message = `error on ajax ${urlString}: ${e.message}`;
    //console.error(message);
    //callback(null);
    error(message);
  });
  if (method == 'POST' && parameters != '' && parameters != null) req.write(postData);
  req.end();
  /*if(method==null)method="GET";
	method = method.toUpperCase();
	urlString = getRealUrl(rootPath, paths, urlString);
	var options = {
		timeout: 3000,
		headers: {}
	};
	if(cookies!=null)options.headers.Cookie=cookies;
	if (method=="GET" && parameters != "") {
		urlString +=urlString.indexOf("?")>0?"&":"?";
		urlString += parameters;
	}else if(method=="POST" && parameters != ""){
		options.body=parameters;
	}
	var result = null;
	try{
		console.log("ajax: "+urlString);
		var res = request(method, urlString, options);
		result = res.getBody('utf8');
	}catch(e){
		result = null;
		console.log(e);
	}
	return result;*/
}
module.exports = ajax;
