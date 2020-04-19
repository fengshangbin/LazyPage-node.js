var queryHelp = require("./queryhelp").QueryHelp;

function queryLazyPageSelector(html, selector) {
  var selectors = selector.split(" ");
  for (var i = 0; i < selectors.length; i++) {
    selectors[i] = ".lazypagelevel" + i + selectors[i];
  }
  selector = selectors.join(" ");

  html = addLevelMark(html);
  return removeLevelMark(queryHelp.querySelector(html, selector));
}

function addLevelMark(html) {
  var elements = queryLazyPageElement(html);
  var addCount = 0;
  for (var i = 0; i < elements.length; i++) {
    var item = elements[i];
    var end = item.end;
    for (var j = 0; j < i; j++) {
      if (end < elements[j].end) item.level++;
    }
    var mark = " lazypagelevel" + item.level;
    html =
      html.substring(0, item.lazypageIndex + addCount) +
      mark +
      html.substring(item.lazypageIndex + addCount);
    addCount += mark.length;
  }
  return html;
}
function removeLevelMark(html) {
  return html ? html.replace(/ lazypagelevel\d/g, "") : null;
}
function queryLazyPageElement(html) {
  var regStr = '< *([^ >]*)[^>]*?\\b(class *= *"[^"]*")[^>]*>';
  var match = new RegExp(regStr, "img");
  var result = [];
  var group = match.exec(html);
  while (group != null) {
    var classIndex;
    while ((classIndex = group[2].search(/\blazypage\b/)) == -1) {
      group = match.exec(html);
      if (group == null) return result;
    }
    var lazypageIndex =
      group.index + group[0].search(group[2]) + classIndex + "lazypage".length;
    var searchStart = group.index + group[0].length;
    var closeIndex = 0;
    if (/\/ *>$/.test(group[0]) == false) {
      closeIndex = queryHelp.queryCloseTag(
        group[1],
        html.substring(searchStart)
      );
    }
    var lazyPage = {
      start: group.index,
      end: searchStart + closeIndex,
      lazypageIndex: lazypageIndex,
      level: 0,
    };
    result.push(lazyPage);
    group = match.exec(html);
  }
  return result;
}

module.exports = queryLazyPageSelector;
