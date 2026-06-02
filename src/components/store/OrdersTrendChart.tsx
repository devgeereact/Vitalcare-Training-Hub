import type { JSX } from "react"
import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

interface Props {
  labels: string[]
  /** Orders placed per month. */
  orders: number[]
  /** Collected revenue per month, in pence. */
  revenuePence: number[]
}

/**
 * Orders (gold bars) against collected revenue (navy line) over six months.
 * Real data only: revenue is the sum of paid orders in each month.
 */
export default function OrdersTrendChart({
  labels,
  orders,
  revenuePence,
}: Props): JSX.Element {
  const revenuePounds = revenuePence.map((p) => p / 100)

  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      fontFamily: '"DM Sans", sans-serif',
      animations: { speed: 400 },
    },
    stroke: { width: [0, 3], curve: "smooth" },
    colors: ["#d4a843", "#1b2e6b"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#64748b" },
      markers: { strokeWidth: 0 },
    },
    grid: { borderColor: "rgba(100,116,139,0.15)", strokeDashArray: 4 },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b" } },
    },
    yaxis: [
      {
        seriesName: "Orders",
        axisTicks: { show: false },
        axisBorder: { show: false },
        labels: {
          style: { colors: "#64748b" },
          formatter: (v) => `${Math.round(v)}`,
        },
        title: { text: "Orders", style: { color: "#64748b", fontWeight: 500 } },
      },
      {
        seriesName: "Collected",
        opposite: true,
        axisTicks: { show: false },
        axisBorder: { show: false },
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
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (v, opts) =>
          opts?.seriesIndex === 1
            ? new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: "GBP",
                minimumFractionDigits: 2,
              }).format(v)
            : `${Math.round(v)}`,
      },
    },
  }

  return (
    <Chart
      options={options}
      series={[
        { name: "Orders", type: "column", data: orders },
        { name: "Collected", type: "line", data: revenuePounds },
      ]}
      type="line"
      height={280}
    />
  )
}
