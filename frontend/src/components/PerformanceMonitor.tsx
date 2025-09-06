
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface PerformanceMetrics {
  networkUsage: number;
  loadTime: number;
  queryCount: number;
  memoryUsage: number;
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    networkUsage: 0,
    loadTime: 0,
    queryCount: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    let networkSize = 0;
    let queryCount = 0;

    // Monitor network requests
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('client') || entry.name.includes('api')) {
          networkSize += (entry as any).transferSize || 0;
          queryCount++;
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    // Monitor memory usage
    const updateMetrics = () => {
      const memory = (performance as any).memory;
      const loadTime = performance.now() - startTime;

      setMetrics({
        networkUsage: Math.round(networkSize / 1024), // KB
        loadTime: Math.round(loadTime),
        queryCount,
        memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0 // MB
      });
    };

    const interval = setInterval(updateMetrics, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const getNetworkBadgeColor = (size: number) => {
    if (size < 100) return 'bg-green-100 text-green-800';
    if (size < 500) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getLoadTimeBadgeColor = (time: number) => {
    if (time < 2000) return 'bg-green-100 text-green-800';
    if (time < 5000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="fixed bottom-4 right-4 w-64 z-50 bg-white/95 backdrop-blur">
      <CardContent className="p-3">
        <div className="text-xs font-medium text-gray-600 mb-2">Performance Monitor</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Network:</span>
            <Badge className={`text-xs ${getNetworkBadgeColor(metrics.networkUsage)}`}>
              {metrics.networkUsage}KB
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Load Time:</span>
            <Badge className={`text-xs ${getLoadTimeBadgeColor(metrics.loadTime)}`}>
              {metrics.loadTime}ms
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Queries:</span>
            <Badge className="text-xs bg-blue-100 text-blue-800">
              {metrics.queryCount}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Memory:</span>
            <Badge className="text-xs bg-purple-100 text-purple-800">
              {metrics.memoryUsage}MB
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
