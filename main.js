const { StatusCodes } = require("http-status-codes");
const fetch = require('node-fetch');

const name = 'Galway Port';
const today = new Date();   
	today.setMinutes(-15)
	const todayString = today.toISOString()

	const url = `https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.json?time%2Cstation_id%2Cdatasourceid%2CWater_Level_OD_Malin&time%3E=${todayString}&station_id=%22Galway%20Port%22`
let ODWaterLevelValue, isOn

// const response = await fetch('https://github.com/');
// const body = await response.text();


fetch(url)
.then(res => res.json())
.then(out =>
			{
				ODWaterLevelValue= 	out.table.rows.slice(-1)[0][3]
		prevValue = out.table.rows.slice(-2)[0][3]

    isOn = ODWaterLevelValue>0 ? 1 : 0	
})

.catch(err => err);


const port = 3000,
   http = require("http"),
   app = http.createServer((request, response) => {
     console.log("Received an incoming request!");
     response.writeHead(StatusCodes.OK, {
       "Content-Type": "text/html"
     });
  
     let responseMessage = `<h1>Hello, let me tell you about the tides in ${name}! The water level is now ${ODWaterLevelValue} and the value is thus ${isOn}</h1>`;
     response.write(responseMessage);
     response.end();
     console.log(`Sent a response : ${responseMessage}`);
   });
  
 app.listen(process.env.PORT || port);
 console.log(`The server has started and is listening on port number:
 ${port}`);