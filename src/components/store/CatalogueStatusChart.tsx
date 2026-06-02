import type { JSX } from "react"
import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

interface Props {
  published: number
  draft: number
}

/**
 * Fallback chart shown when no orders exist yet: an honest split of the
 * catalogue by publish status. Navy (published) and gold (draft).
 */
export default function CatalogueStatusChart({
  published,
  draft,
}: Props): JSX.Element {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: '"DM Sans", sans-serif',
      animations: { speed: 400 },
    },
    labels: ["Published", "Draft"],
    colors: ["#1b2e6b", "#d4a843"],
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      labels: { colors: "#64748b" },
      markers: { strokeWidth: 0 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Products",
              color: "#64748b",
              fontSize: "13px",
              formatter: () => `${published + draft}`,
            },
            value: { color: "#0f172a", fontSize: "26px", fontFamily: '"DM Serif Display", serif' },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v) => `${v} products` } },
  }

  return (
    <Chart
      options={options}
      series={[published, draft]}
      type="donut"
      height={280}
    />
  )
}
