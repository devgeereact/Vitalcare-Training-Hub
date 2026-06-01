import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

interface Props {
  categories: string[]
  data: number[]
}

/** Course-completion trend (last 6 months). Navy area, gold fill. */
export default function CompletionTrendChart({ categories, data }: Props) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: '"DM Sans", sans-serif',
      animations: { speed: 400 },
    },
    colors: ["#1b2e6b"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90] },
    },
    grid: { borderColor: "rgba(100,116,139,0.15)", strokeDashArray: 4 },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#64748b" } },
    },
    yaxis: {
      labels: { style: { colors: "#64748b" }, formatter: (v) => `${Math.round(v)}` },
    },
    tooltip: { y: { formatter: (v) => `${v} completions` } },
  }

  return (
    <Chart
      options={options}
      series={[{ name: "Completions", data }]}
      type="area"
      height={280}
    />
  )
}
