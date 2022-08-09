# Tide data server
Read tides data from Irish tide gauge network on page load and analyze responses, responds with 1 or 0 based on water level and pushes to station-specific page. 
[https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.html](https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.html)

Stations return 0 if data is flagged as missing or if station feed is completely down.
Loads data every 5 minutes. Will attempt data fetching 5 times with 500 ms interval for each run. 

Extremely minimal app built on [this tutorial](https://freecontent.manning.com/building-a-simple-web-server-in-node-js/)

Location name | station_id | datasourceid | url | device count
-- | -- | -- | -- | --
Spanish Arch | Galway Port | 19 | s-id_19 | 3
Wexford Harbour | Wexford Harbour | 25 | s-id_25 | 3
Balbriggan Lighthouse | Skerries Harbour | 11 | s-id_11 | 1
Martello Tower, Blackrock Park, Dublin | Dublin Port | 17 | s-id_17 | 1