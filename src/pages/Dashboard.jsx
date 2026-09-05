import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
} from "chart.js";
import { orders } from "../data/data";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler
);
ChartJS.defaults.font.family = "Inter";
ChartJS.defaults.font.size = 9;
ChartJS.defaults.color = "#8991a2";

const miniCharts = [
  ["Merchants", "148", "12 this week", "purple", "bi-shop",
    [15,18,17,22,19,25,20,26,23,28], "#6552dc", "rgba(101,82,220,0.08)"],
  ["Stores", "342", "28 this week", "blue", "bi-building",
    [18,22,25,20,29,24,30,25,33,29], "#4286df", "rgba(66,134,223,0.08)"],
];

const topStores = [
  ["DS","Downtown Store","Downtown, TX","$48,752.40","24.5%","purple-bg"],
  ["WM","Westside Market","Austin, TX","$37,126.80","18.7%","blue-bg"],
  ["SM","Sunshine Mart","Houston, TX","$28,934.30","16.3%","green-bg"],
  ["AE","Airport Express","Dallas, TX","$24,583.70","14.9%","yellow-bg"],
  ["LS","Lakeside Store","Plano, TX","$18,567.20","13.1%","lavender-bg"],
];

const alerts = [
  ["7 stores are offline","Last offline: 15 mins ago","10m ago","alert-red","bi-exclamation-triangle-fill"],
  ["23 sync failures","WooCommerce sync failed","25m ago","alert-orange","bi-arrow-repeat"],
  ["Low stock alert","12 products running low","1h ago","alert-blue","bi-box-seam"],
  ["Subscription expiring","3 merchants in 7 days","2h ago","alert-purple","bi-clock"],
  ["Daily reconciliation completed","No mismatches found","3h ago","alert-green","bi-check-lg"],
];

function MiniChart({ data, borderColor, backgroundColor }) {
  const ref = useRef(null);
  const chartData = {
    labels: ["1","2","3","4","5","6","7","8","9","10"],
    datasets: [{
      data,
      borderColor,
      backgroundColor,
      fill: true,
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.45,
    }],
  };
  return (
    <div className="mini-chart">
      <Line ref={ref} data={chartData} options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { capBezierPoints: true } },
      }} />
    </div>
  );
}

function SalesChart() {
  const ref = useRef(null);
  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const values = [41000,56000,43000,70000,56000,29000,39000];
  const data = {
    labels,
    datasets: [{
      label: "Sales",
      data: values,
      borderColor: "#6350dc",
      backgroundColor: (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return "rgba(98,78,220,0.10)";
        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, "rgba(98, 78, 220, 0.20)");
        gradient.addColorStop(1, "rgba(98, 78, 220, 0.01)");
        return gradient;
      },
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: "#fff",
      pointBorderColor: "#6350dc",
      pointBorderWidth: 2,
      fill: true,
      tension: 0.35,
    }],
  };
  return <Line ref={ref} data={data} options={{
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e2740",
        titleFont: { size: 10 },
        bodyFont: { size: 10 },
        padding: 8,
        displayColors: false,
        callbacks: { label: c => "$" + c.parsed.y.toLocaleString() },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 8 }, color: "#8c94a4" },
      },
      y: {
        min: 0, max: 80000,
        ticks: {
          stepSize: 20000,
          font: { size: 8 },
          color: "#8c94a4",
          callback: value => value === 0 ? "$0" : "$" + (value / 1000) + "K",
        },
        grid: { color: "#eef0f4", drawTicks: false },
        border: { display: false },
      },
    },
  }} />;
}

function StatusDonut({ values, colors, center, label }) {
  return (
    <div className="donut-area">
      <div className="donut-wrapper">
        <Doughnut data={{
          labels: ["Primary","Secondary","Other","Unknown"],
          datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, spacing: 2 }],
        }} options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          plugins: { legend: { display: false }, tooltip: { enabled: true } },
        }} />
        <div className="donut-center">
          <strong>{center}</strong><span>{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        document.querySelector(".global-search input")?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const doRefresh = () => {
    setRefresh(true);
    window.setTimeout(() => setRefresh(false), 800);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h1>Dashboard</h1><p>Overview of your Pinaka Commerce Hub platform</p></div>
        <div className="page-actions">
          <button className="date-btn"><i className="bi bi-calendar3" /> This Week <i className="bi bi-chevron-down" /></button>
          <button className="refresh-btn" onClick={doRefresh} disabled={refresh}>
            <i className={`bi bi-arrow-clockwise ${refresh ? "spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="row g-3 dashboard-row">
        {miniCharts.map(([title,value,change,kind,icon,data,border,bg]) => (
          <div className="col-xl-6 col-lg-6 col-md-6" key={title}>
            <div className="stat-card">
              <div className="stat-top">
                <div className={`stat-icon ${kind}`}><i className={`bi ${icon}`} /></div>
                <div className="stat-info"><span>{title}</span><strong>{value}</strong><small className="positive"><i className="bi bi-arrow-up" /> {change}</small></div>
              </div>
              <MiniChart data={data} borderColor={border} backgroundColor={bg} />
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 dashboard-row">
        <div className="col-xl-5 col-lg-7">
          <div className="dashboard-card sales-card">
            <div className="card-header-custom"><h3>Sales Overview</h3><select defaultValue="This Week"><option>This Week</option><option>Last Week</option><option>This Month</option></select></div>
            <div className="sales-filter"><select defaultValue="Total Sales"><option>Total Sales</option><option>Orders</option><option>Cash</option></select></div>
            <div className="sales-chart-container"><SalesChart /></div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-5">
          <div className="dashboard-card">
            <div className="card-header-custom"><h3>Top Stores by Sales</h3><a href="#stores" onClick={e=>{e.preventDefault();nav("/stores")}}>View all</a></div>
            <div className="store-table">
              <div className="store-heading"><span>STORE</span><span>SALES</span></div>
              {topStores.map(([initials,name,location,sales,percent,cls]) => (
                <div className="store-row" key={initials}>
                  <div className="store-name"><div className={`store-avatar ${cls}`}>{initials}</div><div><strong>{name}</strong><small>{location}</small></div></div>
                  <div className="store-sales"><strong>{sales}</strong><small>↑ {percent}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-12">
          <div className="dashboard-card alerts-card">
            <div className="card-header-custom"><h3>Alerts & Notifications</h3><a href="#alerts">View all</a></div>
            <div className="alert-list">
              {alerts.map(([title,desc,time,cls,icon]) => <div className="alert-item" key={title}>
                <div className={`alert-icon ${cls}`}><i className={`bi ${icon}`} /></div>
                <div className="alert-content"><strong>{title}</strong><small>{desc}</small></div><span>{time}</span>
              </div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 dashboard-row">
        <div className="col-xl-3 col-lg-6">
          <div className="dashboard-card status-card">
            <div className="card-header-custom"><h3>Synchronization Status</h3><a href="#sync">View all</a></div>
            <StatusDonut values={[287,18,23,14]} colors={["#4dbd73","#4b8dde","#eb606a","#aeb5c3"]} center="342" label="Stores" />
            <div className="legend-list">
              <div><span className="dot green-dot" />In Sync <b>287 (83.9%)</b></div>
              <div><span className="dot blue-dot" />Syncing <b>18 (5.3%)</b></div>
              <div><span className="dot red-dot" />Failed <b>23 (6.7%)</b></div>
              <div><span className="dot gray-dot" />Not Configured <b>14 (4.1%)</b></div>
            </div>
            <div className="status-footer"><span>Last Sync: 2 mins ago</span><button>Sync Now</button></div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6">
          <div className="dashboard-card status-card">
            <div className="card-header-custom"><h3>Device Status</h3><a href="#devices">View all</a></div>
            <StatusDonut values={[742,186,28,26]} colors={["#4dbd73","#eb606a","#e9aa38","#aeb5c3"]} center="982" label="Devices" />
            <div className="legend-list">
              <div><span className="dot green-dot" />Online <b>742 (75.6%)</b></div>
              <div><span className="dot red-dot" />Offline <b>186 (18.9%)</b></div>
              <div><span className="dot orange-dot" />Error <b>28 (2.9%)</b></div>
              <div><span className="dot gray-dot" />Maintenance <b>26 (2.6%)</b></div>
            </div>
            <div className="status-footer"><span>Last Updated: 1 min ago</span><button onClick={()=>nav("/devices")}>Manage Devices</button></div>
          </div>
        </div>

        <div className="col-xl-6 col-lg-12">
          <div className="dashboard-card orders-card">
            <div className="card-header-custom"><h3>Recent Orders</h3><a href="#orders" onClick={e=>{e.preventDefault();nav("/orders")}}>View all</a></div>
            <div className="table-responsive"><table className="table recent-orders-table"><thead><tr><th>ORDER ID</th><th>STORE</th><th>AMOUNT</th><th>STATUS</th><th>TIME</th></tr></thead>
              <tbody>{orders.map(o=><tr key={o.id}><td><strong>{o.id}</strong></td><td>{o.store}</td><td>{o.amount}</td><td><span className={`status ${o.status.toLowerCase()}`}>{o.status}</span></td><td>{o.time}</td></tr>)}</tbody>
            </table></div>
          </div>
        </div>
      </div>
    </div>
  );
}
