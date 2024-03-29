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

const station_ids = [
  { 'id': 'Galway Port', 'url': 's-id_19' },
  { 'id': 'Wexford Harbour', 'url': 's-id_25' },
  { 'id': 'Skerries Harbour', 'url': 's-id_11' },
  { 'id': 'Dublin Port', 'url': 's-id_17' }
]

const lastValidValue = {}

// reuse previous value for N updates in case of invalid / missing data
const resetValidCounter = 30

// general set OFF or ON based on water level

const setState = (waterLevel) => {return waterLevel > 0 ? 1 : 0}


// average output values 

const averageArray = (array) =>{
  const initialValue = 0;
  const sumWithInitial = array.reduce(
(previousValue, currentValue) => previousValue + currentValue,
initialValue
);

const avg =  +(sumWithInitial/array.length).toFixed(0)
return avg
}

// select a column from returned table
const extractColumn = (array, col=3) => {
  return array.map(d=>{return d[col]})
}

// fill in values with previous if max difference is exceeded
const checkArray = (array) =>{
  let prev = array[0]
  const outputs = []
  for (let index = 1; index < array.length; index++) {
          let current = array[index]
              
      if (Math.abs(prev-current)>maxDiff) {
            current = prev
          } else { prev = current }
      
  outputs.push(setState(current))
  }
  return outputs
 
}




// maximum accepted difference between current and previous value
const maxDiff = 0.9
// 
const windowWidth = 4

let stationResponse


async function loadDataAsync() {
  // placeholder stationResponse 

  const stationResponse = {}

  const loadedStations = []

  // because new data is not published in real time, we will load older data 
  // and display data from 15 minutes ago

  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes()-60)

  const startTimeString = startTime.toISOString()
  
  const displayedTime = new Date();
  displayedTime.setMinutes(displayedTime.getMinutes()-25)

  console.log(`async load data starting from ${startTime}\n
  displayed time is ${displayedTime}`)


  station_ids.forEach(station_id => {

    let id = station_id.id

    stationResponse[id] = { 'url': station_id.url }

    const jsonUrl = `${queryStringbase}${startTimeString}&station_id=%22${id.replace(' ', '%20')}%22`

    let ODWaterLevel = 1
    let time
    let isValid = false

    fetch(jsonUrl)
      .then(res => res.json())
      .then(out => {
        console.log(id)
        console.table(out.table.rows)
        // default to latest row
        let row = out.table.rows.slice(-1)[0]
        

        // if previous values have been recorded, 
        // return the first row that is newer to handle uneven data delivery
          let n = 0
          while (new Date(out.table.rows[n][0]) < displayedTime 
          && n < out.table.rows.length-1) {
            n += 1
          }
          row = out.table.rows[n]

          // get previous values based on moving window and average
          let previous = extractColumn(out.table.rows.slice(n-windowWidth, n))

          let stateAverage = averageArray(checkArray(previous))

        time = row[0]

        ODWaterLevel = Number(row[3])

        // if QC flag === 9: missing value (seems to not be used)
        if (row[4] === 9) {
          if (lastValidValue[id]) {
            ODWaterLevel = lastValidValue[id].ODWaterLevel
            lastValidValue[id].remainingCount -=1
          }

        } else {
          isValid = true
          if (lastValidValue[id] === undefined) {
            lastValidValue[id] = { 'time': time, 'ODWaterLevel': ODWaterLevel, 'remainingCount': resetValidCounter }
          }
          if (new Date(time) > new Date(lastValidValue[id].time)) {
            lastValidValue[id] = { 'time': time, 'ODWaterLevel': ODWaterLevel, 'remainingCount': resetValidCounter }
          }
        }
        const stateValue = setState(ODWaterLevel)

        stationResponse[id]['time'] = time
        stationResponse[id]['ODWaterLevel'] = ODWaterLevel
        
        // determine whether to set on or off
        stationResponse[id]['isOn'] = stateAverage

        stationResponse[id]['isValid'] = isValid

        loadedStations.push(id)

        console.log(`time: ${time} isOn: ${stateValue} average isOn:${stateAverage}\n`)

      })
      .catch(err => {
        console.log(err)
        if(lastValidValue[id] && lastValidValue[id].remainingCount && lastValidValue[id].remainingCount>0) {
          ODWaterLevel = lastValidValue[id].ODWaterLevel
          lastValidValue[id].remainingCount -=1
        } else {ODWaterLevel = 99}
        stationResponse[id]['isOn'] = setState(ODWaterLevel)
        stationResponse[id]['ODWaterLevel'] = ODWaterLevel
        stationResponse[id]['isValid'] = isValid
        stationResponse[id]['time'] = displayedTime.toISOString()
      })
  })
  // try to load data max 5 times with 500ms interval
  let promise = new Promise(function (resolve, reject) {

    let attempts = 0
    const maxAttempts = 5

    let timedLoadCheck = setInterval(() => {
      if (attempts < maxAttempts) {
        if (loadedStations.length === station_ids.length) {
          console.log('successfully loaded stations')
          clearInterval(timedLoadCheck)
          console.log('-------- previous valid response --------')
          console.table(lastValidValue)
          console.log('-------- current values --------')
          console.table(stationResponse)
          return true
        }
      } else {
        if (loadedStations.length < station_ids.length) {
          console.log(`Loaded only ${loadedStations.length} of ${station_ids.length} stations`)
          clearInterval(timedLoadCheck)
          return true
        }
      }
      attempts += 1
    }, 500)

    if (timedLoadCheck) {
      console.log('All stations loaded!')
      resolve("All stations loaded!");
    }
    else {
      reject(new Error('Missing data'));
    }
  });

  await promise

  return stationResponse
}

const url = require('url');

const interval = 60000*5

async function intervalFunc() {
  console.log(`Load data at ${interval/60000} min interval`);
  stationResponse = await loadDataAsync()
  // loadData()
}

const port = process.env.PORT || 3000,
  http = require("http"),
  app = http.createServer((request, response) => {
    var pathname = url.parse(request.url).pathname


    if (request.url != '/favicon.ico') {
      console.log("Received an incoming request!!")
      console.log(stationResponse)
      console.log("last valid values")
      console.log(lastValidValue)
    }


    response.writeHead(StatusCodes.OK, {
      "Content-Type": "text/html"
    })


    let responseMessage = "<h1>Hello, let me tell you about the tides!</h1>"
    station_ids.forEach(station_id => {
      let station = stationResponse[station_id.id]
      responseMessage += `<p>In <strong>${station_id.id}</strong> the water level is now ${station.ODWaterLevel} and the sensor listening on address <a href=/${station.url}>${station.url}</a> is receiving ${station.isOn}. The timestamp is ${station.time}</p>`
    })

    console.log(`Sent a response`);
    switch (pathname) {
      case (`/${stationResponse[station_ids[0].id]['url']}`):
        response.end(`${stationResponse[station_ids[0].id].isOn}`)
        break;
      case (`/${stationResponse[station_ids[1].id]['url']}`):
        response.end(`${stationResponse[station_ids[1].id].isOn}`)
        break;
      case (`/${stationResponse[station_ids[2].id]['url']}`):
        response.end(`${stationResponse[station_ids[2].id].isOn}`)
        break;
      case (`/${stationResponse[station_ids[3].id]['url']}`):
        response.end(`${stationResponse[station_ids[3].id].isOn}`)
        break

      default:
        response.write(responseMessage)
        response.end()
        break
    }

  });

// run load data on start
(async () => {
  console.log(`started at ${new Date()}`)
  stationResponse = await loadDataAsync()
  //let data = response.json()
  console.log(`response\n `)
  console.log(stationResponse)
  setInterval(intervalFunc, interval);
  app.listen(port)
  console.log(`The server has started and is listening on port number:
   ${port}`)

})();
