var portfinder = require('portfinder');

(async () => {
    //let port = await getPort({ port: getPort.makeRange(8080, 9000) });
    let port = await portfinder.getPortPromise({
        port: 8080,    // minimum port
        stopPort: 9000 // maximum port
    });
    console.log(port);
})();
  
/* portfinder.getPort({
    port: 3000,    // minimum port
    stopPort: 3333 // maximum port
}, callback); */