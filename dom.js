"use strict";

function dom(moduleId, config, translate) {
  const showGraphs = config.showPrice || config.showConsumption;
  const showPower = config.showPowerGauge;
  const showVoltage = config.showVoltageGauge;
  const showCurrent = config.showCurrentGauge;
  const showTable = config.showTable;
  const gaugeStyle =
    "width:" +
    config.gaugesWidth +
    "px; height:" +
    config.gaugesHeight +
    "px;" +
    (config.gaugesVertical ? "" : "display:inline-block;");

  const wrapper = document.createElement("div");

  const name = moduleId.substr(moduleId.indexOf("MMM"));

  Log.info("Translating CURRENT in dom() to " + translate("CURRENT"));

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

  // Table
  const table = document.createElement("div");
  table.setAttribute("id", "table-" + moduleId);
  table.setAttribute(
    "style",
    "width: " + config.tableWidth + "px; padding-above: 30px;"
  );

  const tTable = document.createElement("table");
  tTable.className = "small";
  const tRow = document.createElement("tr");
  const columnElementType = config.tableVertical ? "tr" : "td";

  const tCol1 = document.createElement(columnElementType);
  addTable(tCol1, translate("POWER TODAY"), "acc-power-" + moduleId, config);
  tRow.appendChild(tCol1);

  // const tCol2 = document.createElement(columnElementType);
  // addTable(tCol2, "Current price", "current-price-" + moduleId, config);
  // tRow.appendChild(tCol2);

  const tCol3 = document.createElement(columnElementType);
  addTable(tCol3, translate("COST TODAY"), "acc-cost-" + moduleId, config);
  tRow.appendChild(tCol3);

  tTable.appendChild(tRow);
  table.appendChild(tTable);

  // Build
  showGraphs && !config.gaugesAbove && wrapper.appendChild(graphs);
  showPower && wrapper.appendChild(spanPower);
  showVoltage && wrapper.appendChild(spanVoltage);
  showCurrent && wrapper.appendChild(spanCurrent);
  showGraphs && config.gaugesAbove && wrapper.appendChild(graphs);
  showTable && wrapper.appendChild(table);

  return wrapper;
}

function addTable(tRow, labelText, id, config) {
  // Label
  const label = document.createElement("td");
  label.innerHTML = labelText + ": ";
  label.className = "align-left small-dimmed";
  label.setAttribute(
    "style",
    "white-space: nowrap; padding-left: 20px; color: " +
      config.tableLabelColor +
      ";"
  );
  tRow.appendChild(label);

  // Value
  const value = document.createElement("td");
  value.id = id + "-value";
  value.innerHTML = "";
  value.className = "align-left";
  value.style.color = config.tableValueColor;
  value.setAttribute(
    "style",
    "white-space: nowrap; padding-left: 5px; padding-right: 5px; color: " +
      config.tableValueColor +
      ";"
  );
  tRow.appendChild(value);

  // Unit
  const unit = document.createElement("td");
  unit.id = id + "-unit";
  unit.innerHTML = "";
  unit.className = "align-left small-dimmed";
  unit.style.color = config.tableLabelColor;
  unit.style.whiteSpace = "nowrap";
  unit.style.width = "99%";
  tRow.appendChild(unit);
}
