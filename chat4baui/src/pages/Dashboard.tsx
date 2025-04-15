
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MoreVertical, 
  LayoutGrid, 
  List, 
  Filter, 
  RefreshCw, 
  Download, 
  Maximize2, 
  X,
  BarChart3, 
  PieChart, 
  LineChart,
  Table as TableIcon,
  GaugeCircle
} from 'lucide-react';
import { DummyBarChart, DummyLineChart, DummyPieChart } from '@/components/charts/DummyCharts';
import { ScrollArea } from '@/components/ui/scroll-area';

const Dashboard = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Example widgets data
  const widgets = [
    { 
      id: 1, 
      title: 'Monthly Sales Trends', 
      type: 'line-chart', 
      source: 'Sales Database',
      lastUpdated: '10 minutes ago',
      size: 'lg'
    },
    { 
      id: 2, 
      title: 'Revenue by Region', 
      type: 'pie-chart', 
      source: 'Sales Database',
      lastUpdated: '10 minutes ago',
      size: 'md'
    },
    { 
      id: 3, 
      title: 'Top Selling Products', 
      type: 'bar-chart', 
      source: 'Product Catalog',
      lastUpdated: '1 hour ago',
      size: 'md'
    },
    { 
      id: 4, 
      title: 'Customer Satisfaction', 
      type: 'gauge', 
      source: 'Survey Results',
      lastUpdated: '2 hours ago',
      size: 'sm'
    },
    { 
      id: 5, 
      title: 'Recent Orders', 
      type: 'table', 
      source: 'Orders Database',
      lastUpdated: '5 minutes ago',
      size: 'lg'
    },
    { 
      id: 6, 
      title: 'Inventory Status', 
      type: 'bar-chart', 
      source: 'Inventory Database',
      lastUpdated: '30 minutes ago',
      size: 'md' 
    }
  ];
  
  // Example dashboards
  const dashboards = [
    { id: 1, name: 'Sales Overview', isActive: true },
    { id: 2, name: 'Marketing Performance', isActive: false },
    { id: 3, name: 'Operations', isActive: false },
    { id: 4, name: 'Executive Summary', isActive: false }
  ];
  
  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor your key metrics and insights</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Widget
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Bar Chart
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LineChart className="mr-2 h-4 w-4" />
                  Line Chart
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PieChart className="mr-2 h-4 w-4" />
                  Pie Chart
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TableIcon className="mr-2 h-4 w-4" />
                  Data Table
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <GaugeCircle className="mr-2 h-4 w-4" />
                  Gauge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center border rounded-md">
              <Button 
                variant="ghost" 
                className={`h-9 px-2.5 rounded-none ${view === 'grid' ? 'bg-muted' : ''}`}
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                className={`h-9 px-2.5 rounded-none ${view === 'list' ? 'bg-muted' : ''}`}
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <Tabs defaultValue="sales-overview" className="w-full md:w-auto space-y-0">
            <TabsList className="overflow-auto">
              {dashboards.map(dashboard => (
                <TabsTrigger 
                  key={dashboard.id} 
                  value={dashboard.name.toLowerCase().replace(/\s+/g, '-')}
                  className="whitespace-nowrap"
                >
                  {dashboard.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-1.5 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <Card key={widget.id} className="overflow-hidden">
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-medium">{widget.title}</CardTitle>
                    <CardDescription>{widget.source}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Expand
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6 h-64">
                    {widget.type === 'bar-chart' && <DummyBarChart />}
                    {widget.type === 'line-chart' && <DummyLineChart />}
                    {widget.type === 'pie-chart' && <DummyPieChart />}
                    {widget.type === 'gauge' && (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-40 h-40 relative">
                          <GaugeCircle className="w-full h-full text-chat4ba-200" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="text-4xl font-bold text-chat4ba-700">82%</div>
                            <div className="text-xs text-muted-foreground mt-1">Satisfaction</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {widget.type === 'table' && (
                      <ScrollArea className="h-full">
                        <div className="w-full">
                          <div className="grid grid-cols-4 gap-2 pb-2 font-medium text-sm">
                            <div>Order #</div>
                            <div>Customer</div>
                            <div>Status</div>
                            <div className="text-right">Amount</div>
                          </div>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="grid grid-cols-4 gap-2 py-2 border-t text-sm">
                              <div>ORD-{1000 + idx}</div>
                              <div>Customer {idx + 1}</div>
                              <div>{idx % 3 === 0 ? 'Shipped' : idx % 3 === 1 ? 'Delivered' : 'Processing'}</div>
                              <div className="text-right">${(Math.random() * 1000).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* List View */}
        {view === 'list' && (
          <Card>
            <CardHeader className="px-6">
              <CardTitle>Dashboard Widgets</CardTitle>
              <CardDescription>
                All widgets currently on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left h-10 px-6 text-xs font-medium text-muted-foreground">Widget</th>
                      <th className="text-left h-10 px-6 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-left h-10 px-6 text-xs font-medium text-muted-foreground">Data Source</th>
                      <th className="text-left h-10 px-6 text-xs font-medium text-muted-foreground">Last Updated</th>
                      <th className="text-right h-10 px-6 text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {widgets.map((widget) => (
                      <tr key={widget.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-3 font-medium">{widget.title}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center">
                            {widget.type === 'bar-chart' && <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />}
                            {widget.type === 'line-chart' && <LineChart className="h-4 w-4 mr-2 text-green-500" />}
                            {widget.type === 'pie-chart' && <PieChart className="h-4 w-4 mr-2 text-purple-500" />}
                            {widget.type === 'gauge' && <GaugeCircle className="h-4 w-4 mr-2 text-orange-500" />}
                            {widget.type === 'table' && <TableIcon className="h-4 w-4 mr-2 text-slate-500" />}
                            {widget.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </div>
                        </td>
                        <td className="px-6 py-3">{widget.source}</td>
                        <td className="px-6 py-3 text-muted-foreground">{widget.lastUpdated}</td>
                        <td className="px-6 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Widget</DropdownMenuItem>
                              <DropdownMenuItem>Refresh Data</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
