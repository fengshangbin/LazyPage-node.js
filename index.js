/*!
 * serve-static
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var encodeUrl = require('encodeurl')
var escapeHtml = require('escape-html')
var parseUrl = require('parseurl')
var resolve = require('path').resolve
var send = require('send')
var url = require('url')

var destroy = require('destroy')
var fs = require('fs')
var onFinished = require('on-finished')

var through = require('through2');
var pathNode = require('path');

//var document = require('./lib/document');
var analyzeHtml = require('./lib/analyzeHtml');
/**
 * Module exports.
 * @public
 */

module.exports = {static: serveStatic, mime: send.mime}
///module.exports.mime = send.mime

/**
 * @param {string} root
 * @param {object} [options]
 * @return {function}
 * @public
 */

function serveStatic (root, options) {
  if (!root) {
    throw new TypeError('root path required')
  }

  if (typeof root !== 'string') {
    throw new TypeError('root path must be a string')
  }

  // copy options object
  var opts = Object.create(options || null)

  // fall-though
  var fallthrough = opts.fallthrough !== false

  // default redirect
  var redirect = opts.redirect !== false

  // headers listener
  var setHeaders = opts.setHeaders

  if (setHeaders && typeof setHeaders !== 'function') {
    throw new TypeError('option setHeaders must be function')
  }

  // setup options for send
  opts.maxage = opts.maxage || opts.maxAge || 0
  opts.root = resolve(root)

  // construct directory listener
  var onDirectory = redirect
    ? createRedirectDirectoryListener()
    : createNotFoundDirectoryListener()
  
  //console.log(this);
    let htmlPaths = new Set();
	let map = new Map();
	let rootLen = root.length;
	readDirSync(root);
	function readDirSync(pathStr){
		//var files = fs.readdirSync(pathStr)
		let pa = fs.readdirSync(pathStr);
		pa.forEach(function(ele,index){
			let filePath = pathNode.join(pathStr,ele);
			let info = fs.statSync(filePath);
			if(info.isDirectory()){
				readDirSync(filePath);
			}else{
				if(!ele.startsWith("_") && ele.endsWith(".html")){
					let reg = new RegExp(pathNode.sep+pathNode.sep, "g");
					let realPath = filePath.substring(rootLen).replace(reg, "/");
					let routePath = realPath.replace("-.html", "");
					routePath = routePath.replace(/\+/g, "/");
					routePath = routePath.replace(/\$/g, "([^/]*?)");

					if(routePath != realPath){
						map.set("^"+routePath+"$", realPath);
					}else{
						htmlPaths.add(realPath);
					}
				}
			}	
		})
	}
	//console.log(htmlPaths);
	//console.log(map);

  return function serveStatic (req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (fallthrough) {
        return next()
      }

      // method not allowed
      res.statusCode = 405
      res.setHeader('Allow', 'GET, HEAD')
      res.setHeader('Content-Length', '0')
      res.end()
      return
    }

    var forwardError = !fallthrough
    var originalUrl = parseUrl.original(req)
    var path = parseUrl(req).pathname
//console.log(path)
    // make sure redirect occurs at mount
    if (path === '/' && originalUrl.pathname.substr(-1) !== '/') {
      path = ''
    }
	  var cookies = req.headers.cookie;
	  var lazyPageSpider = cookies && cookies.indexOf("LazyPageSpider=0")>-1;
    // create send stream
	//console.log(path, cookies);
	var needRender = false;
	var pathParams = null;
	var appentScript = null;
	var ext = pathNode.extname(path);
	ext = ext.length>0 ? ext.slice(1) : 'unknown';
	//console.log("ext: "+ext);
	//console.log("path: "+path);
	if((htmlPaths.has(path) || path === '/') && !lazyPageSpider){
		needRender = true;
	}else if(ext=="unknown" || ext=="html"){
		for (let key of map.keys()) {
			//console.log(key);
			let reg = new RegExp(key, "i");
			if(reg.test(path)){
				//console.log(pathname, key, reg.exec(pathname));
				let group = reg.exec(path);
				path = map.get(key).substring(1);
				//console.log(group.length);
				if(group.length>1){
					pathParams = group.slice(1,group.lengths);
					appentScript = "<script>LazyPage.pathParams=[\""+pathParams.join("\",\"")+"\"]</script>\n";
					//console.log(appentScript);
					needRender = true;
				}else if(!lazyPageSpider){
					needRender = true;
				}
			}
		}
	}
	//console.log(path, needRender, appentScript);
	  
    var stream = send(req, path, opts)
	
	stream.stream = function stream (path, options) {
	  // TODO: this is all lame, refactor meeee
	  var finished = false
	  var self = this
	  var res = this.res
	  // pipe
	  var stream = fs.createReadStream(path, options)
	  this.emit('stream', stream)
	  stream.pipe(through.obj(function(file, encoding, callback) {
		  //console.log(file, encoding, callback)
		  if (file==null || needRender==false) {
			callback(null, file);
		  }else{
			let html = file.toString();
			  
			if(appentScript != null){
				var bodyEnd = html.lastIndexOf("</body>");
				if(bodyEnd>0){
					html = html.substring(0, bodyEnd)+appentScript+html.substring(bodyEnd);
				}else{
					html += "\n"+appentScript;
				}
			}
			function resPonseCallback(){
				let newFile = Buffer.from(html, 'utf8');
				res.setHeader('Content-Length', newFile.length);
				callback(null, newFile);
			}
			//console.log(html);
			if(!lazyPageSpider){
				var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				console.log("fullUrl: "+fullUrl);
				//var url = req.originalUrl;
				//console.log("url: "+url);
				var query = fullUrl.split("?");
				query = query.length>1?query[1]:null;
				/*var doc = new document(html);
				doc.queryBlocks();
				console.log(doc.getHtml());*/
				//var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
				new analyzeHtml().parse(fullUrl, query, html, pathParams, cookies, function(result){
					html = result;
					resPonseCallback();
				});
			}else{
				resPonseCallback();
			}
			
		  }
		})).pipe(res)

	  // response finished, done with the fd
	  onFinished(res, function onfinished () {
		finished = true
		destroy(stream)
	  })

	  // error handling code-smell
	  stream.on('error', function onerror (err) {
		// request already finished
		if (finished) return

		// clean up stream
		finished = true
		destroy(stream)

		// error
		self.onStatError(err)
	  })

	  // end
	  stream.on('end', function onend () {
		self.emit('end')
	  })
	}

    // add directory handler
    stream.on('directory', onDirectory)

    // add headers listener
    if (setHeaders) {
      stream.on('headers', setHeaders)
    }

    // add file listener for fallthrough
    if (fallthrough) {
      stream.on('file', function onFile () {
        // once file is determined, always forward error
        forwardError = true
      })
    }

    // forward errors
    stream.on('error', function error (err) {
      if (forwardError || !(err.statusCode < 500)) {
        next(err)
        return
      }

      next()
    })
//console.log("."+path+".", originalUrl.pathname)
    // pipe
    stream.pipe(res)
  }
}

/**
 * Collapse all leading slashes into a single slash
 * @private
 */
function collapseLeadingSlashes (str) {
  for (var i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) !== 0x2f /* / */) {
      break
    }
  }

  return i > 1
    ? '/' + str.substr(i)
    : str
}

 /**
 * Create a minimal HTML document.
 *
 * @param {string} title
 * @param {string} body
 * @private
 */

function createHtmlDocument (title, body) {
	//console.log(body)
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n'
}

/**
 * Create a directory listener that just 404s.
 * @private
 */

function createNotFoundDirectoryListener () {
	console.log(1)
  return function notFound () {
    this.error(404)
  }
}

/**
 * Create a directory listener that performs a redirect.
 * @private
 */

function createRedirectDirectoryListener () {
	//console.log(2)
  return function redirect (res) {
	  
    if (this.hasTrailingSlash()) {
      this.error(404)
      return
    }

    // get original URL
    var originalUrl = parseUrl.original(this.req)

    // append trailing slash
    originalUrl.path = null
    originalUrl.pathname = collapseLeadingSlashes(originalUrl.pathname + '/')

    // reformat the URL
    var loc = encodeUrl(url.format(originalUrl))
	//console.log(loc)
    var doc = createHtmlDocument('Redirecting', 'Redirecting to <a href="' + escapeHtml(loc) + '">' +
      escapeHtml(loc) + '</a>')

    // send redirect response
    res.statusCode = 301
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.setHeader('Content-Length', Buffer.byteLength(doc))
    res.setHeader('Content-Security-Policy', "default-src 'self'")
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Location', loc)
    res.end(doc)
  }
}
