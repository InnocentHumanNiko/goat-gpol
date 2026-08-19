import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const stats = [
  {
    label: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    trendLabel: "vs. last month",
  },
  {
    label: "Active Users",
    value: "2,350",
    change: "+180",
    trend: "up",
    trendLabel: "vs. last month",
  },
  {
    label: "New Signups",
    value: "1,204",
    change: "-12.4%",
    trend: "down",
    trendLabel: "vs. last month",
  },
  {
    label: "Avg. Response",
    value: "48ms",
    change: "+0.9%",
    trend: "down",
    trendLabel: "vs. last month",
  },
]

const recentActivity = [
  { action: "Deployed goat-gpol to production", actor: "Jane Doe", time: "2 minutes ago" },
  { action: "Invited 3 new team members", actor: "John Smith", time: "1 hour ago" },
  { action: "Updated the onboarding flow", actor: "Alice Brown", time: "3 hours ago" },
  { action: "Resolved 12 support tickets", actor: "Jane Doe", time: "5 hours ago" },
  { action: "Published new release v0.2.0", actor: "Bob Wilson", time: "1 day ago" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, here&apos;s what&apos;s happening with your workspace today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-sm">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    stat.trend === "up"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {stat.trend === "up" ? (
                    <IconTrendingUp className="size-3.5" />
                  ) : (
                    <IconTrendingDown className="size-3.5" />
                  )}
                  {stat.change}
                </span>
                <span className="text-muted-foreground">{stat.trendLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Revenue performance over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              Chart placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events from your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {recentActivity.map((item, index) => (
                <li
                  key={item.time}
                  className={cn(
                    "flex flex-col gap-0.5 py-3",
                    index !== recentActivity.length - 1 && "border-b"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{item.action}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {item.time}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.actor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}