"use strict";

function dom(moduleId, config) {
  const showGraphs = config.showPrice || config.showConsumption;
  const showPower = config.showPowerGauge;
  const showVoltage = config.showVoltageGauge;
  const showCurrent = config.showCurrentGauge;
  const showAccumulated = config.showAccumulated;
  const gaugeStyle =
    "width:" +
    config.gaugesWidth +
    "px; height:" +
    config.gaugesHeight +
    "px;" +
    (config.gaugesVertical ? "" : "display:inline-block;");

  const wrapper = document.createElement("div");

  const name = moduleId.substr(moduleId.indexOf("MMM"));

  // Tibber chart
  const graphs = document.createElement("div");
  graphs.align = "center";
  graphs.setAttribute("id", "tibberdata-" + moduleId);
  graphs.setAttribute(
    "style",
    "width:" + config.graphWidth + "px; height:" + config.graphHeight + "px;"
  );

  const defaultTextGraphs = document.createElement("p");
  defaultTextGraphs.innerHTML = "No Tibber data";
  graphs.appendChild(defaultTextGraphs);

  // Power
  const spanPower = document.createElement("span");
  const power = document.createElement("div");
  power.setAttribute("id", "power-" + moduleId);
  power.setAttribute("style", gaugeStyle);

  const defaultTextPower = document.createElement("p");
  defaultTextPower.innerHTML = name + "<br/>Power Gauge";
  power.appendChild(defaultTextPower);
  spanPower.appendChild(power);

  // Voltage
  const spanVoltage = document.createElement("span");
  const voltage = document.createElement("div");
  voltage.setAttribute("id", "voltage-" + moduleId);
  voltage.setAttribute("style", gaugeStyle);

  const defaultTextVoltage = document.createElement("p");
  defaultTextVoltage.innerHTML = name + "<br/>Voltage Gauge";
  voltage.appendChild(defaultTextVoltage);
  spanVoltage.appendChild(voltage);

  // Current
  const spanCurrent = document.createElement("span");
  const current = document.createElement("div");
  current.setAttribute("id", "current-" + moduleId);
  current.setAttribute("style", gaugeStyle);

  const defaultTextCurrent = document.createElement("p");
  defaultTextCurrent.innerHTML = name + "<br/>Current Gauge";
  current.appendChild(defaultTextCurrent);
  spanCurrent.appendChild(current);

  // Accumulated
  const accumulated = document.createElement("div");
  accumulated.setAttribute("id", "accumulated-" + moduleId);
  accumulated.style.width = 700;

  const accTable = document.createElement("table");
  accTable.className = "small";
  const accRow = document.createElement("tr");

  addAccumulated(accRow, "Power today", "acc-power-" + moduleId, config);
  addAccumulated(accRow, "Cost today", "acc-cost-" + moduleId, config);

  accTable.appendChild(accRow);
  accumulated.appendChild(accTable);

  // Build
  showGraphs && !config.gaugesAbove && wrapper.appendChild(graphs);
  showPower && wrapper.appendChild(spanPower);
  showVoltage && wrapper.appendChild(spanVoltage);
  showCurrent && wrapper.appendChild(spanCurrent);
  showAccumulated && wrapper.appendChild(accumulated);
  showGraphs && config.gaugesAbove && wrapper.appendChild(graphs);

  return wrapper;
}

function addAccumulated(accRow, labelText, id, config) {
  // Label
  const label = document.createElement("td");
  label.innerHTML = labelText + ": ";
  label.className = "align-left small-dimmed";
  label.style.color = config.accumulatedLabelColor;
  label.style.whiteSpace = "nowrap";
  accRow.appendChild(label);

  // Value
  const value = document.createElement("td");
  value.id = id + "-value";
  value.innerHTML = "";
  value.className = "align-left";
  value.style.color = config.accumulatedValueColor;
  value.style.whiteSpace = "nowrap";
  accRow.appendChild(value);

  // Unit
  const unit = document.createElement("td");
  unit.id = id + "-unit";
  unit.innerHTML = "";
  unit.className = "align-left small-dimmed";
  unit.style.color = config.accumulatedLabelColor;
  unit.style.whiteSpace = "nowrap";
  unit.style.width = "99%";
  accRow.appendChild(unit);
}
