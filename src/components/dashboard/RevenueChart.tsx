import type { JSX } from "react"
import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

interface Props {
  /** Whole pounds. */
  billed: number
  paid: number
  outstanding: number
}

/** Billed vs paid vs outstanding, in pounds. Navy/gold/slate bars. */
export default function RevenueChart({
  billed,
  paid,
  outstanding,
}: Props): JSX.Element {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: '"DM Sans", sans-serif',
      animations: { speed: 400 },
    },
    colors: ["#1b2e6b", "#16a34a", "#d4a843"],
    plotOptions: {
      bar: { distributed: true, borderRadius: 6, columnWidth: "55%" },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: "rgba(100,116,139,0.15)", strokeDashArray: 4 },
    xaxis: {
      categories: ["Billed", "Collected", "Outstanding"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#64748b" },
        formatter: (v) =>
          new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0,
          }).format(v),
      },
    },
    tooltip: {
      y: {
        formatter: (v) =>
          new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            minimumFractionDigits: 2,
          }).format(v),
      },
    },
  }

  return (
    <Chart
      options={options}
      series={[{ name: "Amount", data: [billed, paid, outstanding] }]}
      type="bar"
      height={260}
    />
  )
}
