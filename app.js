/**
 * EKRANLARIMIZIN ARDINDA — SCROLLYTELLING APPLICATION LOGIC
 * Interactive Data Journalism Web Application
 * Tech Stack: Vanilla JS, Plotly.js, PapaParse (fallback), CSS3
 */

// Global State
let APP_DATA = null;
let currentOSFilter = 'all';
let currentBoxPoints = 'all';
let currentDemoView = 'age';
let currentConsView = 'battery';
let currentClassView = 'box';

// Common Plotly Dark Theme Config
const PLOTLY_THEME = {
  font: {
    family: "'Outfit', 'Inter', -apple-system, sans-serif",
    color: '#cbd5e1'
  },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  xaxis: {
    gridcolor: 'rgba(148, 163, 184, 0.1)',
    zerolinecolor: 'rgba(148, 163, 184, 0.2)',
    tickfont: { color: '#94a3b8', family: "'JetBrains Mono', monospace", size: 11 },
    title: { font: { color: '#f8fafc', size: 13, weight: 600 } }
  },
  yaxis: {
    gridcolor: 'rgba(148, 163, 184, 0.1)',
    zerolinecolor: 'rgba(148, 163, 184, 0.2)',
    tickfont: { color: '#94a3b8', family: "'JetBrains Mono', monospace", size: 11 },
    title: { font: { color: '#f8fafc', size: 13, weight: 600 } }
  },
  hoverlabel: {
    bgcolor: '#0f172a',
    bordercolor: '#8b5cf6',
    font: { family: "'Inter', sans-serif", color: '#ffffff', size: 12 }
  },
  margin: { l: 60, r: 30, t: 30, b: 60 }
};

const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: false,
  scrollZoom: false
};

// ==========================================================================
// 1. INITIALIZATION & DATA LOADING
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupScrollProgress();
  setupNavigationObserver();
  await loadData();
  setupSliderListener();
  setupWindowResize();
});

/**
 * Loads data from data.json or falls back to user_behavior_dataset.csv
 */
async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`data.json could not be loaded: ${response.statusText}`);
    }
    APP_DATA = await response.json();
    console.log('Successfully loaded data.json:', APP_DATA);
    initializeUI();
  } catch (err) {
    console.warn('data.json loading failed, attempting CSV fallback:', err);
    await loadCSVFallback();
  }
}

/**
 * Fallback to parse user_behavior_dataset.csv directly using PapaParse
 */
async function loadCSVFallback() {
  try {
    const csvResponse = await fetch('user_behavior_dataset.csv');
    if (!csvResponse.ok) {
      throw new Error(`CSV file missing: ${csvResponse.statusText}`);
    }
    const csvText = await csvResponse.text();
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          throw new Error('CSV file has no data.');
        }
        processRawCSVData(results.data);
        initializeUI();
      },
      error: (parseError) => {
        showError(`CSV Okuma Hatası: ${parseError.message}`);
      }
    });
  } catch (csvErr) {
    console.error('All data sources failed:', csvErr);
    showError(`Veri Seti Bulunamadı! Lütfen "data.json" veya "user_behavior_dataset.csv" dosyasının proje dizininde olduğundan emin olun. (${csvErr.message})`);
  }
}

/**
 * Processes raw CSV data into expected APP_DATA structure if fallback is used
 */
function processRawCSVData(rows) {
  const records = rows.map((r, i) => {
    const age = Number(r['Age']);
    let age_group = '18-29';
    if (age >= 30 && age <= 39) age_group = '30-39';
    else if (age >= 40 && age <= 49) age_group = '40-49';
    else if (age >= 50) age_group = '50-59';

    return {
      id: r['User ID'] || (i + 1),
      model: String(r['Device Model'] || ''),
      os: String(r['Operating System'] || ''),
      app_usage: Number(r['App Usage Time (min/day)']),
      screen_time: Number(r['Screen On Time (hours/day)']),
      battery: Number(r['Battery Drain (mAh/day)']),
      apps_installed: Number(r['Number of Apps Installed']),
      data_usage: Number(r['Data Usage (MB/day)']),
      age: age,
      gender: String(r['Gender'] || ''),
      gender_tr: r['Gender'] === 'Female' ? 'Kadın' : 'Erkek',
      behavior_class: Number(r['User Behavior Class']),
      age_group: age_group
    };
  });

  const total = records.length;
  const screenTimes = records.map(r => r.screen_time).sort((a, b) => a - b);
  const appUsages = records.map(r => r.app_usage);
  const dataUsages = records.map(r => r.data_usage);

  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const median = arr => {
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const quantile = (arr, q) => {
    const s = [...arr].sort((a, b) => a - b);
    const pos = (s.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
  };

  const avgScreen = mean(screenTimes);
  const q1 = quantile(screenTimes, 0.25);
  const q3 = quantile(screenTimes, 0.75);

  APP_DATA = {
    overview: {
      total_users: total,
      avg_screen_time: Number(avgScreen.toFixed(2)),
      median_screen_time: Number(median(screenTimes).toFixed(2)),
      avg_app_usage: Number(mean(appUsages).toFixed(1)),
      avg_data_usage: Number(mean(dataUsages).toFixed(1)),
      min_screen_time: screenTimes[0],
      max_screen_time: screenTimes[screenTimes.length - 1]
    },
    screen_time_boxplot: {
      min: screenTimes[0],
      q1: Number(q1.toFixed(2)),
      median: Number(median(screenTimes).toFixed(2)),
      q3: Number(q3.toFixed(2)),
      max: screenTimes[screenTimes.length - 1],
      iqr: Number((q3 - q1).toFixed(2)),
      values: screenTimes
    },
    correlation_app_screen: {
      r: 0.9503,
      r_squared: 0.9031,
      slope: 0.0165,
      intercept: 0.8107
    },
    raw_records: records
  };
}

/**
 * Display top error banner
 */
function showError(msg) {
  const banner = document.getElementById('error-banner');
  const bannerText = document.getElementById('error-banner-text');
  if (banner && bannerText) {
    bannerText.textContent = msg;
    banner.style.display = 'block';
  }
}

// ==========================================================================
// 2. UI INITIALIZATION & RENDER
// ==========================================================================
function initializeUI() {
  if (!APP_DATA) return;

  // 1. Populate Overview Statistics
  const o = APP_DATA.overview;
  if (o) {
    animateCountUp('val-total-users', 0, o.total_users, 1000, 0);
    animateCountUp('val-avg-screen', 0, o.avg_screen_time, 1200, 2);
    animateCountUp('val-avg-app', 0, o.avg_app_usage, 1200, 1);
    animateCountUp('val-avg-data', 0, o.avg_data_usage, 1200, 1);
  }

  // 2. Render All Plots
  renderBoxPlot();
  renderAppScreenScatter();
  renderDemographics();
  renderConsumption();
  renderBehaviorClasses();
  renderUserPercentileChart(5.0);
  updateSliderCalculations(5.0);
}

// ==========================================================================
// 3. CHART 1: SCREEN ON TIME BOX PLOT (BÖLÜM 2)
// ==========================================================================
function renderBoxPlot() {
  const container = document.getElementById('chart-screen-boxplot');
  if (!container || !APP_DATA) return;

  const records = APP_DATA.raw_records;
  const values = records.map(r => r.screen_time);

  const trace = {
    y: values,
    type: 'box',
    name: 'Ekran Süresi',
    boxpoints: currentBoxPoints === 'all' ? 'all' : false,
    jitter: 0.45,
    pointpos: -1.6,
    marker: {
      color: '#38bdf8',
      size: 5,
      opacity: 0.65,
      line: { color: '#0284c7', width: 1 }
    },
    line: {
      color: '#a855f7',
      width: 2.5
    },
    fillcolor: 'rgba(139, 92, 246, 0.25)',
    boxmean: 'sd', // Shows mean and standard deviation
    hoverinfo: 'y+name'
  };

  const layout = {
    ...PLOTLY_THEME,
    yaxis: {
      ...PLOTLY_THEME.yaxis,
      title: 'Günlük Ekran Süresi (Saat/Gün)',
      range: [0, 13],
      dtick: 2
    },
    xaxis: {
      ...PLOTLY_THEME.xaxis,
      showticklabels: false
    },
    annotations: [
      {
        x: 0,
        y: 4.90,
        text: 'Ortanca (Medyan): 4.90 Saat',
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#38bdf8',
        arrowsize: 1,
        font: { color: '#38bdf8', size: 12, family: "'JetBrains Mono', monospace", weight: 600 },
        ax: 80,
        ay: 0,
        bgcolor: 'rgba(15, 23, 42, 0.9)',
        bordercolor: '#0284c7',
        borderwidth: 1
      },
      {
        x: 0,
        y: 7.40,
        text: 'Q3 (%75): 7.40 Saat',
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#a855f7',
        font: { color: '#c084fc', size: 11, family: "'JetBrains Mono', monospace" },
        ax: 70,
        ay: -20,
        bgcolor: 'rgba(15, 23, 42, 0.85)'
      },
      {
        x: 0,
        y: 2.50,
        text: 'Q1 (%25): 2.50 Saat',
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#a855f7',
        font: { color: '#c084fc', size: 11, family: "'JetBrains Mono', monospace" },
        ax: 70,
        ay: 20,
        bgcolor: 'rgba(15, 23, 42, 0.85)'
      }
    ]
  };

  Plotly.newPlot(container, [trace], layout, PLOTLY_CONFIG);
}

function toggleBoxplotPoints(mode) {
  currentBoxPoints = mode;
  document.getElementById('btn-box-all')?.classList.toggle('active', mode === 'all');
  document.getElementById('btn-box-outliers')?.classList.toggle('active', mode === 'outliers');
  renderBoxPlot();
}

// ==========================================================================
// 4. CHART 2: APP USAGE VS SCREEN ON TIME SCATTER PLOT (BÖLÜM 3)
// ==========================================================================
function renderAppScreenScatter() {
  const container = document.getElementById('chart-scatter-app-screen');
  if (!container || !APP_DATA) return;

  let records = APP_DATA.raw_records;
  if (currentOSFilter !== 'all') {
    records = records.filter(r => r.os === currentOSFilter);
  }

  // Scatter Trace
  const scatterTrace = {
    x: records.map(r => r.app_usage),
    y: records.map(r => r.screen_time),
    text: records.map(r => `Kullanıcı #${r.id}<br>Cihaz: ${r.model}<br>İşletim Sistemi: ${r.os}<br>Uygulama: ${r.app_usage} dk/gün<br>Ekran: ${r.screen_time} saat/gün<br>Sınıf: ${r.behavior_class}`),
    hoverinfo: 'text',
    mode: 'markers',
    type: 'scatter',
    name: 'Kullanıcılar',
    marker: {
      size: 7,
      color: records.map(r => r.os === 'iOS' ? '#38bdf8' : '#a855f7'),
      opacity: 0.75,
      line: {
        color: records.map(r => r.os === 'iOS' ? '#0284c7' : '#7e22ce'),
        width: 1
      }
    }
  };

  // Trendline Trace: y = 0.0165x + 0.8107
  const xVals = [20, 610];
  const yVals = xVals.map(x => 0.0165 * x + 0.8107);

  const trendTrace = {
    x: xVals,
    y: yVals,
    mode: 'lines',
    type: 'scatter',
    name: 'OLS Doğrusal Eğilim (r = 0.95)',
    line: {
      color: '#22d3ee',
      width: 2.5,
      dash: 'dash'
    },
    hoverinfo: 'name'
  };

  const layout = {
    ...PLOTLY_THEME,
    xaxis: {
      ...PLOTLY_THEME.xaxis,
      title: 'Uygulama Kullanım Süresi (Dakika/Gün)',
      range: [0, 620]
    },
    yaxis: {
      ...PLOTLY_THEME.yaxis,
      title: 'Günlük Ekran Süresi (Saat/Gün)',
      range: [0, 13]
    },
    legend: {
      font: { color: '#cbd5e1', size: 11 },
      bgcolor: 'rgba(15, 23, 42, 0.8)',
      bordercolor: 'rgba(148, 163, 184, 0.2)',
      x: 0.02,
      y: 0.98
    },
    annotations: [
      {
        x: 450,
        y: 3.5,
        text: 'Pearson Korelasyonu: <b>r = 0.9503</b><br>Belirlilik Katsayısı: <b>R² = 0.9031</b>',
        showarrow: false,
        font: { color: '#ffffff', size: 12, family: "'JetBrains Mono', monospace" },
        bgcolor: 'rgba(15, 23, 42, 0.92)',
        bordercolor: '#8b5cf6',
        borderwidth: 1.5,
        borderpad: 8
      }
    ]
  };

  Plotly.newPlot(container, [scatterTrace, trendTrace], layout, PLOTLY_CONFIG);
}

function filterScatterByOS(os) {
  currentOSFilter = os;
  const buttons = document.querySelectorAll('#scatter-os-filter .tab-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(os.toLowerCase()));
  });
  renderAppScreenScatter();
}

// ==========================================================================
// 5. CHART 3: DEMOGRAPHICS (BÖLÜM 4)
// ==========================================================================
function renderDemographics() {
  const container = document.getElementById('chart-demographics');
  if (!container || !APP_DATA) return;

  const demo = APP_DATA.demographics;
  let traces = [];
  let layout = { ...PLOTLY_THEME };

  if (currentDemoView === 'age') {
    const ageGroups = demo.age_groups;
    traces.push({
      x: ageGroups.map(g => `${g.group} Yaş`),
      y: ageGroups.map(g => g.mean_screen_time),
      type: 'bar',
      name: 'Ortalama Ekran Süresi',
      marker: {
        color: ['#8b5cf6', '#a855f7', '#06b6d4', '#38bdf8'],
        line: { color: '#ffffff', width: 1 }
      },
      text: ageGroups.map(g => `${g.mean_screen_time} saat (n=${g.count})`),
      textposition: 'auto',
      hoverinfo: 'x+text'
    });

    layout.yaxis = {
      ...PLOTLY_THEME.yaxis,
      title: 'Ortalama Ekran Süresi (Saat/Gün)',
      range: [0, 7.5]
    };
    layout.xaxis = {
      ...PLOTLY_THEME.xaxis,
      title: 'Yaş Grupları'
    };
  } else if (currentDemoView === 'gender') {
    const genders = demo.gender;
    traces.push({
      x: genders.map(g => g.gender_tr),
      y: genders.map(g => g.mean_screen_time),
      type: 'bar',
      name: 'Ortalama Ekran Süresi',
      marker: {
        color: ['#a855f7', '#06b6d4'],
        line: { color: '#ffffff', width: 1 }
      },
      text: genders.map(g => `${g.mean_screen_time} saat (n=${g.count})`),
      textposition: 'auto',
      hoverinfo: 'x+text'
    });

    layout.yaxis = {
      ...PLOTLY_THEME.yaxis,
      title: 'Ortalama Ekran Süresi (Saat/Gün)',
      range: [0, 7.5]
    };
    layout.xaxis = {
      ...PLOTLY_THEME.xaxis,
      title: 'Cinsiyet'
    };
  } else if (currentDemoView === 'cross') {
    const cross = demo.cross_groups;
    const groups = ['18-29', '30-39', '40-49', '50-59'];
    const femaleData = groups.map(grp => cross.find(c => c.group === grp && c.gender === 'Female')?.mean_screen_time || 0);
    const maleData = groups.map(grp => cross.find(c => c.group === grp && c.gender === 'Male')?.mean_screen_time || 0);

    traces.push({
      x: groups.map(g => `${g} Yaş`),
      y: femaleData,
      type: 'bar',
      name: 'Kadın',
      marker: { color: '#c084fc' },
      text: femaleData.map(v => `${v}s`),
      textposition: 'auto'
    });

    traces.push({
      x: groups.map(g => `${g} Yaş`),
      y: maleData,
      type: 'bar',
      name: 'Erkek',
      marker: { color: '#38bdf8' },
      text: maleData.map(v => `${v}s`),
      textposition: 'auto'
    });

    layout.barmode = 'group';
    layout.yaxis = {
      ...PLOTLY_THEME.yaxis,
      title: 'Ortalama Ekran Süresi (Saat/Gün)',
      range: [0, 7.5]
    };
    layout.xaxis = {
      ...PLOTLY_THEME.xaxis,
      title: 'Yaş Grupları'
    };
    layout.legend = {
      font: { color: '#cbd5e1' },
      bgcolor: 'rgba(15, 23, 42, 0.8)'
    };
  }

  Plotly.newPlot(container, traces, layout, PLOTLY_CONFIG);
}

function updateDemographicsView(view) {
  currentDemoView = view;
  document.getElementById('btn-demo-age')?.classList.toggle('active', view === 'age');
  document.getElementById('btn-demo-gender')?.classList.toggle('active', view === 'gender');
  document.getElementById('btn-demo-cross')?.classList.toggle('active', view === 'cross');
  renderDemographics();
}

// ==========================================================================
// 6. CHART 4: CONSUMPTION (BATTERY & DATA) (BÖLÜM 5)
// ==========================================================================
function renderConsumption() {
  const container = document.getElementById('chart-consumption');
  if (!container || !APP_DATA) return;

  const records = APP_DATA.raw_records;
  let traces = [];
  let layout = { ...PLOTLY_THEME };

  if (currentConsView === 'battery') {
    // App usage vs Battery Drain
    traces.push({
      x: records.map(r => r.app_usage),
      y: records.map(r => r.battery),
      mode: 'markers',
      type: 'scatter',
      name: 'Pil Tüketimi',
      text: records.map(r => `Kullanıcı #${r.id}<br>Uygulama: ${r.app_usage} dk<br>Pil: ${r.battery} mAh/gün`),
      hoverinfo: 'text',
      marker: {
        color: '#f59e0b',
        size: 7,
        opacity: 0.75,
        line: { color: '#b45309', width: 1 }
      }
    });

    // Trendline
    const xVals = [20, 610];
    const yVals = xVals.map(x => 4.7885 * x + 226.73);
    traces.push({
      x: xVals,
      y: yVals,
      mode: 'lines',
      type: 'scatter',
      name: 'Doğrusal Eğilim (r = 0.9564)',
      line: { color: '#fbbf24', width: 2.5, dash: 'dash' }
    });

    layout.xaxis = { ...PLOTLY_THEME.xaxis, title: 'Uygulama Kullanım Süresi (Dakika/Gün)' };
    layout.yaxis = { ...PLOTLY_THEME.yaxis, title: 'Pil Tüketimi (mAh/Gün)' };
    layout.annotations = [{
      x: 180,
      y: 2800,
      text: 'Uygulama - Pil Korelasyonu:<br><b>r = 0.9564</b> (Çok Yüksek)',
      showarrow: false,
      font: { color: '#fef3c7', size: 12, family: "'JetBrains Mono', monospace" },
      bgcolor: 'rgba(15, 23, 42, 0.9)',
      bordercolor: '#f59e0b',
      borderwidth: 1.5
    }];
  } else if (currentConsView === 'data') {
    // App usage vs Data Usage
    traces.push({
      x: records.map(r => r.app_usage),
      y: records.map(r => r.data_usage),
      mode: 'markers',
      type: 'scatter',
      name: 'Veri Tüketimi',
      text: records.map(r => `Kullanıcı #${r.id}<br>Uygulama: ${r.app_usage} dk<br>Veri: ${r.data_usage} MB/gün`),
      hoverinfo: 'text',
      marker: {
        color: '#10b981',
        size: 7,
        opacity: 0.75,
        line: { color: '#047857', width: 1 }
      }
    });

    // Trendline
    const xVals = [20, 610];
    const yVals = xVals.map(x => 3.6053 * x - 47.92);
    traces.push({
      x: xVals,
      y: yVals,
      mode: 'lines',
      type: 'scatter',
      name: 'Doğrusal Eğilim (r = 0.9423)',
      line: { color: '#34d399', width: 2.5, dash: 'dash' }
    });

    layout.xaxis = { ...PLOTLY_THEME.xaxis, title: 'Uygulama Kullanım Süresi (Dakika/Gün)' };
    layout.yaxis = { ...PLOTLY_THEME.yaxis, title: 'Veri Tüketimi (MB/Gün)' };
    layout.annotations = [{
      x: 180,
      y: 2200,
      text: 'Uygulama - Veri Korelasyonu:<br><b>r = 0.9423</b> (Çok Yüksek)',
      showarrow: false,
      font: { color: '#d1fae5', size: 12, family: "'JetBrains Mono', monospace" },
      bgcolor: 'rgba(15, 23, 42, 0.9)',
      bordercolor: '#10b981',
      borderwidth: 1.5
    }];
  } else if (currentConsView === 'dual') {
    // Both normalized
    traces.push({
      x: records.map(r => r.screen_time),
      y: records.map(r => r.battery),
      mode: 'markers',
      type: 'scatter',
      name: 'Pil (mAh)',
      marker: { color: '#f59e0b', size: 6, opacity: 0.7 }
    });

    traces.push({
      x: records.map(r => r.screen_time),
      y: records.map(r => r.data_usage),
      mode: 'markers',
      type: 'scatter',
      name: 'Veri (MB)',
      marker: { color: '#10b981', size: 6, opacity: 0.7 }
    });

    layout.xaxis = { ...PLOTLY_THEME.xaxis, title: 'Günlük Ekran Süresi (Saat/Gün)' };
    layout.yaxis = { ...PLOTLY_THEME.yaxis, title: 'Miktar (mAh veya MB)' };
    layout.legend = {
      font: { color: '#cbd5e1' },
      bgcolor: 'rgba(15, 23, 42, 0.8)'
    };
  }

  Plotly.newPlot(container, traces, layout, PLOTLY_CONFIG);
}

function updateConsumptionView(view) {
  currentConsView = view;
  document.getElementById('btn-cons-battery')?.classList.toggle('active', view === 'battery');
  document.getElementById('btn-cons-data')?.classList.toggle('active', view === 'data');
  document.getElementById('btn-cons-dual')?.classList.toggle('active', view === 'dual');
  renderConsumption();
}

// ==========================================================================
// 7. CHART 5: USER BEHAVIOR CLASSES (BÖLÜM 6)
// ==========================================================================
function renderBehaviorClasses() {
  const container = document.getElementById('chart-classes-display');
  if (!container || !APP_DATA) return;

  const classes = APP_DATA.behavior_classes;
  const records = APP_DATA.raw_records;
  let traces = [];
  let layout = { ...PLOTLY_THEME };

  if (currentClassView === 'box') {
    // Comparative Boxplot across all 5 classes
    const colors = ['#06b6d4', '#38bdf8', '#8b5cf6', '#a855f7', '#ec4899'];
    for (let c = 1; c <= 5; c++) {
      const classRecords = records.filter(r => r.behavior_class === c);
      traces.push({
        y: classRecords.map(r => r.screen_time),
        type: 'box',
        name: `Sınıf ${c}`,
        marker: { color: colors[c - 1] },
        boxpoints: 'all',
        jitter: 0.35,
        pointpos: -1.5,
        fillcolor: `rgba(${c === 1 ? '6,182,212' : c === 5 ? '236,72,153' : '139,92,246'}, 0.25)`
      });
    }

    layout.yaxis = {
      ...PLOTLY_THEME.yaxis,
      title: 'Ekran Süresi (Saat/Gün)',
      range: [0, 13]
    };
    layout.xaxis = {
      ...PLOTLY_THEME.xaxis,
      title: 'Davranış Sınıfları (1: Minimalist → 5: Power User)'
    };
    layout.showlegend = false;
  } else if (currentClassView === 'bar') {
    // User count bar chart
    traces.push({
      x: classes.map(c => `Sınıf ${c.class}`),
      y: classes.map(c => c.count),
      type: 'bar',
      name: 'Kullanıcı Sayısı',
      marker: {
        color: ['#06b6d4', '#38bdf8', '#8b5cf6', '#a855f7', '#ec4899'],
        line: { color: '#ffffff', width: 1 }
      },
      text: classes.map(c => `${c.count} Kişi (%${c.percentage})`),
      textposition: 'auto'
    });

    layout.yaxis = {
      ...PLOTLY_THEME.yaxis,
      title: 'Katılımcı Sayısı (Kişi)',
      range: [0, 175]
    };
    layout.xaxis = {
      ...PLOTLY_THEME.xaxis,
      title: 'Davranış Sınıfları'
    };
  }

  Plotly.newPlot(container, traces, layout, PLOTLY_CONFIG);
}

function updateClassView(view) {
  currentClassView = view;
  document.getElementById('btn-class-box')?.classList.toggle('active', view === 'box');
  document.getElementById('btn-class-bar')?.classList.toggle('active', view === 'bar');
  renderBehaviorClasses();
}

// ==========================================================================
// 8. SECTION 7: INTERACTIVE PERCENTILE CALCULATOR & DISTRIBUTION CHART
// ==========================================================================
function setupSliderListener() {
  const slider = document.getElementById('screen-time-slider');
  if (!slider) return;

  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    updateSliderCalculations(val);
  });
}

function updateSliderCalculations(selectedHours) {
  if (!APP_DATA || !APP_DATA.raw_records) return;

  const records = APP_DATA.raw_records;
  const total = records.length; // 700

  // Count participants with Screen On Time <= selectedHours
  const lessOrEqualCount = records.filter(r => r.screen_time <= selectedHours).length;
  const percentile = ((lessOrEqualCount / total) * 100).toFixed(1);

  // Update DOM displays
  const displayVal = document.getElementById('display-slider-val');
  const displayMin = document.getElementById('display-slider-minutes');
  const displayPctNum = document.getElementById('display-percentile-num');
  const displayPctText = document.getElementById('display-percentile-text');
  const displayPctSub = document.getElementById('display-percentile-subtext');

  if (displayVal) displayVal.textContent = selectedHours.toFixed(1);
  if (displayMin) displayMin.textContent = `${Math.round(selectedHours * 60)} Dakika`;
  if (displayPctNum) displayPctNum.textContent = percentile;

  if (displayPctText) {
    if (selectedHours < 1.0) {
      displayPctText.innerHTML = `Girdiğiniz süre veri setindeki tüm 700 katılımcıdan <strong>daha düşüktür</strong> (%0.0 dilimi).`;
    } else if (selectedHours >= 12.0) {
      displayPctText.innerHTML = `Veri setindeki tüm katılımcıların <strong>%100'üne</strong> eşit veya üzerindesiniz.`;
    } else {
      displayPctText.innerHTML = `Veri setindeki kullanıcıların <strong>%${percentile}'sinden</strong> daha az veya eşit ekran süresine sahipsiniz.`;
    }
  }

  if (displayPctSub) {
    displayPctSub.textContent = `Örneklemdeki ${total} kişinin ${lessOrEqualCount}'sinden daha az veya eşit ekran süreniz var.`;
  }

  // Update dynamic indicator on the chart
  renderUserPercentileChart(selectedHours);
}

function renderUserPercentileChart(userVal) {
  const container = document.getElementById('chart-user-percentile');
  if (!container || !APP_DATA) return;

  const records = APP_DATA.raw_records;
  const screenTimes = records.map(r => r.screen_time);

  // Histogram of all 700 participants
  const histTrace = {
    x: screenTimes,
    type: 'histogram',
    name: 'Kullanıcı Dağılımı',
    xbins: {
      start: 0.5,
      end: 12.5,
      size: 0.5
    },
    marker: {
      color: 'rgba(139, 92, 246, 0.45)',
      line: {
        color: '#a855f7',
        width: 1
      }
    },
    hoverinfo: 'x+y'
  };

  const layout = {
    ...PLOTLY_THEME,
    xaxis: {
      ...PLOTLY_THEME.xaxis,
      title: 'Günlük Ekran Süresi (Saat/Gün)',
      range: [0, 13],
      dtick: 2
    },
    yaxis: {
      ...PLOTLY_THEME.yaxis,
      title: 'Kişi Sayısı (Frekans)'
    },
    showlegend: false,
    shapes: [
      {
        type: 'line',
        x0: userVal,
        x1: userVal,
        y0: 0,
        y1: 75,
        line: {
          color: '#38bdf8',
          width: 3.5,
          dash: 'solid'
        }
      }
    ],
    annotations: [
      {
        x: userVal,
        y: 65,
        text: `Sen: ${userVal.toFixed(1)} Saat`,
        showarrow: true,
        arrowhead: 2,
        arrowcolor: '#38bdf8',
        arrowsize: 1,
        font: { color: '#ffffff', size: 12, family: "'JetBrains Mono', monospace", weight: 700 },
        bgcolor: '#0284c7',
        bordercolor: '#38bdf8',
        borderwidth: 1,
        borderpad: 6,
        ax: userVal > 6 ? -50 : 50,
        ay: -25
      }
    ]
  };

  Plotly.react(container, [histTrace], layout, PLOTLY_CONFIG);
}

// ==========================================================================
// 9. SCROLL PROGRESS & NAVIGATION INTERSECTION OBSERVER
// ==========================================================================
function setupScrollProgress() {
  const progressBar = document.getElementById('reading-progress-bar');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = (window.scrollY / totalHeight) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

function setupNavigationObserver() {
  const sections = document.querySelectorAll('.story-section');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('data-section') === id);
        });
      }
    });
  }, {
    rootMargin: '-30% 0px -40% 0px',
    threshold: 0
  });

  sections.forEach(sec => observer.observe(sec));
}

// ==========================================================================
// 10. NUMBER COUNT-UP ANIMATION HELPER
// ==========================================================================
function animateCountUp(elementId, start, end, duration, decimals) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    const currentVal = start + (end - start) * easeProgress;
    el.textContent = currentVal.toFixed(decimals);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      el.textContent = end.toFixed(decimals);
    }
  };
  window.requestAnimationFrame(step);
}

// ==========================================================================
// 11. RESPONSIVE WINDOW RESIZE
// ==========================================================================
function setupWindowResize() {
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const chartIds = [
        'chart-screen-boxplot',
        'chart-scatter-app-screen',
        'chart-demographics',
        'chart-consumption',
        'chart-classes-display',
        'chart-user-percentile'
      ];
      chartIds.forEach(id => {
        const container = document.getElementById(id);
        if (container && container.data) {
          Plotly.Plots.resize(container);
        }
      });
    }, 150);
  });
}
