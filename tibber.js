"use strict";

const fetch = require("node-fetch");
const {
  dataPerHourQuery,
  liveQuery,
  gqlSubscriptionEndpointQuery,
  realTimeEnabled,
  user
} = require("./tibber-queries.js");
const WebSocket = require("ws");
const os = require("os");
const fs = require("fs");

const GQL_ENDPOINT = "https://api.tibber.com/v1-beta/gql";
const PROTOCOL = ["graphql-transport-ws"];

const getUserAgent = function () {
  const packageJson = fs.readFileSync("package.json");
  const packageData = JSON.parse(packageJson);
  const version = packageData.version;

  const platform = os.platform();
  const nodeVersion = process.version;

  const userAgent = `MMM-Tibber/${version} (${platform}; Node.js/${nodeVersion})`;
  console.log("User-Agent: " + userAgent);
  return userAgent;
};

const generateId = function () {
  return "id" + Math.random().toString(16).slice(2);
};

const tibber = async function (tibberToken) {
  let tokenVerified = false;

  const tibberGqlQuery = async function (query) {
    const headers = {
      Authorization: `Bearer ${tibberToken}`,
      "Content-Type": "application/json"
    };

    const body = {
      query
    };

    const response = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const res = {
      status: response.status,
      data: {}
    };

    if (response.ok) {
      res.data = await response.json();
    } else {
      if (res.status === 400) {
        console.error(
          "ERROR: Illegal Tibber token. Please sign in to developer.tibber.com to get correct token, and update the modules config."
        );
      } else {
        console.error("ERROR calling Tibber API, status = " + res.status);
      }
    }
    return res;
  };

  const perHour = async function (homeId, hoursHistory = 24) {
    const query = dataPerHourQuery
      .replace("HISTHOURS", hoursHistory)
      .replace("HOMEID", homeId);
    const res = await tibberGqlQuery(query);
    return res.data.data.viewer;
  };

  const verifyRealtimeConsumption = async function (homeId) {
    // Check if realtime consumption is enabled
    const rtc = await tibberGqlQuery(realTimeEnabled.replace("HOMEID", homeId));
    if (rtc.status !== 200) {
      return false;
    }
    if (rtc.data.errors) {
      console.error("ERROR Calling Tibber API:");
      rtc.data.errors.forEach((e) => console.log(e.message));
      return false;
    }
    if (!rtc.data.data.viewer.home.features.realTimeConsumptionEnabled) {
      console.error(
        "ERROR: Realtime consumption from Tibber is not enabled for home with id " +
          homeId +
          " (" +
          rtc.data.data.viewer.home.address.address1 +
          ", " +
          rtc.data.data.viewer.home.address.city +
          ")"
      );
      return false;
    }
    return true;
  };

  let ws;
  let terminated = false;
  let subscriptionId;

  const sendMessage = function (type, id = null, data = {}) {
    const payload = {
      ...data,
      headers: {
        Authorization: "Bearer " + tibberToken
      }
    };
    const message = {
      type,
      payload
    };
    if (id != null) {
      message.id = id;
    }
    const json = JSON.stringify(message);
    ws.send(json);
  };

  const subscribe = async function (homeId, callback) {
    subscriptionId = generateId();
    let connected = false;
    let connectionTimeout;
    let heartbeat;

    console.log("Starting Tibber subscription of live consumption");
    if (!(await verifyRealtimeConsumption(homeId))) {
      return;
    }
    // Find endpoint
    const res = await tibberGqlQuery(gqlSubscriptionEndpointQuery);
    const endpoint = res.data.data.viewer.websocketSubscriptionUrl;
    console.log("Found endpoint: " + endpoint);
    const query = liveQuery.replace("HOMEID", homeId);

    const options = {
      headers: {
        Authorization: "Bearer " + tibberToken,
        "User-Agent": getUserAgent()
      }
    };

    const initWebsocket = function () {
      console.log("Initializing WebSocket");
      ws = new WebSocket(endpoint, PROTOCOL, options);
      const startSubscription = function () {
        const data = {
          query
        };
        sendMessage("subscribe", subscriptionId, data);
      };
      ws.on("open", function open() {
        sendMessage("connection_init");
      });

      ws.on("message", function message(json) {
        const data = JSON.parse(json);
        switch (data.type) {
          case "connection_ack":
            connected = true;
            retryCount = 0;
            startSubscription();
            break;

          case "ping":
            sendMessage("pong");
            break;

          case "pong":
            console.log("Received pong");
            break;

          case "next":
            clearTimeout(connectionTimeout);
            clearTimeout(heartbeat);
            heartbeat = setTimeout(() => {
              console.log("No data for 10 minutes. Restarting.");
              initWebsocket();
            }, 10 * 60 * 1000);
            callback(data.payload.data.liveMeasurement);
            break;

          case "complete":
            console.log("Got complete msg: " + JSON.stringify(data.payload));
            ws.close();
            break;

          case "error":
            console.log("Got error: " + JSON.stringify(data.payload));
            ws.close();
            break;

          default:
            console.log("Received unknown message type: " + data.type);
            break;
        }
      });

      ws.on("error", function error(e) {
        console.log("Tibber WebSocket error: %s", e);
      });

      ws.on("close", function close() {
        console.log("Tibber WebSocket closed");
      });
    };

    let retryCount = 0;
    const reconnect = function () {
      if (terminated) {
        return;
      }
      retryCount++;
      const waitSeconds = Math.round(
        Math.pow(2, retryCount) + Math.random() * 60
      );
      console.log("Reconnecting in " + waitSeconds + " seconds");
      setTimeout(() => {
        console.log("Reconnecting (retry no " + retryCount + ")");
        connected = false;
        if (ws) {
          ws.close();
        }
        initWebsocket();
        setTimeout(() => {
          // Retry again if not connected
          if (!connected) {
            reconnect();
          }
        }, 10000);
      }, waitSeconds * 1000);
    };

    connectionTimeout = setTimeout(() => {
      reconnect();
    }, 20000);

    initWebsocket();

    process.on("SIGINT", function () {
      console.log("Caught interrupt signal");
      close();
      process.exit();
    });
  };

  const close = function () {
    // Close called from client. Shall close ws and terminate all activity.
    terminated = true;
    sendMessage("complete", subscriptionId);
    ws.close();
  };

  const userRes = await tibberGqlQuery(user);
  if (userRes.status === 200) {
    console.info(
      "Tibber API logged in with user " + userRes.data.data.viewer.name
    );
    tokenVerified = true;
  }

  return { close, tokenVerified, tibberGqlQuery, subscribe, perHour };
};

module.exports = tibber;
