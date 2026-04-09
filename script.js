// -------------------- Helper: Add Delete Button --------------------
function addDeleteButton(div) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Delete";
  btn.classList.add("delete-btn");
  btn.onclick = () => div.remove();
  div.appendChild(btn);
}

function animateValue(element, start, end, duration = 600) {
  let startTime = null;
  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const value = start + (end - start) * progress;
    element.textContent = "£" + value.toFixed(2);
    if (progress < 1) requestAnimationFrame(animation);
  }
  requestAnimationFrame(animation);
}

let chartView = "monthly";
let projectionChart;

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function setChartView(view) {
  chartView = view;
  populateStatementMonthSelect();
  calculate();
}

function showMenu() {
  document.getElementById("menuContainer").style.display = "block";
  document.getElementById("resultsContainer").style.display = "none";
}

// -------------------- Add Inputs --------------------
function addIncome() {
  const container = document.getElementById("incomeList");
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" placeholder="Name">
    <input type="number" placeholder="£ per month">
  `;
  addDeleteButton(div);
  container.appendChild(div);
}

function addFixed() {
  const container = document.getElementById("fixedList");
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" placeholder="Name">
    <input type="number" placeholder="£ per month">
  `;
  addDeleteButton(div);
  container.appendChild(div);
}

function addVariable() {
  const container = document.getElementById("variableList");
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" placeholder="Name">
    <input type="number" placeholder="£ per month">
    <input type="date">
  `;
  addDeleteButton(div);
  container.appendChild(div);
}

function addFutureIncome() {
  const container = document.getElementById("futureIncomeList");

  const incomeNames = Array.from(
    document.querySelectorAll("#incomeList .item input[type='text']")
  )
    .map(i => i.value.trim())
    .filter(n => n !== "");

  if (incomeNames.length === 0) {
    return alert("Please add at least one income first.");
  }

  const div = document.createElement("div");
  div.classList.add("item");

  // SELECT
  const select = document.createElement("select");
  incomeNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  });

  // INPUTS
  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.placeholder = "Increase £ per month";

  const dateInput = document.createElement("input");
  dateInput.type = "date";

  // APPEND IN ORDER
  div.appendChild(select);
  div.appendChild(amountInput);
  div.appendChild(dateInput);

  addDeleteButton(div);
  container.appendChild(div);
}

function addAdhocIncome() {
  const container = document.getElementById("adhocIncomeList");
  const div = document.createElement("div");
  div.classList.add("item");

  div.innerHTML = `
    <input type="text" placeholder="Name">
    <input type="number" placeholder="£ per month">
    <input type="date">
    <input type="date">
  `;

  addDeleteButton(div);
  container.appendChild(div);
}

function addCreditCard() {
  const container = document.getElementById("creditCardList");
  const div = document.createElement("div");
  div.classList.add("item");

  div.innerHTML = `
    <input type="text" placeholder="Card Name">
    <input type="number" placeholder="£ balance">
  `;

  addDeleteButton(div);
  container.appendChild(div);
}

// -------------------- Dropdown --------------------
function populateStatementMonthSelect() {
  const select = document.getElementById("statementMonthSelect");
  select.innerHTML = "";
  const today = new Date();

  const length = chartView === "yearly" ? 5 : 12;

  for (let i = 0; i < length; i++) {
    const date = chartView === "yearly"
      ? new Date(today.getFullYear() + i, 0, 1)
      : new Date(today.getFullYear(), today.getMonth() + i, 1);

    const option = document.createElement("option");
    option.value = date.toISOString();
    option.text = chartView === "yearly"
      ? date.getFullYear()
      : date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });

    select.appendChild(option);
  }
}

// -------------------- Calculation --------------------
function calculate() {

  document.getElementById("menuContainer").style.display = "none";
  document.getElementById("resultsContainer").style.display = "grid";

  const multiplier = chartView === "yearly" ? 12 : 1;
  const today = new Date();

  const baseIncome = {};
  let fixedTotal = 0;
  let variableItems = [];
  let futureIncomeItems = [];
  let adhocIncomeItems = [];
  let creditCardItems = [];

  document.querySelectorAll("#incomeList .item").forEach(i => {
    baseIncome[i.children[0].value] = parseFloat(i.children[1].value) || 0;
  });

  document.querySelectorAll("#fixedList .item").forEach(i => {
    fixedTotal += parseFloat(i.children[1].value) || 0;
  });

  document.querySelectorAll("#variableList .item").forEach(i => {
    variableItems.push({
      name: i.children[0].value,
      amount: parseFloat(i.children[1].value) || 0,
      end: i.children[2].value ? new Date(i.children[2].value) : null
    });
  });

  document.querySelectorAll("#futureIncomeList .item").forEach(i => {
    futureIncomeItems.push({
      name: i.children[0].value,
      amount: parseFloat(i.children[1].value) || 0,
      start: i.children[2].value ? new Date(i.children[2].value) : null
    });
  });

  document.querySelectorAll("#adhocIncomeList .item").forEach(i => {
    adhocIncomeItems.push({
      name: i.children[0].value,
      amount: parseFloat(i.children[1].value) || 0,
      start: new Date(i.children[2].value),
      end: new Date(i.children[3].value)
    });
  });

  document.querySelectorAll("#creditCardList .item").forEach(i => {
    creditCardItems.push({
      name: i.children[0].value,
      amount: parseFloat(i.children[1].value) || 0
    });
  });

  const incomeNow = Object.values(baseIncome).reduce((a,b)=>a+b,0) * multiplier;
  const fixedNow = fixedTotal * multiplier;

  renderResults(incomeNow, fixedNow, 0, incomeNow - fixedNow, incomeNow - fixedNow);

  renderTimeline(variableItems, baseIncome, fixedTotal);

  renderChartProjectionWithFuture(
    baseIncome,
    fixedTotal,
    variableItems,
    futureIncomeItems,
    adhocIncomeItems,
    creditCardItems
  );
}

// -------------------- Results --------------------
function renderResults(net, fixed, variable, now, future) {
  document.getElementById("output").innerHTML = `
    <div class="card income"><h3>Income</h3><p>£${net.toFixed(2)}</p></div>
    <div class="card expense"><h3>Expenses</h3><p>£${fixed.toFixed(2)}</p></div>
    <div class="card remaining"><h3>Remaining</h3><p>£${now.toFixed(2)}</p></div>
    <div class="card remaining"><h3>Remaining After Variables</h3><p>£${future.toFixed(2)}</p></div>
  `;
}

// -------------------- Timeline --------------------
function renderTimeline(variableItems, baseIncome, fixedTotal) {
  const items = variableItems.filter(v => v.end).sort((a,b)=>a.end-b.end);
  let running = variableItems.reduce((s,v)=>s+v.amount,0);
  const income = Object.values(baseIncome).reduce((a,b)=>a+b,0);

  let html = `<div class="card full"><h3>Timeline</h3>`;
  items.forEach(v => {
    running -= v.amount;
    const remaining = income - fixedTotal - running;
    html += `<div class="timeline-item">${v.name} ends → £${remaining.toFixed(2)}</div>`;
  });
  html += `</div>`;

  document.getElementById("timelineContainer").innerHTML = html;
}

// -------------------- Chart --------------------
function renderChartProjectionWithFuture(baseIncome, fixed, variableItems, futureIncomeItems, adhocIncomeItems, creditCardItems) {
  const labels = [];
  const projected = [];
  const baseline = [];
  const breakdown = [];

  const today = new Date();
  const length = chartView === "yearly" ? 5 : 12;
  const multiplier = chartView === "yearly" ? 12 : 1;

  for (let i = 0; i < length; i++) {

    const date = chartView === "yearly"
      ? new Date(today.getFullYear() + i, 0, 1)
      : new Date(today.getFullYear(), today.getMonth() + i, 1);

    const label = chartView === "yearly"
      ? date.getFullYear()
      : date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });

    labels.push(label);

    let changes = [];

    // ---------------- BASE VALUES ----------------
    let income = Object.values(baseIncome).reduce((a,b)=>a+b,0);

    let variable = variableItems
      .filter(v => !v.end || v.end >= date)
      .reduce((s,v)=>s+v.amount,0);

    // ---------------- FUTURE INCOME ----------------
    futureIncomeItems.forEach(f => {
      if (f.start && f.start <= date) {
        income += f.amount;

        if (
          f.start.getFullYear() === date.getFullYear() &&
          (chartView === "yearly" || f.start.getMonth() === date.getMonth())
        ) {
          changes.push(`⬆️ ${f.name} +£${f.amount}`);
        }
      }
    });

    // ---------------- ADHOC INCOME (FIXED) ----------------
    adhocIncomeItems.forEach(a => {
      if (!a.start || !a.end) return;

      const startMonth = new Date(a.start.getFullYear(), a.start.getMonth(), 1);
      const endMonth = new Date(a.end.getFullYear(), a.end.getMonth(), 1);

      if (date >= startMonth && date <= endMonth) {
        income += a.amount;
      }

      // Track start/end events
      if (
        a.start.getFullYear() === date.getFullYear() &&
        (chartView === "yearly" || a.start.getMonth() === date.getMonth())
      ) {
        changes.push(`⬆️ ${a.name} starts (£${a.amount})`);
      }

      if (
        a.end.getFullYear() === date.getFullYear() &&
        (chartView === "yearly" || a.end.getMonth() === date.getMonth())
      ) {
        changes.push(`⬇️ ${a.name} ends (£${a.amount})`);
      }
    });

    // ---------------- VARIABLE END EVENTS ----------------
    variableItems.forEach(v => {
      if (
        v.end &&
        v.end.getFullYear() === date.getFullYear() &&
        (chartView === "yearly" || v.end.getMonth() === date.getMonth())
      ) {
        changes.push(`⬇️ ${v.name} ends (£${v.amount})`);
      }
    });

    // ---------------- CALCULATIONS ----------------
    const remaining = (income - fixed - variable) * multiplier;

    const baseRemaining =
      (Object.values(baseIncome).reduce((a,b)=>a+b,0) - fixed - variable) * multiplier;

    projected.push(remaining);
    baseline.push(baseRemaining);

    breakdown.push({
      month: label,
      income: income * multiplier,
      fixed: fixed * multiplier,
      variable: variable * multiplier,
      remaining,
      changes
    });
  }

  // ---------------- CHART ----------------
  const ctx = document.getElementById("budgetChart").getContext("2d");
  if (projectionChart) projectionChart.destroy();

  projectionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Baseline",
          data: baseline,
          borderDash: [5,5]
        },
        {
          label: "Projected",
          data: projected
        }
      ]
    },
    options: {
      onClick: (e, el) => {
        if (el.length) showBreakdown(breakdown[el[0].index]);
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const index = context[0].dataIndex;
              const changes = breakdown[index].changes;

              if (!changes.length) return ["", "No changes"];

              return ["", ...changes];
            }
          }
        }
      }
    }
  });
}

// -------------------- Breakdown --------------------
function showBreakdown(data) {
  document.getElementById("breakdownContainer").innerHTML = `
    <div class="card full">
      <h3>${data.month}</h3>
      <p>Income: £${data.income.toFixed(2)}</p>
      <p>Fixed: £${data.fixed.toFixed(2)}</p>
      <p>Variable: £${data.variable.toFixed(2)}</p>
      <p>Remaining: £${data.remaining.toFixed(2)}</p>
    </div>
  `;
}

// -------------------- Scenarios --------------------
function getAllScenarios(){return JSON.parse(localStorage.getItem("budgetScenarios"))||{};}
function saveAllScenarios(data){localStorage.setItem("budgetScenarios",JSON.stringify(data));}

function refreshScenarioList(){
  const scenarios = getAllScenarios();
  const select = document.getElementById("scenarioSelect");
  select.innerHTML = "";
  Object.keys(scenarios).forEach(name=>{const option=document.createElement("option");option.value=name;option.textContent=name;select.appendChild(option);});
}

function saveScenario(){
  const nameInput=document.getElementById("scenarioName");
  const name=nameInput.value.trim();
  if(!name) return alert("Enter a scenario name");
  const scenarios = getAllScenarios();

  const data={
    income:Array.from(document.querySelectorAll("#incomeList .item")).map(item=>({name:item.children[0].value,amount:item.children[1].value})),
    fixed:Array.from(document.querySelectorAll("#fixedList .item")).map(item=>({name:item.children[0].value,amount:item.children[1].value})),
    variable:Array.from(document.querySelectorAll("#variableList .item")).map(item=>({name:item.children[0].value,amount:item.children[1].value,end:item.children[2].value})),
    future:Array.from(document.querySelectorAll("#futureIncomeList .item")).map(item=>({name:item.children[0].value,amount:item.children[1].value,start:item.children[2].value})),
    adhoc:Array.from(document.querySelectorAll("#adhocIncomeList .item")).map(item=>({name:item.children[0].value,amount:item.children[1].value,start:item.children[2].value,end:item.children[3].value}))
  };

  scenarios[name]=data;
  saveAllScenarios(scenarios);
  refreshScenarioList();
  alert("Scenario saved!");
}

function loadScenario(){
  const select = document.getElementById("scenarioSelect");
  const name = select.value;
  const scenarios = getAllScenarios();
  const data = scenarios[name];
  if(!data) return alert("No scenario found");

  ["incomeList","fixedList","variableList","futureIncomeList","adhocIncomeList"].forEach(id=>document.getElementById(id).innerHTML="");

  data.income?.forEach(i=>{addIncome(); const last=document.querySelector("#incomeList .item:last-child"); last.children[0].value=i.name; last.children[1].value=i.amount;});
  data.fixed?.forEach(f=>{addFixed(); const last=document.querySelector("#fixedList .item:last-child"); last.children[0].value=f.name; last.children[1].value=f.amount;});
  data.variable?.forEach(v=>{addVariable(); const last=document.querySelector("#variableList .item:last-child"); last.children[0].value=v.name; last.children[1].value=v.amount; last.children[2].value=v.end;});
  data.future?.forEach(f=>{addFutureIncome(); const last=document.querySelector("#futureIncomeList .item:last-child"); last.children[0].value=f.name; last.children[1].value=f.amount; last.children[2].value=f.start;});
  data.adhoc?.forEach(a=>{addAdhocIncome(); const last=document.querySelector("#adhocIncomeList .item:last-child"); last.children[0].value=a.name; last.children[1].value=a.amount; last.children[2].value=a.start; last.children[3].value=a.end;});
}

// -------------------- Init --------------------
window.onload = function() {
  refreshScenarioList();
  populateStatementMonthSelect();
};