const { StatusCodes } = require("http-status-codes");
const fetch = require('node-fetch');

// main data loading wrapped as function

const queryStringbase = 'https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.json?time%2Cstation_id%2Cdatasourceid%2CWater_Level_OD_Malin%2CQC_Flag&time%3E='

// response table 
// 0: time, 1: station_id, 2: datasourceid, 3: water level, 4: QC flag 
// 	const jsonUrl = `https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.json?time%2Cstation_id%2Cdatasourceid%2CWater_Level_OD_Malin%2CQC_Flag&time%3E=${todayString}&station_id=%22Galway%20Port%22`
// let ODWaterLevelValue, isOn

// const response = await fetch('https://github.com/');
// const body = await response.text();

const station_ids = ['Galway Port', 'Wexford Harbour', 'Skerries Harbour', 'Dublin Port']

let stationResponse 


async function loadDataAsync() {
  // placeholder stationResponse 

  const stationResponse = {
    'Galway Port': { 'isOn': 1, 'ODWaterLevel': 99, 'url': 's-id_19' },
    'Wexford Harbour': { 'isOn': 1, 'ODWaterLevel': 99, 'url': 's-id_25' },
    'Skerries Harbour': { 'isOn': 1, 'ODWaterLevel': 99, 'url': 's-id_11' },
    'Dublin Port': { 'isOn': 1, 'ODWaterLevel': 99, 'url': 's-id_17' }
  }
  const station_ids = Object.keys(stationResponse)

  const loadedStations = []

  const today = new Date();
  today.setMinutes(-15)
  const todayString = today.toISOString()
  console.log(`async load data starting at ${todayString}`)

  
  station_ids.forEach(station_id => {
    const jsonUrl = `${queryStringbase}${todayString}&station_id=%22${station_id.replace(' ', '%20')}%22`
  
    let ODWaterLevel = 0
    console.log(todayString)
    fetch(jsonUrl)
      .then(res => res.json())
      .then(out => {
        console.log(station_id)
        console.table(out.table.rows)
        const row = out.table.rows.slice(-1)
        // if QC flag === 9: missing value
        if (row[0][4] === 9) {
          stationResponse[station_id]['isOn'] = 1
        } else {
          ODWaterLevel = row[0][3]
          stationResponse[station_id]['ODWaterLevel'] = ODWaterLevel
          // prevValue = out.table.rows.slice(-2)[0][3]
          stationResponse[station_id]['isOn'] = ODWaterLevel > 0 ? 1 : 0
        }
        loadedStations.push(station_id)
      })
      .catch(err => err)
  })
  // try to load data max 5 times with 500ms interval
  let promise = new Promise(function(resolve, reject) {
    
    let attempts = 0
    const maxAttempts = 5

    let timedLoadCheck = setInterval(()=>{
      if (attempts< maxAttempts){
        if (loadedStations.length===station_ids.length) {
          console.log('successfully loaded stations')
          clearInterval(timedLoadCheck)
          return true
        } 
      } else {
        if (loadedStations.length<station_ids.length){
          console.log(`Loaded only ${loadedStations.length} of ${station_ids.length} stations`)
          clearInterval(timedLoadCheck)
          return true
        }
      }
      attempts +=1
    }, 500)

    if(timedLoadCheck) {       
      console.log('All stations loaded!')
       resolve("All stations loaded!");
  }
    else{
      reject(new Error('Missing data')); }
    });

  await promise
  return stationResponse
}

const url = require('url');

const interval = 300000

async function intervalFunc() {
  console.log('Load data at 5 min interval');
  stationResponse = await loadDataAsync()
  // loadData()
}

const port = process.env.PORT || 3000,
  http = require("http"),
  app = http.createServer((request, response) => {
    var pathname = url.parse(request.url).pathname


    console.log(stationResponse)
    console.log("Received an incoming request!!")



    response.writeHead(StatusCodes.OK, {
      "Content-Type": "text/html"
    })


    let responseMessage = "<h1>Hello, let me tell you about the tides!</h1>"
    station_ids.forEach(station_id => {
      let station = stationResponse[station_id]
      responseMessage += `<p>In <strong>${station_id}</strong> the water level is now ${station.ODWaterLevel} and the sensor listening on address <a href=/${station.url}>${station.url}</a> is receiving ${station.isOn}</p>`
    } )

    console.log(`Sent a response`);

    switch (pathname) {
      case (`/${stationResponse[station_ids[0]]['url']}`):
        response.end(`${stationResponse[station_ids[0]].isOn}`)
        break;
      case (`/${stationResponse[station_ids[1]]['url']}`):
        response.end(`${stationResponse[station_ids[1]].isOn}`)
        break;
      case (`/${stationResponse[station_ids[2]]['url']}`):
        response.end(`${stationResponse[station_ids[2]].isOn}`)
        break;
      case (`/${stationResponse[station_ids[3]]['url']}`):
        response.end(`${stationResponse[station_ids[3]].isOn}`)
        break

      default:
        response.write(responseMessage)
        response.end()
        break
    }

  });

  // run load data on start
  (async () => {
  stationResponse = await loadDataAsync()
  //let data = response.json()
  console.log(`response\n `)
  console.log(stationResponse)
  setInterval(intervalFunc, interval);
  app.listen(port)
  console.log(`The server has started and is listening on port number:
   ${port}`)

  })();
  