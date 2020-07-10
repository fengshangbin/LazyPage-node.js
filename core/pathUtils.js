function getDomain(url) {
    if (url == null) return location.origin;
    var group = /^((https|http|ftp|rtsp|mms|file)?:\/\/[^/]*)/i.exec(url);
    return group ? group[0] : null;
}

function getPath(url) {
    var domain = getDomain(url);
    return url.replace(new RegExp(domain, 'i'), '').replace(/(\?.*)|(#.*)/, '').replace(/\/\//g, '/');
}

function getPaths(url) {
    var paths = getPath(url).replace(/^\//, '').split('/');
    return paths;
}

function getPathsWithIgnorePath(url, ignorePath) {
    var paths = getPath(url).replace(new RegExp("^/?" + ignorePath + "/?", "i"), "").split('/');
    return paths;
}

function getFinalURL(currentURL, targetURL) {
    if (checkUrl(targetURL)) return targetURL;
    else {
        var domain = getDomain(currentURL);
        var paths = getPaths(currentURL);
        paths.pop();
        if (targetURL.startsWith('/')) {
            return domain + targetURL;
        } else if (targetURL.startsWith('../')) {
            while (targetURL.startsWith('../')) {
                targetURL = targetURL.substring(3);
                paths.pop();
            }
            return domain + "/" + paths.join("/") + (paths.length > 0 ? "/" : "") + targetURL;
        } else {
            return domain + "/" + paths.join("/") + (paths.length > 0 ? "/" : "") + targetURL;
        }
    }
}
function checkUrl(url) {
    var regex = '^((https|http|ftp|rtsp|mms|file)?://)(.*?)';
    var pattern = new RegExp(regex, 'i');
    return pattern.test(url);
}
module.exports = {
    getDomain,
    getPath,
    getPaths,
    getPathsWithIgnorePath,
    getFinalURL
};