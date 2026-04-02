import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, History, MessageSquare, QrCode, Search } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface ScanLogEntry {
  id: string;
  mega_id: string | null;
  child_id: string | null;
  location: string | null;
  device: string | null;
  created_at: string;
}

interface CommitLogEntry {
  id: string;
  mega_id: string | null;
  child_id: string | null;
  message: string;
  location: string | null;
  created_at: string;
}

interface RetailerHistoryTableProps {
  scanLogs: ScanLogEntry[];
  commitLogs: CommitLogEntry[];
  isLoading?: boolean;
}

export function RetailerHistoryTable({
  scanLogs,
  commitLogs,
  isLoading,
}: RetailerHistoryTableProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchHash, setSearchHash] = useState('');
  const [tab, setTab] = useState<'scans' | 'commits'>('scans');

  const filteredScans = useMemo(() => {
    return scanLogs.filter(log => {
      // Date filter
      if (dateRange?.from && dateRange?.to) {
        const logDate = new Date(log.created_at);
        if (!isWithinInterval(logDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        })) {
          return false;
        }
      }
      // Hash/ID filter
      if (searchHash) {
        const search = searchHash.toLowerCase();
        return (
          log.mega_id?.toLowerCase().includes(search) ||
          log.child_id?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [scanLogs, dateRange, searchHash]);

  const filteredCommits = useMemo(() => {
    return commitLogs.filter(log => {
      if (dateRange?.from && dateRange?.to) {
        const logDate = new Date(log.created_at);
        if (!isWithinInterval(logDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        })) {
          return false;
        }
      }
      if (searchHash) {
        const search = searchHash.toLowerCase();
        return (
          log.mega_id?.toLowerCase().includes(search) ||
          log.child_id?.toLowerCase().includes(search) ||
          log.message.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [commitLogs, dateRange, searchHash]);

  const stats = {
    totalScans: filteredScans.length,
    totalCommits: filteredCommits.length,
    uniqueProducts: new Set([
      ...filteredScans.map(s => s.mega_id || s.child_id),
      ...filteredCommits.map(c => c.mega_id || c.child_id),
    ]).size,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Activity History
        </CardTitle>
        <CardDescription>
          View your scan and commit history with date filters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or hash..."
              value={searchHash}
              onChange={e => setSearchHash(e.target.value)}
              className="pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {(dateRange || searchHash) && (
            <Button
              variant="ghost"
              onClick={() => {
                setDateRange(undefined);
                setSearchHash('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <div className="text-xs text-muted-foreground">Scans</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalCommits}</div>
            <div className="text-xs text-muted-foreground">Commits</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
            <div className="text-xs text-muted-foreground">Products</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={v => setTab(v as 'scans' | 'commits')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scans" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scans ({filteredScans.length})
            </TabsTrigger>
            <TabsTrigger value="commits" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Commits ({filteredCommits.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scans" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No scans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredScans.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {log.mega_id || log.child_id}
                        </TableCell>
                        <TableCell>{log.location || '-'}</TableCell>
                        <TableCell>{log.device || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="commits" className="mt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No commits found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommits.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {log.mega_id || log.child_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.message}</Badge>
                        </TableCell>
                        <TableCell>{log.location || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
