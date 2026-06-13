const BULAN_ORDER = ['Januari','Februari','Maret','April','Mei','Juni',
                     'Juli','Agustus','September','Oktober','November','Desember'];

const CLUSTER_LABEL = { 2: 'Tinggi', 0: 'Sedang', 1: 'Rendah' };

const ACCENT  = '#f25f87';
const ACCENT2 = '#ff9f43';
const ACCENT3 = '#5b8dee';
const OK      = '#26d7a0';
const MUTED   = '#8891b8';

Chart.defaults.color          = '#8891b8';
Chart.defaults.borderColor    = '#dde3f5';
Chart.defaults.font.family    = "'Poppins', sans-serif";

function gradientLine(ctx, color) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, color + 'CC');
  g.addColorStop(1, color + '00');
  return g;
}

function parseCoord(val) {
  if (val == null || val === '') return null;
  return parseFloat(String(val).replace(',', '.'));
}

function clusterColor(label) {
  return label === 'Tinggi' ? ACCENT : label === 'Sedang' ? ACCENT2 : OK;
}

// Load CSV
function loadCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: r => resolve(r.data),
      error:    e => reject(e)
    });
  });
}

Promise.all([
  loadCSV('../data/integrated/stunting_clustered_results.csv'),
  loadCSV('../data/preprocessed/stunting_cleaned_monthly.csv')
]).then(([clusterRaw, monthlyRaw]) => {

  const CLUSTER_DATA = clusterRaw.map(d => ({
    ...d,
    cluster_label: CLUSTER_LABEL[d.cluster_risiko] ?? 'Rendah',
    lat: parseCoord(d.latitude),
    lon: parseCoord(d.longitude),
    kasus_bblr:         d.kasus_bblr         ?? null,
    rasio_risti:        d.rasio_risti         ?? null,
    capaian_imunisasi:  d.capaian_imunisasi   ?? null,
    prevalensi_stunting: d.prevalensi_stunting ?? null,
  }));

  const monthlyTotals = {};
  monthlyRaw.forEach(r => {
    if (!monthlyTotals[r.bulan]) monthlyTotals[r.bulan] = 0;
    monthlyTotals[r.bulan] += (r.total_stunting || 0);
  });
  const TREND = {
    labels: BULAN_ORDER,
    values: BULAN_ORDER.map(b => Math.round(monthlyTotals[b] || 0))
  };

  const kecMap = {};
  monthlyRaw.forEach(r => {
    if (!kecMap[r.kecamatan]) kecMap[r.kecamatan] = 0;
    kecMap[r.kecamatan] += (r.total_stunting || 0);
  });
  const KECAMATAN = Object.entries(kecMap)
    .map(([kecamatan, total_stunting]) => ({ kecamatan, total_stunting: Math.round(total_stunting) }));

  // Overview Trend 
  (function() {
    const ctx = document.getElementById('overviewTrendChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: TREND.labels,
        datasets: [{
          data: TREND.values,
          borderColor: ACCENT3,
          backgroundColor: gradientLine(ctx, ACCENT3),
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: ACCENT3,
          pointBorderWidth: 2,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#dde3f5' } },
          y: { grid: { color: '#dde3f5' }, ticks: { callback: v => v.toLocaleString('id') } }
        }
      }
    });
  })();

  // Cluster Donut 
  const clusterCounts = { Tinggi: 0, Sedang: 0, Rendah: 0 };
  CLUSTER_DATA.forEach(d => clusterCounts[d.cluster_label]++);
  new Chart(document.getElementById('clusterDonut'), {
    type: 'doughnut',
    data: {
      labels: ['Risiko Tinggi', 'Risiko Sedang', 'Risiko Rendah'],
      datasets: [{
        data: [clusterCounts.Tinggi, clusterCounts.Sedang, clusterCounts.Rendah],
        backgroundColor: [ACCENT, ACCENT2, OK],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} puskesmas` } }
      }
    }
  });

  // Bar Kecamatan
  const kecSorted = [...KECAMATAN].sort((a, b) => a.total_stunting - b.total_stunting);
  new Chart(document.getElementById('kecamatanBar'), {
    type: 'bar',
    data: {
      labels: kecSorted.map(d => d.kecamatan.replace('SEMARANG ', 'SMG ')),
      datasets: [{
        data: kecSorted.map(d => d.total_stunting),
        backgroundColor: kecSorted.map((d, i) => i === kecSorted.length - 1 ? ACCENT : ACCENT3 + 'BB'),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#dde3f5' }, ticks: { callback: v => v.toLocaleString('id') } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // Top 10 Puskesmas Bar
  const top10 = [...CLUSTER_DATA].sort((a, b) => b.total_stunting - a.total_stunting).slice(0, 10).reverse();
  new Chart(document.getElementById('puskesmasBar'), {
    type: 'bar',
    data: {
      labels: top10.map(d => d.puskesmas.replace('NGEMPLAK SIMONGAN', 'NGP SIMONGAN')),
      datasets: [{
        data: top10.map(d => d.total_stunting),
        backgroundColor: top10.map(d => clusterColor(d.cluster_label) + (d.cluster_label === 'Rendah' ? 'BB' : '')),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#dde3f5' }, ticks: { callback: v => v.toLocaleString('id') } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // Full Line Tren
  (function() {
    const ctx = document.getElementById('trenLineChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: TREND.labels,
        datasets: [{
          label: 'Total Kasus',
          data: TREND.values,
          borderColor: ACCENT3,
          backgroundColor: gradientLine(ctx, ACCENT3),
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: TREND.values.map(v =>
            v === Math.max(...TREND.values) ? ACCENT : v === Math.min(...TREND.values) ? OK : '#fff'),
          pointBorderColor: ACCENT3,
          pointBorderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toLocaleString('id')} kasus` } }
        },
        scales: {
          x: { grid: { color: '#dde3f5' } },
          y: { grid: { color: '#dde3f5' }, min: 1000, ticks: { callback: v => v.toLocaleString('id') } }
        }
      }
    });
  })();

  // Tren Turun 
  const trenTurun = [...CLUSTER_DATA].sort((a, b) => a.tren_stunting - b.tren_stunting).slice(0, 5);
  new Chart(document.getElementById('trenTurunBar'), {
    type: 'bar',
    data: {
      labels: trenTurun.map(d => d.puskesmas),
      datasets: [{
        label: 'Slope (kasus/bulan)',
        data: trenTurun.map(d => d.tren_stunting),
        backgroundColor: OK,
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#dde3f5' } },
        y: { grid: { display: false } }
      }
    }
  });

  // Tren Naik
  const trenNaik = [...CLUSTER_DATA].sort((a, b) => b.tren_stunting - a.tren_stunting).slice(0, 5).reverse();
  new Chart(document.getElementById('trenNaikBar'), {
    type: 'bar',
    data: {
      labels: trenNaik.map(d => d.puskesmas),
      datasets: [{
        label: 'Slope (kasus/bulan)',
        data: trenNaik.map(d => d.tren_stunting),
        backgroundColor: ACCENT,
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#dde3f5' } },
        y: { grid: { display: false } }
      }
    }
  });

  // Scatter BBLR 
  const scatterBBLR = CLUSTER_DATA
    .filter(d => d.kasus_bblr != null)
    .map(d => ({ x: d.kasus_bblr, y: d.total_stunting, label: d.puskesmas, cluster: d.cluster_label }));
  new Chart(document.getElementById('scatterBBLR'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Puskesmas',
        data: scatterBBLR,
        backgroundColor: scatterBBLR.map(d => clusterColor(d.cluster) + 'CC'),
        pointRadius: 8,
        pointHoverRadius: 11
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.raw.label}: BBLR ${ctx.raw.x}, Stunting ${ctx.raw.y}` } }
      },
      scales: {
        x: { title: { display: true, text: 'Jumlah Kasus BBLR', color: MUTED }, grid: { color: '#dde3f5' } },
        y: { title: { display: true, text: 'Total Stunting', color: MUTED }, grid: { color: '#dde3f5' } }
      }
    }
  });

  // Scatter Posyandu
  const scatterPos = CLUSTER_DATA
    .filter(d => d.prevalensi_stunting != null && d.prevalensi_stunting < 0.5)
    .map(d => ({ x: d.jml_posyandu, y: d.prevalensi_stunting, label: d.puskesmas, cluster: d.cluster_label }));
  new Chart(document.getElementById('scatterPosyandu'), {
    type: 'scatter',
    data: {
      datasets: [{
        data: scatterPos,
        backgroundColor: scatterPos.map(d => clusterColor(d.cluster) + '99'),
        pointRadius: 8,
        pointHoverRadius: 11
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.label}: ${ctx.raw.x} posyandu, prevalensi ${(ctx.raw.y * 100).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Jumlah Posyandu', color: MUTED }, grid: { color: '#dde3f5' } },
        y: { title: { display: true, text: 'Prevalensi Stunting', color: MUTED }, grid: { color: '#dde3f5' } }
      }
    }
  });

  // Korelasi Bar
  new Chart(document.getElementById('korrBar'), {
    type: 'bar',
    data: {
      labels: ['BBLR↔Stunting (volume)', 'Risti↔Prevalensi', 'Posyandu↔Prevalensi (negatif)', 'Densitas Posyandu↔Prevalensi'],
      datasets: [{
        label: 'Korelasi Pearson (r)',
        data: [0.334, -0.275, -0.223, 0.442],
        backgroundColor: [0.334, -0.275, -0.223, 0.442].map(v => v > 0 ? ACCENT + 'CC' : OK + 'CC'),
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#dde3f5' }, min: -0.5, max: 0.6, ticks: { callback: v => v.toFixed(2) } }
      }
    }
  });
  window._clusterData = CLUSTER_DATA; 

  // Tabel
  let sortKey = 'total_stunting', sortDir = -1;

  window.sortTable = function(key) {
    if (sortKey === key) sortDir *= -1;
    else { sortKey = key; sortDir = -1; }
    window.renderTable();
  };
  
  window.renderTable = function() {
    const filterCluster = document.getElementById('filterCluster').value;
    
    let rows = CLUSTER_DATA.filter(d => {
      if (filterCluster && d.cluster_label !== filterCluster) return false;
      return true;
    });

    rows.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity, bv = b[sortKey] ?? -Infinity;
      return typeof av === 'string' ? av.localeCompare(bv) * sortDir : (av - bv) * sortDir;
    });

    document.getElementById('rowCount').textContent = `${rows.length} puskesmas`;

    document.getElementById('tableBody').innerHTML = rows.map(d => {
      const badgeClass = `badge badge-${d.cluster_label.toLowerCase()}`;
      const tren = d.tren_stunting;
      const trenClass = tren < -0.1 ? 'trend-down' : tren > 0.1 ? 'trend-up' : 'trend-flat';
      const trenStr = (tren > 0 ? '+' : '') + tren.toFixed(2);
      const prev  = d.prevalensi_stunting != null ? (d.prevalensi_stunting * 100).toFixed(2) + '%' : '—';
      const risti = d.rasio_risti != null ? (d.rasio_risti * 100).toFixed(1) + '%' : '—';
      const imun  = d.capaian_imunisasi != null ? d.capaian_imunisasi.toFixed(1) + '%' : '—';
      
      return `<tr>
        <td style="font-weight:600">${d.puskesmas}</td>
        <td>${d.kecamatan}</td>
        <td><span class="${badgeClass}">${d.cluster_label}</span></td>
        <td style="text-align:right">${d.total_stunting.toLocaleString('id')}</td>
        <td style="text-align:right">${prev}</td>
        <td style="text-align:right">${d.kasus_bblr ?? '—'}</td>
        <td style="text-align:right">${risti}</td>
        <td style="text-align:right">${imun}</td>
        <td style="text-align:right">${d.jml_posyandu}</td>
        <td class="${trenClass}" style="text-align:right">${trenStr}</td>
      </tr>`;
    }).join('');
  };

  window.renderTable();

}).catch(err => {
  console.error('Gagal load CSV:', err);
  document.body.insertAdjacentHTML('afterbegin',
    `<div style="background:#fee;color:#c00;padding:16px;font-family:Poppins,sans-serif">
      ⚠️ Gagal memuat data CSV. Pastikan buka dengan live server.
    </div>`);
});

// Tab Switching
function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'peta' && !window._mapInit) initMap();
}

// Map 
function initMap() {
  window._mapInit = true;
  const CLUSTER_DATA = window._clusterData || [];
  const map = L.map('map').setView([-7.005, 110.4], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO', maxZoom: 18
  }).addTo(map);

  CLUSTER_DATA.forEach(d => {
    if (!d.lat || !d.lon) return;
    const color  = clusterColor(d.cluster_label);
    const radius = Math.max(8, Math.min(28, d.total_stunting / 120));
    L.circleMarker([d.lat, d.lon], {
      radius, color, fillColor: color, fillOpacity: 0.75, weight: 2, opacity: 0.9
    }).bindPopup(`
      <div style="font-family:Poppins,sans-serif;font-size:13px;min-width:200px">
        <div style="font-weight:700;font-size:14px;margin-bottom:8px">${d.puskesmas}</div>
        <div style="color:#666;margin-bottom:6px">${d.kecamatan}</div>
        <div style="background:${color}22;border-left:3px solid ${color};padding:4px 8px;border-radius:0 4px 4px 0;margin-bottom:10px;font-weight:600">
          Risiko ${d.cluster_label}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr><td style="color:#888;padding:2px 0">Total Stunting</td><td style="text-align:right;font-weight:600">${d.total_stunting.toLocaleString('id')}</td></tr>
          <tr><td style="color:#888;padding:2px 0">Prevalensi</td><td style="text-align:right">${d.prevalensi_stunting != null ? (d.prevalensi_stunting*100).toFixed(1)+'%' : 'N/A'}</td></tr>
          <tr><td style="color:#888;padding:2px 0">Kasus BBLR</td><td style="text-align:right">${d.kasus_bblr ?? 'N/A'}</td></tr>
          <tr><td style="color:#888;padding:2px 0">Rasio Risti</td><td style="text-align:right">${d.rasio_risti != null ? (d.rasio_risti*100).toFixed(1)+'%' : 'N/A'}</td></tr>
          <tr><td style="color:#888;padding:2px 0">Imunisasi</td><td style="text-align:right">${d.capaian_imunisasi != null ? d.capaian_imunisasi.toFixed(1)+'%' : 'N/A'}</td></tr>
          <tr><td style="color:#888;padding:2px 0">Tren</td><td style="text-align:right;color:${d.tren_stunting < 0 ? '#26d7a0' : '#f25f87'}">${d.tren_stunting > 0 ? '+' : ''}${d.tren_stunting.toFixed(2)} /bulan</td></tr>
        </table>
      </div>
    `).addTo(map);
  });
}