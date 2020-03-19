const RP = require("request-promise");
const WebSocket = require("ws");

const gqlEndpoint = "https://api.tibber.com/v1-beta/gql";
const subEndpoint = "wss://api.tibber.com/v1-beta/gql/subscriptions";

// Reference: https://developer.tibber.com/docs/reference#priceinfo
const tibberDataQuery = `{ "query": "{  
    viewer{  
      homes {
        id
        address {
          address1
          postalCode
          city
        }
        currentSubscription {
          priceInfo {
            current {
              total
              startsAt
              level
            }
            today {
              total
              startsAt
              level
            }
            tomorrow {
              total
              startsAt
              level
            }
          }
        }
        consumption(resolution: HOURLY, last: HISTHOURS) {
          nodes {
            from
            to
            cost
            unitPrice
            unitPriceVAT
            consumption
            consumptionUnit
          }
        }
      }
    }  
 }" }`;

const homesQuery = `{ "query": "{
  viewer {
    homes {
      id
      address {
        address1
        address2
        address3
        postalCode
        city
        country
        latitude
        longitude
      }
    }
  }
}" }`;

let socket;

tibberQuery = function(tibberToken, query) {
  return new Promise((resolve, reject) => {
    RP({
      headers: {
        Authorization: "Bearer " + tibberToken,
        "Content-Type": "application/json"
      },
      uri: gqlEndpoint,
      body: query.replace(/\n/g, ""),
      method: "POST",
      resolveWithFullResponse: true,
      followRedirect: false
    })
      .then(res => {
        res = JSON.parse(res.body);
        resolve(res);
      })
      .catch(e => {
        reject(e);
      });
  });
};

// noop = function() {};

// heartbeat = function() {
//   this.isAlive = true;
// };

// const interval = setInterval(function ping() {
//   socket.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) return ws.terminate();

//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 30000);

heartbeat = function() {
  clearTimeout(this.pingTimeout);
  this.pingTimeout = setTimeout(() => {
    console.log("Terminating Tibber socket after timeout");
    socket.terminate();
  }, 10000);
};

exports.getTibber = function(tibberToken, homeNumber = 0, hoursHistory = 24) {
  return new Promise((resolve, reject) => {
    tibberQuery(tibberToken, tibberDataQuery.replace("HISTHOURS", hoursHistory))
      .then(res => {
        resolve(res.data.viewer.homes[homeNumber]);
      })
      .catch(e => {
        reject(e);
      });
  });
};

exports.getHomes = function(tibberToken) {
  return new Promise((resolve, reject) => {
    tibberQuery(tibberToken, homesQuery)
      .then(res => {
        resolve(res.data.viewer.homes);
      })
      .catch(e => {
        reject(e);
      });
  });
};

exports.close = function() {
  if (socket) {
    console.log("Closing Tibber socket");
    socket.close();
  } else {
    console.error("Cannot close Tibber socket");
  }
};

exports.subscribe = function(tibberToken, homeNumber, cb) {
  const headers = {
    Authorization: "Bearer " + tibberToken,
    "Content-Type": "application/json"
  };

  this.getHomes(tibberToken).then(homes => {
    const homeId = homes[homeNumber].id;
    console.log("Home id for home ", homeNumber, " = ", homeId);

    const initMsg = JSON.stringify({
      type: "connection_init",
      payload: "token=" + tibberToken
    });

    const startMsg = JSON.stringify({
      id: "1",
      type: "start",
      payload: {
        variables: {},
        extensions: {},
        operationName: null,
        query:
          `
        subscription {
          liveMeasurement(homeId: "` +
          homeId +
          `") {
            timestamp
            power
            accumulatedConsumption
            accumulatedCost
            currency
            minPower
            averagePower
            maxPower
            voltagePhase1
            voltagePhase2
            voltagePhase3
            currentL1
            currentL2
            currentL3
          }
        }
      `
      }
    })
      .replace(/ /g, "")
      .replace(/\\n/g, ",");

    if (socket) {
      console.log("Closing Tibber socket.");
      socket.close();
    }
    console.log("Opening Tibber socket");
    socket = new WebSocket(subEndpoint, "graphql-ws", headers);

    socket.on("error", function error(msg) {
      console.error("Tibber socker error: ", msg);
      console.error("Closing Tibber socket");
      socket.close();
    });

    socket.on("open", function open() {
      console.log("Tibber socket connected: ", socket.readyState);
      heartbeat();
      socket.on("message", function incoming(data) {
        console.log("Receiving message: ", data);
        cb(data);
        heartbeat();
      });
      console.log("Initiating Tibber subscription");
      socket.send(initMsg);
      console.log("Subscription request: ", startMsg);
      socket.send(startMsg);
    });

    socket.on("close", function close() {
      console.log("Tibber socket disconnected");
      clearTimeout(this.pingTimeout);
    });
  });
};
