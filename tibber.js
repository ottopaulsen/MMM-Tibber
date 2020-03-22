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

let socket;
let tibberToken;
let homeNumber;
let callback;
let initMsg;
let startMsg;
let closing = false;

heartbeat = function() {
  clearTimeout(this.pingTimeout);
  this.pingTimeout = setTimeout(() => {
    console.log("Terminating Tibber socket after timeout");
    socket.terminate();
  }, 10000);
};

exports.close = function() {
  closing = true;
  if (socket) {
    console.log("Closing (terminating) Tibber socket");
    socket.close();
    socket.terminate(); // Change to close when stable
  } else {
    console.error("Cannot close Tibber socket");
  }
};

getHeaders = function() {
  return {
    Authorization: "Bearer " + tibberToken,
    "Content-Type": "application/json"
  };
};

exports.subscribe = function(token, home, cb) {
  tibberToken = token;
  homeNumber = home;
  callback = cb;

  this.getHomes(tibberToken).then(homes => {
    const homeId = homes[homeNumber].id;
    console.log("Home id for home ", homeNumber, " = ", homeId);

    initMsg = JSON.stringify({
      type: "connection_init",
      payload: "token=" + tibberToken
    });

    startMsg = JSON.stringify({
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
    connect();
  });
};

connect = function() {
  console.log("Opening Tibber socket");
  socket = new WebSocket(subEndpoint, "graphql-ws", getHeaders());

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
      callback(data);
      heartbeat();
    });
    console.log("Initiating Tibber subscription");
    socket.send(initMsg);
    console.log("Subscription request: ", startMsg);
    socket.send(startMsg);
  });

  socket.on("close", function close() {
    clearTimeout(this.pingTimeout);
    if (closing) {
      console.log("Tibber socket disconnected successfully");
    } else {
      console.log(
        "Tibber socket disconnected unexpectingly. Reconnecting in 45 seconds."
      );
      socket.terminate();
      setTimeout(() => {
        console.log("Reconnecting Tibber subscription");
        connect();
      }, 45000);
    }
  });
};
