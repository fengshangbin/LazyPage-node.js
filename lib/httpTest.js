let http = require("http"); // 引入http模块
 
/**
 * http模块发送请求
 * @param host
 * @param port
 * @param route
 * @param params 参数
 * @param headers
 * @param encoding 可选值： utf8 binary
 */
async function sendHttpRequest(host, port, route, params = '', headers = {}, encoding = 'utf8') {
    let params_str = '';
    if(params != null) {
        for(let key in params) {
            params_str += key + '=' + params[key] + '&';
        }
        params_str = '?' + params_str;
    }
    //route = route, '/';
    let options = {
        hostname: host,
        port: port,
        path: '/' + route + params_str,
        method: 'GET',
        headers: headers
    };
    
    let result = await new Promise(function (resolve, reject) {
		let data = '';
        let req = http.request(options, function(res) {
            res.setEncoding(encoding);
            res.on('data', function(chunk) {
                data += chunk;
            });
 
            res.on('end', function() {
                resolve({result: true, data: data});
            });
        });
 
        req.on('error', (e) => {
            resolve({result: false, errmsg: e.message});
        });
        req.end();
    });
	return result;
}
 
// 请求例子
let res = sendHttpRequest('www.baidu.com', 80, 'a1.data', {user_id: 'test'});
console.log(res);
module.exports={};