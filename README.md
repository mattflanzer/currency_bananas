# currency_bananas
Currency Coding Quiz for Banana Stand

This is a Node.js server implementation of the Banana Stand quiz. You must have node (npm) installed. The data storage is implemented using *sqllite3*.

To start, simply install by cloning this repo 
```
git clone https://github.com/mattflanzer/currency_bananas.git matts_bananas
```
and then start the server
```
cd matts_bananas
npm install
npm start
```

The server uses `/api` at the root and defaults to port 3000. You can use enviornment variables to change it, for example 
```
PORT=49158 npm start
```

The API has four RESTful functions: *buy*, *sell*, *status*, and *dump*. All functions return JSON data.

**buy** and **sell** are POST operations that require two data points: _date_ and _qty_, the transacation date and quantity of bananas respectively. 
For **buy**, the return data indicates success or produces an error. 
```
{
  "status":"success"
}
```
To test `curl --data 'date=2019-05-05&qty=10' http://localhost:3000/api/buy`

For **sell**, the returned data additionally indicates the number of bananas actually sold based on inventory and includes a message to that effect.
```
{
  "status":"success",
  "qty":10,
  "message": "sale incomplete: 10 of 30"
}
```
To test `curl --data 'date=2019-05-05&qty=30' http://localhost:3000/api/sell`

**status** is a GET operation that requires the _date_ 
```
http://localhost:3000/api/status/2019-05-05

{"sold":0,"inventory":20,"expired":0,"pnl":-4,"status":"success"}
```

> Note about the **status** (Metrics) function
>
> As described in the problem quiz, the metrics function should take two parameters, start and end dates, but this really doesn't make any sense. The profit/loss (PnL) for the banana stand may be calculated from any end date (sales up and to that date minus the inventory and expired bananas for that date), but even then it's not an exact historical reprsentation. Sales made _after_ the parameter end date would still effect the metrics for that parameter. Implementing at _start date_ likewise may count sales after that date, but not reflect inventory (including expirations) that should otherwise be noticed. To truly implement a full historical accounting (whereby given a _start/end_ date the status could be ascertained for those points in history) would be far more involved and would require a ground-up calculation of any sale up and to that point. That might not be too impactful for a few records, but over time, as transactions grow, it would be quite burdensome.
>
> I've chosen to ignore the _start date_ parameter and report the status using current inventories even for historical end dates.
>
> Or possibily I've misunderstood the problem ;-)

**dump** is a GET operation with no paramters. It simply dumps out the current transaction record.

## Tests
I've implemented a small suite of Mocha/Chai tests that may be executed with
```
npm test
```

These tests validate the basic API and test a few basic buy+sell scenarios including undersales due to inventory or expired bananas.


