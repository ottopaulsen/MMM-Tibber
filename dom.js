"use strict";

function dom(moduleId, showGraphs, showGauges) {
  const wrapper = document.createElement("div");

  const span1 = document.createElement("span");
  const span2 = document.createElement("span");

  // Tibber chart
  const tibberChart = document.createElement("div");
  tibberChart.setAttribute("id", "tibberdata-" + moduleId);
  tibberChart.setAttribute("style", "width:700px; height:200px;");

  const tekst1 = document.createElement("p");
  tekst1.innerHTML = "No Tibber data";
  tibberChart.appendChild(tekst1);

  // Pulse data
  const tibberPulse = document.createElement("div");
  tibberPulse.setAttribute("id", "gauges-" + moduleId);
  tibberPulse.setAttribute("style", "width:350px; height:160px;");

  const tekst2 = document.createElement("p");
  tekst2.innerHTML = "No Pulse data";
  tibberPulse.appendChild(tekst2);

  span1.appendChild(tibberChart);
  span2.appendChild(tibberPulse);
  showGraphs && wrapper.appendChild(span1);
  showGauges && wrapper.appendChild(span2);
  return wrapper;
}
