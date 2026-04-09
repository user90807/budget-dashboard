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

    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

let chartView = "monthly";

function setChartView(view) {
  chartView = view;
  calculate(); // re-render everything
}

// -------------------- Add Inputs --------------------
function addIncome() {
  const container = document.getElementById("incomeList");
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" placeholder="Name (e.g. Salary)">
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
    <input type="text" placeholder="Name (e.g. Rent)">
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
    <input type="text" placeholder="Name (e.g. Amex Plan)">
    <input type="number" placeholder="£ per month">
    <input type="date">
  `;
  addDeleteButton(div);
  container.appendChild(div);
}

function addFutureIncome() {
  const container = document.getElementById("futureIncomeList");
  const incomeNames = Array.from(document.querySelectorAll("#incomeList .item input[type='text']"))
    .map(i => i.value.trim())
    .filter(n => n !== "");
  if (incomeNames.length === 0) return alert("Please add at least one income before adding future income.");

  const div = document.createElement("div");
  div.classList.add("item");

  const select = document.createElement("select");
  incomeNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  });
  div.appendChild(select);

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.placeholder = "Increase £ per month";
  div.appendChild(amountInput);

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  div.appendChild(dateInput);

  addDeleteButton(div);
  container.appendChild(div);
}

function addAdhocIncome() {
  const container = document.getElementById("adhocIncomeList");
  const incomeNames = Array.from(document.querySelectorAll("#incomeList .item input[type='text']"))
    .map(i => i.value.trim())
    .filter(n => n !== "");
  if (incomeNames.length === 0) return alert("Please add at least one income before adding ad-hoc income.");

  const div = document.createElement("div");
  div.classList.add("item");

  const select = document.createElement("select");
  incomeNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.text = name;
    select.appendChild(option);
  });
  div.appendChild(select);

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.placeholder = "£ per month";
  div.appendChild(amountInput);

  const startInput = document.createElement("input");
  startInput.type = "date";
  div.appendChild(startInput);

  const endInput = document.createElement("input");
  endInput.type = "date";
  div.appendChild(endInput);

  addDeleteButton(div);
  container.appendChild(div);
}

// -------------------- Add Credit Card --------------------
function addCreditCard() {
  const container = document.getElementById("creditCardList");
  const div = document.createElement("div");
  div.classList.add("item");

  // Use flex layout similar to other sections
  div.style.display = "flex";
  div.style.gap = "10px";
  div.style.marginBottom = "10px";
  div.style.alignItems = "center";

  div.innerHTML = `
    <input type="text" placeholder="Credit Card Name (e.g. Amex)" style="flex:2;">
    <input type="number" placeholder="Statement Balance £" style="flex:1;">
  `;

  addDeleteButton(div);
  container.appendChild(div);
}

// -------------------- Populate Statement Month Dropdown --------------------
function populateStatementMonthSelect() {
  const select = document.getElementById("statementMonthSelect");
  select.innerHTML = "";
  const today = new Date();

  const length = chartView === "yearly" ? 5 : 12;

  for (let i = 0; i < length; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const option = document.createElement("option");
    option.value = monthDate.toISOString();
    const label = chartView === "monthly"
      ? monthDate.toLocaleString('en-GB', { month: 'short', year: 'numeric' })
      : monthDate.getFullYear();
    select.appendChild(option);
  }

  select.selectedIndex = 0;
}

// -------------------- Dark Mode --------------------
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// -------------------- Show Menu --------------------
function showMenu() {
  document.getElementById("menuContainer").style.display = "block";
  document.getElementById("resultsContainer").style.display = "none";
}

// -------------------- Calculation --------------------
let projectionChart;
function calculate() {
  document.getElementById("menuContainer").style.display = "none";
  document.getElementById("resultsContainer").style.display = "block";
  document.getElementById("output").innerHTML = "";
  document.getElementById("breakdownContainer").innerHTML = "";

  const today = new Date();
  const baseIncome = {};
  let fixedTotal = 0, variableNow = 0;
  const variableItems = [];
  const futureIncomeItems = [];

  document.querySelectorAll("#incomeList .item").forEach(item => {
    const name = item.children[0].value || "Unnamed";
    const amount = parseFloat(item.children[1].value) || 0;
    baseIncome[name] = amount;
  });

  document.querySelectorAll("#fixedList .item").forEach(item => {
    const amount = parseFloat(item.children[1].value) || 0;
    fixedTotal += amount;
  });

  document.querySelectorAll("#variableList .item").forEach(item => {
    const name = item.children[0].value || "Unnamed";
    const amount = parseFloat(item.children[1].value) || 0;
    const end = item.children[2].value ? new Date(item.children[2].value) : null;
    variableItems.push({ name, amount, end });

    if (!end || end >= today) {
      variableNow += amount;
    }
  });

  document.querySelectorAll("#futureIncomeList .item").forEach(item => {
    const name = item.children[0].value;
    const increase = parseFloat(item.children[1].value) || 0;
    const start = item.children[2].value ? new Date(item.children[2].value) : null;
    futureIncomeItems.push({ name, amount: increase, start });
  });

  const adhocIncomeItems = [];
  document.querySelectorAll("#adhocIncomeList .item").forEach(item => {
    const name = item.children[0].value;
    const amount = parseFloat(item.children[1].value) || 0;
    const start = item.children[2].value ? new Date(item.children[2].value) : null;
    const end = item.children[3].value ? new Date(item.children[3].value) : null;
    if (start && end) {
      adhocIncomeItems.push({ name, amount, start, end });
    }
  });

  // -------------------- CREDIT CARDS --------------------
  const creditCardItems = [];
  document.querySelectorAll("#creditCardList .item").forEach(item => {
    const name = item.children[0].value || "Unnamed";
    const amount = parseFloat(item.children[1].value) || 0;
    creditCardItems.push({ name, amount });
  });

  const statementMonthSelect = document.getElementById("statementMonthSelect");
  const statementMonth = statementMonthSelect.value ? new Date(statementMonthSelect.value) : null;

  const totalIncomeNow = Object.values(baseIncome).reduce((a,b)=>a+b,0);
  const remainingNow = totalIncomeNow - fixedTotal - variableNow;

  renderResults(totalIncomeNow, fixedTotal, variableNow, remainingNow, remainingNow);
  renderTimeline(variableItems, remainingNow, baseIncome, fixedTotal, futureIncomeItems, adhocIncomeItems, creditCardItems, statementMonth);
  renderChartProjectionWithFuture(baseIncome, fixedTotal, variableItems, futureIncomeItems, adhocIncomeItems, creditCardItems, statementMonth);
}

// -------------------- Render Results --------------------
function renderResults(net, fixed, variable, now, future) {
  document.getElementById("output").innerHTML = `
    <div class="card income">
      <h3>Income</h3>
      <p id="incomeVal">£0</p>
    </div>

    <div class="card expense">
      <h3>Expenses (Now)</h3>
      <p id="fixedVal">£0</p>
      <p id="variableVal">£0</p>
    </div>

    <div class="card remaining">
      <h3>Remaining (Now)</h3>
      <p id="nowVal">£0</p>
    </div>

    <div class="card remaining">
      <h3>Remaining (After Variables End)</h3>
      <p id="futureVal">£0</p>
    </div>
  `;

  animateValue(document.getElementById("incomeVal"), 0, net);
  animateValue(document.getElementById("fixedVal"), 0, fixed);
  animateValue(document.getElementById("variableVal"), 0, variable);
  animateValue(document.getElementById("nowVal"), 0, now);
  animateValue(document.getElementById("futureVal"), 0, future);
}

// -------------------- Render Timeline --------------------
function renderTimeline(variableItems, remainingNow, baseIncome, fixedTotal, futureIncomeItems, adhocIncomeItems, creditCardItems=[], statementMonth=null) {
  const timelineItems = [];

  variableItems.forEach(v => { if (v.end) timelineItems.push({ type:"variableEnd", name:v.name, date:v.end, amount:v.amount }); });
  futureIncomeItems.forEach(f => { if (f.start) timelineItems.push({ type:"futureIncome", name:f.name, date:f.start, amount:f.amount }); });
  adhocIncomeItems.forEach(a => {
    timelineItems.push({ type:"adhocStart", name:a.name, date:a.start, amount:a.amount });
    timelineItems.push({ type:"adhocEnd", name:a.name, date:a.end, amount:a.amount });
  });

  // Add credit cards at statement month
  if (statementMonth) {
    creditCardItems.forEach(c => {
      timelineItems.push({ type: "creditCard", name: c.name, date: statementMonth, amount: c.amount });
    });
  }

  timelineItems.sort((a,b)=>a.date-b.date);

  let runningVariable = variableItems.reduce((sum,v)=>sum+v.amount,0);
  let runningIncome = { ...baseIncome };

  let html = `<div class="card full"><h3>Future Timeline</h3>`;

  timelineItems.forEach(item => {
    let colorClass;

    if(item.type === "variableEnd"){
      runningVariable -= item.amount;
      colorClass = "timeline-variable";
    }

    if(item.type==="futureIncome" || item.type==="adhocStart" || item.type==="adhocEnd"){
      if(item.type==="adhocEnd") runningIncome[item.name] -= item.amount; 
      else runningIncome[item.name] = (runningIncome[item.name]||0)+item.amount;
      colorClass = "timeline-income";
    }

    if(item.type==="creditCard"){
      colorClass = "timeline-variable"; // could create special class later
      runningVariable += item.amount;
    }

    const newRemaining = Object.values(runningIncome).reduce((a,b)=>a+b,0)-fixedTotal-runningVariable;

    html += `<div class="timeline-item ${colorClass}">
      <strong>${item.name}</strong>
      <span>${item.date.toLocaleDateString('en-GB')}</span>
      <p>New Remaining: £${newRemaining.toFixed(2)}</p>
    </div>`;
  });

  html += `</div>`;
  const container = document.getElementById("timelineContainer");
  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  container.appendChild(wrapper);
}

// -------------------- Chart Projection --------------------
function renderChartProjectionWithFuture(baseIncome, fixed, variableItems, futureIncomeItems, adhocIncomeItems, creditCardItems=[], statementMonth=null) {
  const months = [];
  const projected = [];
  const baseline = [];
  const monthlyChanges = [];
  const monthlyBreakdown = [];
  const today = new Date();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const label = monthDate.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
    months.push(label);

    let changes = [];

    const baseVariable = variableItems
      .filter(v => !v.end || v.end >= monthDate)
      .reduce((sum, v) => sum + v.amount, 0);

    const baseIncomeTotal = Object.values(baseIncome).reduce((a,b)=>a+b,0);
    let baseRemaining = baseIncomeTotal - fixed - baseVariable;
    baseline.push(baseRemaining);

    let variableTotal = baseVariable;

    variableItems.forEach(v => {
      if (v.end && v.end.getFullYear() === monthDate.getFullYear() && v.end.getMonth() === monthDate.getMonth()) {
        changes.push({ text: `⬇️ ${v.name} ends (£${v.amount})`, type: "expense" });
      }
    });

    const futureIncomeTotal = futureIncomeItems
      .filter(f => f.start && f.start <= monthDate)
      .reduce((sum, f) => sum + f.amount, 0);

    futureIncomeItems.forEach(f => {
      if (f.start && f.start.getFullYear() === monthDate.getFullYear() && f.start.getMonth() === monthDate.getMonth()) {
        changes.push({ text: `⬆️ ${f.name} +£${f.amount}`, type: "income" });
      }
    });

    const adhocTotal = adhocIncomeItems
      .filter(a =>
        a.start && a.end &&
        monthDate >= new Date(a.start.getFullYear(), a.start.getMonth(), 1) &&
        monthDate <= new Date(a.end.getFullYear(), a.end.getMonth(), 1)
      )
      .reduce((sum, a) => sum + a.amount, 0);

    adhocIncomeItems.forEach(a => {
      if (a.start && a.start.getFullYear() === monthDate.getFullYear() && a.start.getMonth() === monthDate.getMonth()) {
        changes.push({ text: `⬆️ ${a.name} starts (£${a.amount})`, type: "income" });
      }
      if (a.end && a.end.getFullYear() === monthDate.getFullYear() && a.end.getMonth() === monthDate.getMonth()) {
        changes.push({ text: `⬇️ ${a.name} ends (£${a.amount})`, type: "expense" });
      }
    });

    // Credit cards
    if(statementMonth && monthDate.getFullYear() === statementMonth.getFullYear() && monthDate.getMonth() === statementMonth.getMonth()){
      creditCardItems.forEach(c => {
        variableTotal += c.amount;
        changes.push({ text: `⬇️ ${c.name} statement (£${c.amount})`, type: "expense" });
      });
    }

    const totalIncome = baseIncomeTotal + futureIncomeTotal + adhocTotal;
    const projRemaining = totalIncome - fixed - variableTotal;
    projected.push(projRemaining);
    monthlyChanges.push(changes);

    monthlyBreakdown.push({
      month: label,
      income: totalIncome,
      fixed: fixed,
      variable: variableTotal,
      remaining: projRemaining,
      changes
    });
  }

  const canvas = document.getElementById("budgetChart");
  if (!canvas) { console.error("Chart canvas not found"); return; }

  const ctx = canvas.getContext("2d");

  if (projectionChart) projectionChart.destroy();

  projectionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        { label: "Baseline", data: baseline, borderColor: "#6c757d", borderDash: [5,5], tension: 0.3, fill: false },
        { label: "Projected Remaining", data: projected, borderColor: "#28a745", backgroundColor: "rgba(40,167,69,0.2)", fill: "-1", tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      onClick: (e, elements) => {
        if (elements.length>0) showBreakdown(monthlyBreakdown[elements[0].index]);
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) { return `${context.dataset.label}: £${context.raw.toFixed(2)}`; },
            afterBody: function(context) {
              const index = context[0].dataIndex;
              const changes = monthlyChanges[index];
              const net = projected[index] - baseline[index];
              let output = ["", `Net change: £${net.toFixed(2)}`, ""];
              if(!changes.length) output.push("No changes"); else { changes.forEach(c => output.push(c.text)); }
              return output;
            }
          }
        },
        legend: { display: true }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// -------------------- Breakdown function --------------------
function showBreakdown(data) {
  const container = document.getElementById("breakdownContainer");
  container.innerHTML = `
    <div class="card full">
      <h3>${data.month} Breakdown</h3>
      <p><strong>Income:</strong> £${data.income.toFixed(2)}</p>
      <p><strong>Fixed:</strong> £${data.fixed.toFixed(2)}</p>
      <p><strong>Variable (incl. Credit Cards):</strong> £${data.variable.toFixed(2)}</p>
      <p><strong>Remaining:</strong> £${data.remaining.toFixed(2)}</p>
      <h4>Changes</h4>
      ${ data.changes.length ? data.changes.map(c=>`<p>${c.text}</p>`).join("") : "<p>No changes</p>" }
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