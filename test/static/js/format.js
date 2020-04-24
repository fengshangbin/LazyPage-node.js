var format = {
	//千位数字逗号分隔
	toThousands: function(number){
		var num = (number || 0).toString();
		var nums=num.split(".");
		nums[0]=nums[0].replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g,'$&,');
		return nums.join(".");
	},
	//时间戳(秒)日期格式化
	dataFormat: function(formatStr, timeStamp) {  
		var date = new Date(timeStamp*1000);
		var zeroize = function (value, length) {  
			if (!length) {  
				length = 2;  
			}  
			value = new String(value);  
			for (var i = 0, zeros = ''; i < (length - value.length); i++) {  
				zeros += '0';  
			}  
				return zeros + value;  
		};  
		var timeago = function(){
			var dateTimeStamp = date.getTime();
			var minute = 1000 * 60;
			var hour = minute * 60;
			var day = hour * 24;

			var now = new Date().getTime();
			var diffValue = now - dateTimeStamp;

			var minC = diffValue/minute;
			var hourC = diffValue/hour;
			var dayC = diffValue/day;
			var secondC = diffValue/1000;

			if(dayC >= 1 && dayC <2){
				result = parseInt(dayC) + " day ago"
			}else if(hourC >= 1 && hourC < 24){
				result = parseInt(hourC) + " hour"+(parseInt(hourC)>1?"s":"")+" ago"
			}else if(minC >= 1 && minC< 60){
				result =parseInt(minC) + " minute"+(parseInt(minC)>1?"s":"")+" ago"
			}else if(secondC >= 10 && secondC < 60){
				result =parseInt(secondC) + " seconds ago"
			}else if(diffValue >= 0 && secondC < 10){
				result = "just now"
			}else {
				result = formatStr.replace(/"[^"]*"|'[^']*'|\b(?:d{1,4}|M{1,4}|yy(?:yy)?|([hHmstT])\1?|[lLZ])\b/g, function($0) {  
					switch ($0) {  
						case 'd': return date.getDate();  
						case 'dd': return zeroize(date.getDate());  
						case 'ddd': return ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'][date.getDay()];  
						case 'dddd': return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];  
						case 'M': return date.getMonth() + 1;  
						case 'MM': return zeroize(date.getMonth() + 1);  
						case 'MMM': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];  
						case 'MMMM': return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()];  
						case 'yy': return new String(date.getFullYear()).substr(2);  
						case 'yyyy': return date.getFullYear();  
						case 'h': return date.getHours() % 12 || 12;  
						case 'hh': return zeroize(date.getHours() % 12 || 12);  
						case 'H': return date.getHours();  
						case 'HH': return zeroize(date.getHours());  
						case 'm': return date.getMinutes();  
						case 'mm': return zeroize(date.getMinutes());  
						case 's': return date.getSeconds();  
						case 'ss': return zeroize(date.getSeconds());  
						case 'l': return date.getMilliseconds();  
						case 'll': return zeroize(date.getMilliseconds());  
						case 'tt': return date.getHours() < 12 ? 'am' : 'pm';  
						case 'TT': return date.getHours() < 12 ? 'AM' : 'PM';  
					}  
				})
			}
			return result;
		}
		return timeago();  
	}
}
if(typeof module !== 'undefined'){
	module.exports=format;
}