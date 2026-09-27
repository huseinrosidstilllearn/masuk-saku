import { money } from '../domain/finance';
import { weeklyCashflow } from '../domain/cashflow';
import type { Transaction } from '../domain/types';
import { Icon } from './Icon';

export function CashflowChart({
  rows,
  month,
  hide,
}: {
  rows: Transaction[];
  month: string;
  hide: boolean;
}) {
  const weeks = weeklyCashflow(rows, month);
  const highest = Math.max(...weeks.flatMap((week) => [week.income, week.expense]), 1);
  const magnitude = 10 ** Math.floor(Math.log10(highest));
  const ceiling = Math.ceil(highest / (3 * magnitude)) * 3 * magnitude;
  const income = weeks.reduce((sum, week) => sum + week.income, 0);
  const expense = weeks.reduce((sum, week) => sum + week.expense, 0);
  const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
  return (
    <div className="flow-chart">
      <div className="flow-totals balance-flow">
        <div>
          <span>
            <i className="income-dot" />
            Pemasukan
          </span>
          <strong>{money(income, hide)}</strong>
        </div>
        <div>
          <span>
            <i className="expense-dot" />
            Pengeluaran
          </span>
          <strong>{money(expense, hide)}</strong>
        </div>
      </div>
      {hide ? (
        <div className="chart-private">
          <Icon name="eyeOff" />
          <span>Grafik disembunyikan bersama saldo</span>
        </div>
      ) : income === 0 && expense === 0 ? (
        <div className="chart-private">
          <Icon name="transfer" />
          <span>Belum ada pemasukan atau pengeluaran selesai bulan ini.</span>
        </div>
      ) : (
        <figure aria-label="Arus uang per minggu">
          <svg viewBox="0 0 600 230" aria-hidden="true" focusable="false">
            {[0, 1, 2, 3].map((tick) => {
              const y = 186 - tick * 54;
              return (
                <g key={tick}>
                  <line x1="62" x2="584" y1={y} y2={y} className="chart-grid" />
                  <text x="0" y={y + 4} className="chart-label">
                    Rp {compact.format((ceiling * tick) / 3)}
                  </text>
                </g>
              );
            })}
            {(['income', 'expense'] as const).map((type) => (
              <polyline
                key={type}
                points={weeks
                  .map(
                    (week, index) =>
                      `${62 + (index + 0.5) * (522 / weeks.length)},${186 - (week[type] / ceiling) * 162}`,
                  )
                  .join(' ')}
                className={`chart-line chart-${type}`}
              />
            ))}
            {weeks.map((week, index) => {
              const x = 62 + (index + 0.5) * (522 / weeks.length);
              return (
                <g key={week.label}>
                  <title>
                    {week.label}: pemasukan {money(week.income)}, pengeluaran {money(week.expense)}
                  </title>
                  <circle
                    cx={x}
                    cy={186 - (week.income / ceiling) * 162}
                    r="3"
                    className="chart-income"
                  />
                  <circle
                    cx={x}
                    cy={186 - (week.expense / ceiling) * 162}
                    r="3"
                    className="chart-expense"
                  />
                  <text x={x} y="215" textAnchor="middle" className="chart-label">
                    {week.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <figcaption className="chart-caption">
            Tanggal dalam bulan ini · Transaksi selesai, WIB
          </figcaption>
          <table className="sr-only">
            <caption>Rincian arus uang mingguan</caption>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Pemasukan</th>
                <th>Pengeluaran</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.label}>
                  <th>{week.label}</th>
                  <td>{money(week.income)}</td>
                  <td>{money(week.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
      <div className="flow-net">
        <span>Selisih arus uang</span>
        <strong>{money(income - expense, hide)}</strong>
      </div>
    </div>
  );
}
