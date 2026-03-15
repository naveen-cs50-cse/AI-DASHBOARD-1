/* ── Enter key ── */
document.getElementById("input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") { e.preventDefault(); document.getElementById("button").click(); }
});

/* ── Spin keyframe ── */
const _s = document.createElement("style");
_s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
document.head.appendChild(_s);

/* ── Main entry point ── */
async function process_start() {
  const inputEl = document.getElementById("input");
  const query = inputEl.value.trim();
  if (!query) { inputEl.focus(); return; }

  window._lastQuestion = query; // save BEFORE clearing

  setLoading(true);
  const t0 = performance.now();

  try {
    await loadChart(query);
    addHistory(query);
    document.getElementById("m-time").textContent = Math.round(performance.now() - t0) + "ms";
  } catch (err) {
    console.error("Pipeline error:", err);
    showError(err.message);
  } finally {
    setLoading(false);
    inputEl.value = "";
  }
}

/* ── Loading state ── */
function setLoading(on) {
  const btn = document.getElementById("button");
  if (on) {
    btn.classList.add("loading");
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Running…`;
  } else {
    btn.classList.remove("loading");
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> Run`;
  }
}

/* ── Stage label (updates button text mid-loading) ── */
function setStage(label) {
  if (!label) return;
  const btn = document.getElementById("button");
  if (btn.classList.contains("loading")) {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> ${label}`;
  }
}

/* ── Error display ── */
function showError(msg) {
  const placeholder = document.getElementById("chartPlaceholder");
  placeholder.style.display = "flex";
  placeholder.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <p style="color:#ef4444;font-size:13px;text-align:center;max-width:260px">${msg}</p>
  `;
  document.getElementById("chartWrap").style.display = "none";
}

/* ── Step 1: NL → SQL via Groq ── */
async function loadChart(userQuestion) {
  setStage("Generating SQL…");

  const res = await fetch("/api/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: userQuestion })
  });
  if (!res.ok) throw new Error(`SQL generation failed (${res.status})`);
  const sqlQuery = await res.json();

  const qa = document.getElementById("queryarea");
  qa.innerHTML = "";
  qa.textContent = sqlQuery;

  await createjsondata(sqlQuery);
}

/* ── Step 2: SQL → rows → AI chart config ── */
async function createjsondata(sqlQuery) {
  setStage("Running query…");

  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: sqlQuery })
  });
  if (!res.ok) throw new Error(`Query execution failed (${res.status})`);
  const data = await res.json();

  if (!data || data.length === 0) {
    showError("Query returned no data. Try a different question.");
    document.getElementById("m-rows").textContent = "0";
    document.getElementById("m-cols").textContent = "0";
    return;
  }
  
  // showDataTable(data);
  window._lastData = data;
  document.getElementById("m-rows").textContent = data.length;
  document.getElementById("m-cols").textContent = Object.keys(data[0]).length;

  // Step 3: AI builds Chart.js config
  setStage("Building chart…");

  const chartRes = await fetch("/api/groq-chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data,
      userQuestion: window._lastQuestion,
      sqlQuery
    })
  });
  if (!chartRes.ok) throw new Error(`Chart AI failed (${chartRes.status})`);
  const chartConfig = await chartRes.json();

  document.getElementById("m-type").textContent = (chartConfig.type || "bar").toUpperCase();
   document.querySelector(".card-chart .card-title").lastChild.textContent = " " + chartConfig.insight.slice(0, 40) + "…";
  if (chartConfig.insight) showInsight(chartConfig.insight);

  document.getElementById("chartPlaceholder").style.display = "none";
  document.getElementById("chartWrap").style.display = "block";

  renderAIChart(chartConfig);
   showDataTable(data);
  setStage(null);
}

/* ── Insight banner (injected above chart) ── */
function showInsight(text) {
  // document.querySelector(".card-chart .card-title").lastChild.textContent = " " + chartConfig.insight.slice(0, 40) + "…";
  let banner = document.getElementById("insightBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "insightBanner";
    banner.style.cssText = [
      "margin: 0 18px 10px",
      "padding: 8px 14px",
      "background: rgba(0,255,163,0.07)",
      "border: 1px solid rgba(0,255,163,0.2)",
      "border-radius: 8px",
      "font-size: 12px",
      "color: #00ffa3",
      "line-height: 1.5",
      "display: flex",
      "align-items: flex-start",
      "gap: 8px"
    ].join(";");
    const chartCard = document.querySelector(".card-chart");
    const chartWrap = document.getElementById("chartWrap");
    chartCard.insertBefore(banner, chartWrap);
  }
  banner.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ffa3" stroke-width="2" style="flex-shrink:0;margin-top:1px">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <span>${text}</span>
  `;
  banner.style.display = "flex";
}

/* ── Query history ── */
function addHistory(q) {
  const list = document.getElementById("historyList");
  const empty = list.querySelector(".history-empty");
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.textContent = q;
  li.onclick = () => { document.getElementById("input").value = q; };
  list.insertBefore(li, list.firstChild);

  if (list.children.length > 8) list.removeChild(list.lastChild);
}

/* ── Render AI-generated Chart.js config ── */
let chartInstance = null;

function renderAIChart(config) {
  const ctx = document.getElementById("chart");
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  // Guarantee dark-theme tooltip regardless of what AI returned
  config.options = config.options || {};
  config.options.responsive = true;
  config.options.maintainAspectRatio = false;
  config.options.animation = config.options.animation || { duration: 700, easing: "easeOutQuart" };
  // add after config.options.animation = ...
if (config.type === "bar") {
  config.data.datasets.forEach(ds => {
    ds.borderSkipped = "bottom"; // safer default than false
  });
}
  config.options.plugins = config.options.plugins || {};
  config.options.plugins.tooltip = Object.assign({
    backgroundColor: "#0d1219",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    titleColor: "#e8eaf0",
    bodyColor: "#8892a4",
    padding: 10,
    cornerRadius: 8,
  }, config.options.plugins.tooltip || {});

  try {
    chartInstance = new Chart(ctx, {
      type: config.type || "bar",
      data: config.data,
      options: config.options
    });
  } catch (err) {
    console.error("Chart render failed:", err);
    showError("Chart rendering failed — the AI returned an invalid config.");
  }


}



function showDataTable(data) {
  const div = document.getElementById("dataTable");
  if (!data || data.length === 0) return;
  const cols = Object.keys(data[0]);
  let html = `<table style="width:100%;font-size:11px;border-collapse:collapse;font-family:'Space Mono',monospace">`;
  html += `<tr>${cols.map(c => `<th style="padding:6px 10px;color:#5a6478;border-bottom:1px solid rgba(255,255,255,0.06);text-align:left">${c}</th>`).join("")}</tr>`;
  data.slice(0, 10).forEach(row => {
    html += `<tr>${cols.map(c => `<td style="padding:5px 10px;color:#8892a4;border-bottom:1px solid rgba(255,255,255,0.04)">${row[c] ?? "—"}</td>`).join("")}</tr>`;
  });
  html += "</table>";
  div.innerHTML = html;
  div.style.display = "block";
}
