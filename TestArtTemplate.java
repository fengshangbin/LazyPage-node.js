import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

import javax.script.Bindings;
import javax.script.Compilable;
import javax.script.CompiledScript;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.SimpleBindings;

public class TestArtTemplate {
	private static CompiledScript compiled;
	static{
		ScriptEngineManager manager = new ScriptEngineManager();
		ScriptEngine engine = manager.getEngineByName("nashorn");
		StringBuffer jsStringBuffer = new StringBuffer();
		/*LazyPage.jsPaths.forEach(jsPath -> {
			jsStringBuffer.append(readToString(jsPath));
		});*/
		InputStream is=TestArtTemplate.class.getResourceAsStream("/template-web.js");
		//InputStream is=TestArtTemplate.class.getResourceAsStream("/baiduTemplate.js");
        BufferedReader br=new BufferedReader(new InputStreamReader(is));
		//String jsFileName = "D:\\myEclipseWorkSpace\\J2EEWebTest\\src\\baiduTemplate.js";
		try {
			//FileReader reader = new FileReader(jsFileName);
			jsStringBuffer.append("var process = {'env': {'NODE_ENV': 'production'}};"); //development production
			String line = br.readLine();
			while (line != null) {
				jsStringBuffer.append(line).append("\r\n");
				line = br.readLine();
			}
			br.close();
			jsStringBuffer.append("function run(html, data) {if (typeof data == 'string') data = JSON.parse(data); result = template.render(html, data); return result;};");
			jsStringBuffer.append("run(html, data)");
			compiled = ((Compilable)engine).compile(jsStringBuffer.toString());
			//reader.close();
			br.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		//System.out.println("hello!");
		Bindings bindings = new SimpleBindings();
		bindings.put("html", "123<%= name %>456");
		bindings.put("data", "{\"name\":\"hi\"}");
        String result = "";
        try {
        	result = (String)compiled.eval(bindings);
        } catch (Exception e) {
        	//System.out.println(str+"-"+data+"-"+modeData);
			e.printStackTrace();
		}
        System.out.println(result);
	}

}
