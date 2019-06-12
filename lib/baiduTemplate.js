var baidu = {};
//var LazyPage = LazyPage || { data: null };
if (typeof global !== 'undefined') {
  global.baidu = baidu;
  //global.LazyPage = LazyPage;
}
baidu.template = function(str, data) {
  var fn = bt._compile(str);
  var result = fn(data)
    .replace(/<&([^&]*?)&>/g, '<%$1%>')
    .replace(/<&&/g, '<&')
    .replace(/&&>/g, '&>');
  fn = null;
  return result;
};
var bt = baidu.template;
bt.LEFT_DELIMITER = '<%';
bt.RIGHT_DELIMITER = '%>';
bt.ESCAPE = true;
bt._encodeHTML = function(source) {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#92;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
bt._encodeReg = function(source) {
  return String(source).replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
};
bt._encodeEventHTML = function(source) {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\\\\/g, '\\')
    .replace(/\\\//g, '/')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r');
};
bt._compile = function(str) {
  var funBody = "var _template_fun_array=[];\nvar fn=(function(__data__){\nvar _template_varName='';\nfor(name in __data__){\n_template_varName+=('var '+name+'=__data__[\"'+name+'\"];');\n};\neval(_template_varName);\n_template_fun_array.push('" + bt._analysisStr(str) + "');\n_template_varName=null;\n})(_template_object);\nfn = null;\nreturn _template_fun_array.join('');\n";
  return new Function('_template_object', funBody);
};
bt._analysisStr = function(str) {
  var _left_ = bt.LEFT_DELIMITER;
  var _right_ = bt.RIGHT_DELIMITER;
  var _left = bt._encodeReg(_left_);
  var _right = bt._encodeReg(_right_);
  str = String(str)
    .replace(new RegExp('(' + _left + '[^' + _right + ']*)//.*\n', 'g'), '$1')
    .replace(/<!--[\w\W]*?-->/gm, '')
    /* .replace(/{@(.*?)}/g, function(match, $1, offset) {
		  return 'LazyPage.data.' + $1;
		}) */
    .replace(new RegExp(_left + '\\*.*?\\*' + _right, 'g'), '')
    .replace(new RegExp('[\\r\\t\\n]', 'g'), '')
    .replace(new RegExp(_left + '(?:(?!' + _right + ')[\\s\\S])*' + _right + '|((?:(?!' + _left + ')[\\s\\S])+)', 'g'), function(item, $1) {
      var str = '';
      if ($1) {
        str = $1.replace(/\\/g, '&#92;').replace(/'/g, '&#39;');
        while (/<[^<]*?&#39;[^<]*?>/g.test(str)) {
          str = str.replace(/(<[^<]*?)&#39;([^<]*?>)/g, '$1\r$2');
        }
      } else {
        str = item;
      }
      return str;
    });

  str = str
    .replace(new RegExp('(' + _left + '[\\s]*?var[\\s]*?.*?[\\s]*?[^;])[\\s]*?' + _right, 'g'), '$1;' + _right_)
    .replace(new RegExp('(' + _left + ':?[hvu]?[\\s]*?=[\\s]*?[^;|' + _right + ']*?);[\\s]*?' + _right, 'g'), '$1' + _right_)
    .split(_left_)
    .join('\t');

  if (bt.ESCAPE) {
    str = str.replace(new RegExp('\\t=(.*?)' + _right, 'g'), "',typeof($1) === 'undefined'?'':baidu.template._encodeHTML($1),'");
  } else {
    str = str.replace(new RegExp('\\t=(.*?)' + _right, 'g'), "',typeof($1) === 'undefined'?'':$1,'");
  }

  str = str
    .replace(new RegExp('\\t:h=(.*?)' + _right, 'g'), "',typeof($1) === 'undefined'?'':baidu.template._encodeHTML($1),'")
    .replace(new RegExp('\\t(?::=|-)(.*?)' + _right, 'g'), "',typeof($1)==='undefined'?'':$1,'")
    .replace(new RegExp('\\t:u=(.*?)' + _right, 'g'), "',typeof($1)==='undefined'?'':encodeURIComponent($1),'")
    .replace(new RegExp('\\t:v=(.*?)' + _right, 'g'), "',typeof($1)==='undefined'?'':baidu.template._encodeEventHTML($1),'")
    .split('\t')
    .join("');")
    .split(_right_)
    .join("_template_fun_array.push('")
    .split('\r')
    .join("\\'");
  return str;
};
function run(str, modeData) {
  if (typeof modeData == 'string') modeData = JSON.parse(modeData);
  result = baidu.template(str, modeData);
  return result;
}
/* function run(str, allData, modeData) {
  if (typeof allData == 'string') allData = JSON.parse(allData);
  LazyPage.data = allData;
  var result = '';
  if (modeData != null) {
    if (typeof modeData == 'string') modeData = JSON.parse(modeData);
    result = baidu.template(str, modeData);
  } else {
    result = eval('LazyPage.data.' + str);
  }
  str = null;
  data = null;
  modeData = null;
  LazyPage.data = null;
  return result;
} */
if (typeof module === 'undefined') {
  run(str, modeData);
} else {
  module.exports = run;
}
