"use strict";

function dom(moduleId, showGraphs, showPower, showVoltage) {
  const wrapper = document.createElement("div");

  const span1 = document.createElement("span");
  const span2 = document.createElement("span");
  const span3 = document.createElement("span");

  // Tibber chart
  const graphs = document.createElement("div");
  graphs.setAttribute("id", "tibberdata-" + moduleId);
  graphs.setAttribute("style", "width:700px; height:200px;");

  const tekst1 = document.createElement("p");
  tekst1.innerHTML = "No Tibber data";
  graphs.appendChild(tekst1);

  // Power
  const power = document.createElement("div");
  power.setAttribute("id", "power-" + moduleId);
  power.setAttribute("style", "width:350px; height:180px;");

  const tekst2 = document.createElement("p");
  tekst2.innerHTML = "No Pulse data";
  power.appendChild(tekst2);

  // Voltage
  const voltage = document.createElement("div");
  voltage.setAttribute("id", "voltage-" + moduleId);
  voltage.setAttribute("style", "width:350px; height:180px;");

  const tekst2 = document.createElement("p");
  tekst2.innerHTML = "No Pulse data";
  voltage.appendChild(tekst2);

  span1.appendChild(graphs);
  span2.appendChild(power);
  span3.appendChild(voltage);
  showGraphs && wrapper.appendChild(span1);
  showPower && wrapper.appendChild(span2);
  showVoltage && wrapper.appendChild(span3);
  return wrapper;
}
