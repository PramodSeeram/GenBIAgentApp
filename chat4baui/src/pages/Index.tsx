
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, PieChart, LineChart, TrendingUp, Database, BrainCircuit, Calendar, BriefcaseBusiness } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TrendingUpIcon, TrendingDownIcon, MessageSquareIcon, ActivityIcon } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Index = () => {
  // Sample recent activities data
  const recentActivities = [
    { id: 1, action: "Queried sales data", time: "10 minutes ago" },
    { id: 2, action: "Created dashboard widget", time: "1 hour ago" },
    { id: 3, action: "Uploaded CSV file", time: "2 hours ago" },
    { id: 4, action: "Connected to MySQL database", time: "Yesterday" }
  ];

  // Future prediction data
  const predictionData = [
    { period: "Next Month", metric: "Sales", prediction: "$124,500", trend: "up", change: "+12%" },
    { period: "Next Quarter", metric: "Revenue", prediction: "$385,000", trend: "up", change: "+8%" },
    { period: "Next Year", metric: "Customer Growth", prediction: "2,450", trend: "up", change: "+15%" }
  ];

  return (
    <Layout>
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">Here's an overview of your analytics and recent activities.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2 items-center">
            <ThemeToggle />
            <Button asChild>
              <Link to="/data-sources">Connect New Data Source</Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link to="/modeling">
                <Database size={18} />
                <span>Modeling</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link to="/settings">
                <BriefcaseBusiness size={18} />
                <span>Settings</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Queries" 
            value="1,284" 
            description="+12% from last month" 
            trend="up"
            icon={<LineChart className="h-6 w-6 text-chat4ba-600" />}
          />
          <StatsCard 
            title="Data Sources" 
            value="9" 
            description="+2 new connections" 
            trend="up"
            icon={<BarChart3 className="h-6 w-6 text-chat4ba-600" />}
          />
          <StatsCard 
            title="Dashboard Widgets" 
            value="32" 
            description="+8 in the last week" 
            trend="up"
            icon={<PieChart className="h-6 w-6 text-chat4ba-600" />}
          />
          <StatsCard 
            title="Insights Generated" 
            value="156" 
            description="+24% improvement" 
            trend="up"
            icon={<TrendingUp className="h-6 w-6 text-chat4ba-600" />}
          />
        </div>

        {/* Future Predictions Section */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Future Predictions</CardTitle>
                <CardDescription>AI-powered forecasts based on your historical data</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Change Timeframe</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {predictionData.map((item, idx) => (
                <Card key={idx} className={cn(
                  "transition-all duration-300 hover:shadow-md",
                  "bg-gradient-to-br from-card to-secondary/80 backdrop-blur-sm"
                )}>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{item.period}</div>
                    <div className="text-lg font-semibold">{item.metric}</div>
                    <div className="text-3xl font-bold mt-2">{item.prediction}</div>
                    <div className={cn(
                      "text-xs mt-2 flex items-center",
                      item.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                    )}>
                      {item.trend === 'up' && <TrendingUpIcon className="h-3 w-3 mr-1" />}
                      {item.trend === 'down' && <TrendingDownIcon className="h-3 w-3 mr-1" />}
                      {item.change}
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full mt-4 overflow-hidden">
                      <div className={cn(
                        "h-full rounded-full",
                        item.trend === 'up' ? 'bg-emerald-600' : 'bg-rose-600'
                      )} style={{ width: `${parseInt(item.change)}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Queries</CardTitle>
              <CardDescription>Try asking these questions to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Show me monthly sales trends for the last quarter",
                  "Compare performance across different product categories",
                  "What are the top 10 customers by revenue?",
                  "Analyze customer satisfaction scores by region"
                ].map((query, idx) => (
                  <li key={idx}>
                    <Button variant="outline" className="w-full justify-start text-left h-auto py-2" asChild>
                      <Link to={`/chat?query=${encodeURIComponent(query)}`}>
                        <MessageSquareIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{query}</span>
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest interactions with Chat4BA</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <ActivityIcon className="h-4 w-4 text-chat4ba-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, trend, icon }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm font-medium">{title}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className={cn(
          "text-xs mt-1 flex items-center",
          trend === 'up' ? 'text-emerald-600' : 
          trend === 'down' ? 'text-rose-600' : 'text-gray-500'
        )}>
          {trend === 'up' && <TrendingUpIcon className="h-3 w-3 mr-1" />}
          {trend === 'down' && <TrendingDownIcon className="h-3 w-3 mr-1" />}
          {description}
        </div>
      </CardContent>
    </Card>
  );
};

export default Index;
