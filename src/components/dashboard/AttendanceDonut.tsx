import Chart from "react-apexcharts"
import type { ApexOptions } from "apexcharts"

interface Props {
  labels: string[]
  series: number[]
}

/** Attendance breakdown donut. Present/Late/Excused/Absent. */
export default function AttendanceDonut({ labels, series }: Props) {
  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: '"DM Sans", sans-serif' },
    labels,
    // Present (emerald), Late (amber/gold), Excused (navy), Absent (red)
    colors: ["#16a34a", "#d4a843", "#1b2e6b", "#dc2626"],
    legend: { position: "bottom", labels: { colors: "#64748b" } },
    dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Records",
              color: "#64748b",
              formatter: (w) =>
                `${w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)}`,
            },
          },
        },
      },
    },
  }

  return <Chart options={options} series={series} type="donut" height={280} />
}
