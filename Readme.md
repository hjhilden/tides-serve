# Tide data server
Read tides data from Irish tide gauge network on page load and analyze responses, responds with 1 or 0 based on water level and pushes to station-specific page. 
[https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.html](https://erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.html)

Extremely minimal app built on [this tutorial](https://freecontent.manning.com/building-a-simple-web-server-in-node-js/)


Location name | station_id | datasourceid | url
-- | -- | -- | --
"Spanish Arch" | "Galway" | 19 | s-id_19
"Wexford Harbour" | "Wexford Harbour" | 25 | s-id_25
"Balbriggan Lighthouse" | "Skerries Harbour" | 11 | s-id_11
"Martello Tower, Blackrock Park, Dublin" | "Dublin Port" | 17 | s-id_17