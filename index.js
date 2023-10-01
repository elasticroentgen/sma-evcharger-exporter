import { collectDefaultMetrics as _collectDefaultMetrics, Gauge, register } from 'prom-client';
import express from 'express';

const ev_ip = process.env.EV_HOST
const ev_user = process.env.EV_USER
const ev_password = process.env.EV_PASSWORD

const collectDefaultMetrics = _collectDefaultMetrics;

// Probe every 5th second.
collectDefaultMetrics({timeout: 5000});

// setup metrics
const gMetric = new Gauge({
    name: 'sma_ev_charger',
    help: 'SMA EV Charger metrics',
    labelNames: ['metric']
});

async function fetchLiveData() {

  console.log("Get token...")
  const resp_token = await fetch('http://' + ev_ip + '/api/v1/token?grant_type=password&username=' + ev_user + '&password=' + ev_password, {
    method: 'post',
    headers: {'Content-Type': 'application/json'}
  });
  const data_token = await resp_token.json();
  const token = data_token.access_token;
  console.log("Token = " + token)

  console.log("Fetching Data...")
  const response = await fetch('http://' + ev_ip + '/api/v1/measurements/live', {
    method: 'post',
    body: JSON.stringify([
      {
        "componentId": "IGULD:SELF"
      }
    ]),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  });
  const data = await response.json();

  const result = {}
  // Parse data
  for( const d of data) {
    result[d.channelId] = d.values[0].value
    const value = d.values[0].value;

    if(isNaN(value))
      continue;

    const fv = parseFloat(value)

    gMetric.labels(d.channelId).set(fv)
  }


  console.log(result);

}


const app = express();

app.get('/metrics', async (_req, res) => {
    console.log("Query for metrics")
    const m = await register.metrics()
    res.send(m);
});

app.listen(8000, function() {
  console.log("Fetching...")
  setInterval(() => {
    fetchLiveData();
  },10000)

})


