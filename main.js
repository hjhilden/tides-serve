const port = 3000,
   http = require("http"),                                              1
   httpStatus = require("http-status-codes"),
   app = http.createServer((request, response) => {                     2
     console.log("Received an incoming request!");
     response.writeHead(httpStatus.OK, {
       "Content-Type": "text/html"
     });                                                                3
  
     let responseMessage = "<h1>Hello, Tides!</h1>";
     response.write(responseMessage);
     response.end();
     console.log(`Sent a response : ${responseMessage}`);
   });
  
 app.listen(port);                                                      4
 console.log(`The server has started and is listening on port number:
 ${port}`);