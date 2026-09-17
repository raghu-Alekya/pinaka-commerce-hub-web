import { useMemo, useState } from "react";
import "../styles/store-shifts.css";

const DAILY_SHIFTS = [
  {
    date: "2026-09-16",
    totalShifts: 2,
    cashSales: 158.08,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: 0,
    voidItems: 0,
    totalOrders: 4,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 0,
    safeDrop: 0,
  },
  {
    date: "2026-09-15",
    totalShifts: 12,
    cashSales: 1217.19,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: 0,
    voidItems: 0,
    totalOrders: 13,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 0,
    safeDrop: 0,
    refund: 273.12,
  },
  {
    date: "2026-09-12",
    totalShifts: 5,
    cashSales: 418.14,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: 0,
    voidItems: 1,
    totalOrders: 7,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 0,
    safeDrop: 0,
  },
  {
    date: "2026-09-10",
    totalShifts: 18,
    cashSales: 13228.08,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: -20,
    voidItems: 0,
    totalOrders: 0,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 500,
    safeDrop: 0,
    cashback: 33,
    cashbackFee: 3,
    refund: 214.77,
  },
  {
    date: "2026-09-09",
    totalShifts: 7,
    cashSales: 103.98,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: 0,
    voidItems: 2,
    totalOrders: 0,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 800,
    safeDrop: 0,
  },
  {
    date: "2026-09-08",
    totalShifts: 12,
    cashSales: 168.72,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: 0,
    voidItems: 0,
    totalOrders: 0,
    cancelledOrders: 0,
    openingBalance: 200,
    closingBalance: 0,
    safeDrop: 0,
  },
  {
    date: "2026-09-07",
    totalShifts: 2,
    cashSales: 64.77,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: 0,
    voidItems: 0,
    totalOrders: 3,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 0,
    safeDrop: 0,
  },
  {
    date: "2026-09-02",
    totalShifts: 2,
    cashSales: 347.30,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: -40,
    voidItems: 24,
    totalOrders: 0,
    cancelledOrders: 0,
    openingBalance: 1000,
    closingBalance: 0,
    safeDrop: 0,
    cashback: 148,
    cashbackFee: 8,
  },
  {
    date: "2026-08-06",
    totalShifts: 1,
    cashSales: 11083.94,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: -1020.22,
    voidItems: 171,
    totalOrders: 116,
    cancelledOrders: 0,
    openingBalance: 0,
    closingBalance: 0,
    safeDrop: 0,
    cashback: 131,
    cashbackFee: 11,
  },
  {
    date: "2026-08-04",
    totalShifts: 3,
    cashSales: 279.28,
    cardSales: 0,
    ebtSales: 0,
    payLater: 0,
    payouts: -1060,
    voidItems: 34,
    totalOrders: 3,
    cancelledOrders: 0,
    openingBalance: 2000,
    closingBalance: 1000,
    safeDrop: 0,
    cashback: 56,
    cashbackFee: 5,
  },
];

const SHIFT_DETAILS = {
  "2026-09-16": [
    {
      id: "SHIFT-001",
      title: "Shift Start - manager 1 2026-09-16 02:23:01",
      startTime: "2026-09-16 02:23:01",
      sales: 0,
      payouts: 0,
      cashback: 0,
      refund: 0,
      voidItems: 0,
      safeDropTotal: 0,
      status: "open",
      openingBalance: 0,
      closingBalance: 0,
      tillAmount: 0,
    },
    {
      id: "SHIFT-002",
      title: "Shift Start - manager 1 2026-09-16 00:59:17",
      startTime: "2026-09-16 00:59:17",
      sales: 158.08,
      payouts: 0,
      cashback: 0,
      refund: 0,
      voidItems: 0,
      safeDropTotal: 0,
      status: "closed",
      openingBalance: 0,
      closingBalance: 0,
      overShort: -158.08,
      tillAmount: 158.08,
    },
  ],
};

export default function Shifts() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const selectedShifts = selectedDate
    ? SHIFT_DETAILS[selectedDate] || []
    : [];

  const filteredShifts = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return selectedShifts;

    return selectedShifts.filter((shift) =>
      `${shift.title} ${shift.startTime} ${shift.status}`
        .toLowerCase()
        .includes(value)
    );
  }, [search, selectedShifts]);

  const summary = useMemo(() => {
    return DAILY_SHIFTS.reduce(
      (acc, row) => {
        acc.totalShifts += row.totalShifts;
        acc.cash += row.cashSales;
        acc.card += row.cardSales || 0;
        acc.ebt += row.ebtSales || 0;
        acc.payLater += row.payLater || 0;
        acc.payouts += row.payouts || 0;
        acc.voidItems += row.voidItems || 0;
        acc.orders += row.totalOrders || 0;
        acc.cancelled += row.cancelledOrders || 0;
        acc.opening += row.openingBalance || 0;
        acc.closing += row.closingBalance || 0;
        acc.safeDrop += row.safeDrop || 0;
        return acc;
      },
      {
        totalShifts: 0,
        cash: 0,
        card: 0,
        ebt: 0,
        payLater: 0,
        payouts: 0,
        voidItems: 0,
        orders: 0,
        cancelled: 0,
        opening: 0,
        closing: 0,
        safeDrop: 0,
      }
    );
  }, []);

  const visibleDailyRows = useMemo(() => {
    if (!dateFilter) return DAILY_SHIFTS;
    return DAILY_SHIFTS.filter((row) => row.date === dateFilter);
  }, [dateFilter]);

  const clearFilters = () => {
    setDateFilter("");
    setCurrentPage(1);
  };

  const goToDaily = () => {
    setSelectedDate(null);
    setSearch("");
    setCurrentPage(1);
  };

  return (
    <div className="shifts-page">
      {!selectedDate ? (
        <DailyShiftSummary
          rows={visibleDailyRows}
          summary={summary}
          dateFilter={dateFilter}
          onDateFilterChange={(value) => {
            setDateFilter(value);
            setCurrentPage(1);
          }}
          onClear={clearFilters}
          onSelectDate={setSelectedDate}
          onAddShift={() => {}}
        />
      ) : (
        <DailyShiftDetails
          date={selectedDate}
          shifts={filteredShifts}
          search={search}
          onSearchChange={setSearch}
          onBack={goToDaily}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function DailyShiftSummary({
  rows,
  summary,
  dateFilter,
  onDateFilterChange,
  onClear,
  onSelectDate,
  onAddShift,
}) {
  return (
    <>
      <div className="shifts-page-header">
        <div className="shifts-title-row">
          <h1>Shifts</h1>
          <button type="button" className="shift-add-btn" onClick={onAddShift}>
            Add New Shift
          </button>
        </div>
      </div>

      <ShiftSummaryCards summary={summary} />

      <div className="shift-filter-bar">
        <select defaultValue="">
          <option value="">Bulk actions</option>
          <option value="export">Export</option>
        </select>

        <button type="button" className="shift-small-btn">
          Apply
        </button>

        <select defaultValue="">
          <option value="">All dates</option>
        </select>

        <button type="button" className="shift-small-btn">Today</button>
        <button type="button" className="shift-small-btn">This Week</button>
        <button type="button" className="shift-small-btn">This Month</button>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => onDateFilterChange(event.target.value)}
          aria-label="Filter by date"
        />

        <button type="button" className="shift-small-btn" onClick={onClear}>
          Filter
        </button>

        <div className="shift-list-count">{rows.length || 90} items</div>

        <div className="shift-pagination-mini">
          <button type="button" disabled>«</button>
          <button type="button" disabled>‹</button>
          <button type="button" className="active">1</button>
          <span>of 5</span>
          <button type="button">›</button>
          <button type="button">»</button>
        </div>
      </div>

      <div className="shift-table-card">
        <table className="shifts-table">
          <thead>
            <tr>
              <th className="check-col"><input type="checkbox" /></th>
              <th>DATE</th>
              <th>TOTAL SHIFTS</th>
              <th>TOTAL SALES</th>
              <th>PAYOUTS</th>
              <th>CASHBACK</th>
              <th>REFUND</th>
              <th>VOID ITEMS</th>
              <th>TOTAL ORDERS</th>
              <th>CANCELLED ORDERS</th>
              <th>OPENING BAL</th>
              <th>CLOSING BAL</th>
              <th>SAFE DROP</th>
              <th>DETAILS</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td className="check-col">
                  <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                </td>
                <td>
                  <button
                    type="button"
                    className="shift-date-link"
                    onClick={() => onSelectDate(row.date)}
                  >
                    {row.date}
                  </button>
                </td>
                <td>{row.totalShifts}</td>
                <td>Cash {money(row.cashSales)}</td>
                <td>{money(row.payouts)}</td>
                <td>
                  {money(row.cashback || 0)}
                  {row.cashbackFee ? (
                    <small> (${row.cashbackFee.toFixed(2)} Fee)</small>
                  ) : null}
                </td>
                <td>{money(row.refund || 0)}</td>
                <td>{row.voidItems || 0}</td>
                <td>{row.totalOrders || 0}</td>
                <td>{row.cancelledOrders || 0}</td>
                <td>{money(row.openingBalance)}</td>
                <td>{money(row.closingBalance)}</td>
                <td>{money(row.safeDrop)}</td>
                <td>
                  <button
                    type="button"
                    className="shift-more-btn"
                    onClick={() => onSelectDate(row.date)}
                  >
                    More
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ShiftSummaryCards({ summary }) {
  const cards = [
    ["Total Shifts", summary.totalShifts],
    ["Total Sales", null],
    ["Cash", money(summary.cash)],
    ["Card", money(summary.card)],
    ["EBT", money(summary.ebt)],
    ["Pay later", money(summary.payLater)],
    ["Payouts", money(summary.payouts)],
    ["Void Items", summary.voidItems],
    ["Total Orders", summary.orders],
    ["Cancelled Orders", summary.cancelled],
    ["Opening Bal", money(summary.opening)],
    ["Closing Bal", money(summary.closing)],
    ["Safe Drop", money(summary.safeDrop)],
  ];

  return (
    <div className="shift-summary-card">
      <div className="shift-summary-title">Shift Summary</div>
      <div className="shift-summary-pills">
        {cards.map(([label, value], index) => (
          <div className="shift-summary-pill" key={label}>
            <span>{label}</span>
            <strong>{index === 1 ? "" : value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyShiftDetails({
  date,
  shifts,
  search,
  onSearchChange,
  onBack,
  currentPage,
  onPageChange,
}) {
  const totalSales = shifts.reduce((sum, shift) => sum + shift.sales, 0);
  const totalPayouts = shifts.reduce((sum, shift) => sum + shift.payouts, 0);
  const totalCashback = shifts.reduce((sum, shift) => sum + shift.cashback, 0);
  const totalRefund = shifts.reduce((sum, shift) => sum + shift.refund, 0);
  const totalVoid = shifts.reduce((sum, shift) => sum + shift.voidItems, 0);
  const totalOrders = shifts.reduce((sum, shift) => sum + (shift.orders || 0), 0);
  const totalSafeDrop = shifts.reduce(
    (sum, shift) => sum + shift.safeDropTotal,
    0
  );

  return (
    <>
      <div className="shifts-page-header">
        <div className="shifts-title-row">
          <h1>Shifts</h1>
          <button type="button" className="shift-add-btn">
            Add New Shift
          </button>
        </div>
      </div>

      <div className="shift-details-top">
        <div className="shift-details-summary">
          <div className="shift-summary-title">Shift Summary</div>
          <div className="shift-summary-pills">
            <SummaryPill label="Total Shifts" value={shifts.length} />
            <SummaryPill label="Total Sales" value={money(totalSales)} />
            <SummaryPill label="Cash" value={money(totalSales)} />
            <SummaryPill label="Payouts" value={money(totalPayouts)} />
            <SummaryPill label="Void Items" value={totalVoid} />
            <SummaryPill label="Total Orders" value={totalOrders} />
            <SummaryPill label="Cancelled Orders" value={0} />
            <SummaryPill label="Opening Bal" value={money(0)} />
            <SummaryPill label="Closing Bal" value={money(0)} />
            <SummaryPill label="Safe Drop" value={money(totalSafeDrop)} />
          </div>
        </div>

        <div className="shift-search-area">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder=""
            aria-label="Search shifts"
          />
          <button type="button" className="shift-small-btn">
            Search Shifts
          </button>
        </div>
      </div>

      <div className="shift-filter-bar detail-filter-bar">
        <select defaultValue="">
          <option value="">Bulk actions</option>
          <option value="export">Export</option>
        </select>

        <button type="button" className="shift-small-btn">Apply</button>

        <button type="button" className="shift-back-btn" onClick={onBack}>
          ← Back to Daily Summary
        </button>

        <div className="shift-list-count">{shifts.length} items</div>
      </div>

      <div className="shift-table-card">
        <table className="shifts-table shift-details-table">
          <thead>
            <tr>
              <th className="check-col"><input type="checkbox" /></th>
              <th>TITLE</th>
              <th>START TIME</th>
              <th>SALES</th>
              <th>PAYOUTS</th>
              <th>CASHBACK</th>
              <th>REFUND</th>
              <th>VOID ITEMS</th>
              <th>SAFE DROP TOTAL</th>
              <th>STATUS</th>
              <th>OPENING BAL</th>
              <th>CLOSING BAL</th>
              <th>OVER/SHORT</th>
              <th>TILL AMOUNT</th>
            </tr>
          </thead>

          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td className="check-col">
                  <input type="checkbox" />
                </td>
                <td>
                  <button type="button" className="shift-title-link">
                    {shift.title}
                  </button>
                </td>
                <td>{shift.startTime}</td>
                <td>{shift.sales ? `Cash ${money(shift.sales)}` : ""}</td>
                <td>{money(shift.payouts)}</td>
                <td>{money(shift.cashback)}</td>
                <td>{money(shift.refund)}</td>
                <td>{shift.voidItems}</td>
                <td>{money(shift.safeDropTotal)}</td>
                <td>{shift.status}</td>
                <td>{money(shift.openingBalance)}</td>
                <td>{money(shift.closingBalance)}</td>
                <td
                  className={
                    shift.overShort < 0
                      ? "over-short negative"
                      : "over-short positive"
                  }
                >
                  {shift.overShort !== undefined
                    ? money(shift.overShort)
                    : money(0)}
                </td>
                <td>{money(shift.tillAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shift-bottom-toolbar">
        <select defaultValue="">
          <option value="">Bulk actions</option>
        </select>
        <button type="button" className="shift-small-btn">Apply</button>
        <span>{shifts.length} items</span>
      </div>
    </>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="shift-summary-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
