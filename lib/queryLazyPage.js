//var queryHelp = require("./queryhelp").QueryHelp;

function queryLazyPageSelector(doc, selector) {
  var selectors = selector.split(" ");
  for (var i = 0; i < selectors.length; i++) {
    selectors[i] = ".lazypagelevel" + i + selectors[i];
  }
  selector = selectors.join(" ");
  addLevelMark(doc);
  //console.log(doc.html, selector);
  return doc.querySelector(selector);
}

function addLevelMark(doc) {
  var elements = doc.querySelectorAll(".lazypage");
  var addCount = 0;
  for (var i = 0; i < elements.length; i++) {
    var item = elements[i];
    var end = item.getEnd();
    var level = 0;
    for (var j = 0; j < i; j++) {
      if (end < elements[j].getEnd()) level++;
    }
    var mark = " lazypagelevel" + level;
    var classes = item.getAttribute("class");
    item.setAttribute("class", classes + mark);
  }
}

/* function removeLevelMark(html) {
  return html ? html.replace(/ lazypagelevel\d/g, "") : null;
} */

module.exports = queryLazyPageSelector;
