import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type Props = {
  ok: number;
  soon: number;
  expired: number;
  shoppingOpen: number;
  openTasks: number;
};

const COLORS = {
  ok: "#12b76a",
  soon: "#f79009",
  expired: "#f04438",
  shopping: "#3b6ef5",
  chores: "#ff6b9d",
};

/** Bright AdminUX-style Chart.js overview for household stock + workload. */
export function HouseholdOverviewChart({
  ok,
  soon,
  expired,
  shoppingOpen,
  openTasks,
}: Props) {
  const doughnutData = {
    labels: ["Fresh", "Expiring soon", "Expired"],
    datasets: [
      {
        data: [ok, soon, expired],
        backgroundColor: [COLORS.ok, COLORS.soon, COLORS.expired],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const barData = {
    labels: ["Shopping", "Chores", "Fresh stock", "Expiring"],
    datasets: [
      {
        label: "Count",
        data: [shoppingOpen, openTasks, ok, soon],
        backgroundColor: [COLORS.shopping, COLORS.chores, COLORS.ok, COLORS.soon],
        borderRadius: 10,
        maxBarThickness: 36,
      },
    ],
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="aux-card bg-gradient-1">
        <div className="aux-card-header">
          <h3 className="text-base">Inventory health</h3>
        </div>
        <div className="aux-card-body mx-auto max-w-[220px]">
          <Doughnut
            data={doughnutData}
            options={{
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { boxWidth: 10, font: { size: 11, weight: "bold" } },
                },
              },
              cutout: "62%",
            }}
          />
        </div>
      </div>
      <div className="aux-card bg-gradient-4">
        <div className="aux-card-header">
          <h3 className="text-base">Household pulse</h3>
        </div>
        <div className="aux-card-body min-h-[220px]">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { font: { size: 11, weight: "bold" } },
                },
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0, font: { size: 11 } },
                  grid: { color: "rgba(59, 110, 245, 0.08)" },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
