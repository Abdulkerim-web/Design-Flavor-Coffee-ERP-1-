/* Responsive: mobile ≤640 | tablet 641–1024 | laptop 1025–1440 | desktop >1440 */
import { useState, useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useAuth } from '../contexts/AuthContext'
import { can } from '../lib/can'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, ComposedChart
} from 'recharts'

/* ── Types ─────────────────────────────────────────────── */
type ReportId = string
type ExportFmt = 'pdf' | 'xlsx' | 'csv'
type OriginKey = 'guji' | 'yirgacheffe' | 'harrar' | 'sidama' | 'limu'
type RoastKey  = 'light' | 'medium' | 'dark'

interface ReportTemplate {
  id: ReportId
  category: string
  title: string
  description: string
  icon: string
  tags: string[]
  chartType: 'area' | 'bar' | 'line' | 'composed'
  estimatedRows: number
}

/* ── Report Templates ──────────────────────────────────── */
const TEMPLATES: ReportTemplate[] = [
  {
    id: 'yield-variance',
    category: 'Production',
    title: 'Yield & Weight Loss Variance',
    description: 'Tracks green bean shrinkage across origins and roast profiles with tolerance band overlay.',
    icon: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z',
    tags: ['Shrinkage', 'Yield %', 'BR-PRD-004'],
    chartType: 'area',
    estimatedRows: 248,
  },
  {
    id: 'roaster-efficiency',
    category: 'Production',
    title: 'Roaster Efficiency & Batch Output',
    description: 'Compares roaster utilization, batch throughput and output weight per roasting session.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    tags: ['Utilization', 'Throughput', 'KG Output'],
    chartType: 'bar',
    estimatedRows: 84,
  },
  {
    id: 'stock-movement',
    category: 'Inventory',
    title: 'Green Coffee Stock Movement',
    description: 'Full stock valuation ledger: receipts, QC deductions, production draws and closing balance.',
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
    tags: ['Stock Value', 'Receipts', 'ETB'],
    chartType: 'composed',
    estimatedRows: 512,
  },
  {
    id: 'packaging-depletion',
    category: 'Inventory',
    title: 'Packaging Depletion & Reorder Horizon',
    description: 'Forecasts packaging material runout dates at current consumption rate, with reorder trigger line.',
    icon: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8',
    tags: ['Days Remaining', 'Reorder Point', 'SKUs'],
    chartType: 'bar',
    estimatedRows: 36,
  },
  {
    id: 'gross-profit-per-batch',
    category: 'Financial',
    title: 'Gross Profit Margin Per Batch',
    description: 'Revenue attribution per roasted batch: COGS, contribution margin and profitability ranking.',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    tags: ['Margin %', 'Contribution', 'ETB'],
    chartType: 'composed',
    estimatedRows: 130,
  },
  {
    id: 'monthly-revenue',
    category: 'Financial',
    title: 'Monthly Revenue & Expense Statement',
    description: 'P&L summary: gross revenue, COGS, OPEX, net profit and YoY comparison.',
    icon: 'M18 20V10M12 20V4M6 20v-6',
    tags: ['P&L', 'YoY', 'MoR Export'],
    chartType: 'bar',
    estimatedRows: 72,
  },
  {
    id: 'supplier-defect',
    category: 'Quality & Logistics',
    title: 'Supplier Rejection & Defect Frequency',
    description: 'QC rejection rates by supplier lot, defect category breakdown and cost-of-poor-quality impact.',
    icon: 'M14 2v6l3 5c1.5 2.6-.3 5-2.7 5H9.7C7.3 18 5.5 15.6 7 13l3-5V2M6 2h12',
    tags: ['Rejection Rate', 'COPQ', 'Suppliers'],
    chartType: 'bar',
    estimatedRows: 194,
  },
  {
    id: 'delivery-fulfillment',
    category: 'Quality & Logistics',
    title: 'On-Time Delivery Fulfillment Rate',
    description: 'Delivery performance by driver and route, SLA breach count and customer satisfaction proxy.',
    icon: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    tags: ['OTD %', 'SLA', 'Drivers'],
    chartType: 'line',
    estimatedRows: 88,
  },
]

/* ── Chart data ────────────────────────────────────────── */
const YIELD_DATA = [
  { month: 'Mar', guji: 84.2, yirgacheffe: 86.1, harrar: 82.5, target: 85 },
  { month: 'Apr', guji: 85.8, yirgacheffe: 87.3, harrar: 83.1, target: 85 },
  { month: 'May', guji: 83.4, yirgacheffe: 85.9, harrar: 84.2, target: 85 },
  { month: 'Jun', guji: 86.7, yirgacheffe: 88.0, harrar: 81.8, target: 85 },
  { month: 'Jul', guji: 85.1, yirgacheffe: 86.5, harrar: 83.7, target: 85 },
  { month: 'Aug', guji: 87.2, yirgacheffe: 89.1, harrar: 84.9, target: 85 },
]
const ROASTER_DATA = [
  { name: 'R-01 Probat',  batches: 18, output: 486, util: 72 },
  { name: 'R-02 Loring',  batches: 14, output: 378, util: 68 },
  { name: 'R-03 Diedrich',batches: 11, output: 297, util: 55 },
]
const STOCK_DATA = [
  { month: 'Mar', received: 4800, consumed: 4120, closing: 3200 },
  { month: 'Apr', received: 5200, consumed: 4440, closing: 3960 },
  { month: 'May', received: 3800, consumed: 3990, closing: 3770 },
  { month: 'Jun', received: 6100, consumed: 4210, closing: 5660 },
  { month: 'Jul', received: 4400, consumed: 4630, closing: 5430 },
  { month: 'Aug', received: 5500, consumed: 4780, closing: 6150 },
]
const PKG_DATA = [
  { sku: '250g Bag', days: 36 },
  { sku: '500g Bag', days: 34 },
  { sku: '1KG Bag',  days: 24 },
  { sku: '2KG Bag',  days: 21 },
]
const BATCH_MARGIN_DATA = [
  { batch: 'BAT-0291', revenue: 45000, cogs: 19350, margin: 57.0 },
  { batch: 'BAT-0290', revenue: 38000, cogs: 17480, margin: 54.0 },
  { batch: 'BAT-0289', revenue: 52000, cogs: 21320, margin: 59.0 },
  { batch: 'BAT-0288', revenue: 41000, cogs: 18450, margin: 55.0 },
  { batch: 'BAT-0287', revenue: 48000, cogs: 19680, margin: 59.0 },
]
const MONTHLY_PL_DATA = [
  { month: 'Mar', revenue: 980000,  cogs: 441000,  opex: 186200, profit: 352800 },
  { month: 'Apr', revenue: 1050000, cogs: 472500,  opex: 199500, profit: 378000 },
  { month: 'May', revenue: 1120000, cogs: 504000,  opex: 212800, profit: 403200 },
  { month: 'Jun', revenue: 1180000, cogs: 531000,  opex: 224200, profit: 424800 },
  { month: 'Jul', revenue: 1227000, cogs: 552150,  opex: 233130, profit: 441720 },
  { month: 'Aug', revenue: 1450000, cogs: 652500,  opex: 275500, profit: 522000 },
]
const DEFECT_DATA = [
  { supplier: 'Kayon Mtn', rejections: 3, moisture: 2, density: 1 },
  { supplier: 'Duromina',  rejections: 1, moisture: 1, density: 0 },
  { supplier: 'Yirgalem',  rejections: 5, moisture: 3, density: 2 },
  { supplier: 'Hunde Oli', rejections: 2, moisture: 1, density: 1 },
]
const DELIVERY_DATA = [
  { week: 'W28', otd: 91.2 },
  { week: 'W29', otd: 94.8 },
  { week: 'W30', otd: 88.5 },
  { week: 'W31', otd: 96.3 },
  { week: 'W32', otd: 92.1 },
]

const TT = { background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono' }

/* ── Chart switcher ────────────────────────────────────── */
function ReportChart({ id }: { id: ReportId }) {
  switch (id) {
    case 'yield-variance':
      return (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={YIELD_DATA} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {([['guji','#2B4D3A'],['yirgacheffe','#1D4ED8'],['harrar','#B45309']] as [string,string][]).map(([k,c]) => (
                <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.18}/>
                  <stop offset="95%" stopColor={c} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis domain={[78, 92]} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`]} />
            <ReferenceLine y={85} stroke="#9CA3AF" strokeDasharray="5 3" label={{ value: 'Target 85%', fill: '#9CA3AF', fontSize: 10, fontFamily: 'DM Mono', position: 'insideTopRight' }} />
            <ReferenceLine y={80} stroke="#FCA5A5" strokeDasharray="3 3" />
            <ReferenceLine y={90} stroke="#86EFAC" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="guji"        name="Guji"        stroke="#2B4D3A" strokeWidth={2} fill="url(#g-guji)"        dot={{ r: 3, fill: '#2B4D3A', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="yirgacheffe" name="Yirgacheffe" stroke="#1D4ED8" strokeWidth={2} fill="url(#g-yirgacheffe)" dot={{ r: 3, fill: '#1D4ED8', strokeWidth: 0 }} />
            <Area type="monotone" dataKey="harrar"      name="Harrar"      stroke="#B45309" strokeWidth={2} fill="url(#g-harrar)"      dot={{ r: 3, fill: '#B45309', strokeWidth: 0 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
          </AreaChart>
        </ResponsiveContainer>
      )
    case 'roaster-efficiency':
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ROASTER_DATA} barGap={3} barSize={20} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="output"  name="Output KG" fill="#2B4D3A" radius={[4,4,0,0]} />
            <Bar dataKey="batches" name="Batches"    fill="#4A7C5A" radius={[4,4,0,0]} />
            <Bar dataKey="util"    name="Util %"     fill="#A7C4B5" radius={[4,4,0,0]} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'stock-movement':
      return (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={STOCK_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}t`} />
            <Tooltip contentStyle={TT} formatter={(v: number) => `${v.toLocaleString()} KG`} />
            <Bar dataKey="received" name="Received KG" fill="#2B4D3A" radius={[3,3,0,0]} barSize={14} />
            <Bar dataKey="consumed" name="Consumed KG" fill="#B8860B" radius={[3,3,0,0]} barSize={14} />
            <Line type="monotone" dataKey="closing" name="Closing Stock" stroke="#DC2626" strokeWidth={2} dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    case 'packaging-depletion':
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={PKG_DATA} layout="vertical" barSize={20} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} domain={[0, 42]} tickFormatter={(v: number) => `${v}d`} />
            <YAxis type="category" dataKey="sku" tick={{ fill: '#374151', fontSize: 12, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={TT} formatter={(v: number) => `${v} days remaining`} />
            <ReferenceLine x={14} stroke="#DC2626" strokeDasharray="4 3" label={{ value: 'Reorder!', fill: '#DC2626', fontSize: 9, fontFamily: 'DM Mono', position: 'top' }} />
            <Bar dataKey="days" name="Days Remaining" fill="#2B4D3A" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'gross-profit-per-batch':
      return (
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={BATCH_MARGIN_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="batch" tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" domain={[50, 65]} tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip contentStyle={TT} />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue ETB" fill="#2B4D3A" radius={[4,4,0,0]} barSize={18} />
            <Bar yAxisId="left" dataKey="cogs"    name="COGS ETB"    fill="#B8860B" radius={[4,4,0,0]} barSize={18} />
            <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin %" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4, fill: '#16A34A', strokeWidth: 0 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )
    case 'monthly-revenue':
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY_PL_DATA} barGap={2} barSize={12} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TT} formatter={(v: number) => `ETB ${v.toLocaleString()}`} />
            <Bar dataKey="revenue" name="Revenue"    fill="#2B4D3A" radius={[3,3,0,0]} />
            <Bar dataKey="cogs"    name="COGS"       fill="#B8860B" radius={[3,3,0,0]} />
            <Bar dataKey="opex"    name="OPEX"       fill="#6E4A32" radius={[3,3,0,0]} />
            <Bar dataKey="profit"  name="Net Profit" fill="#16A34A" radius={[3,3,0,0]} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'supplier-defect':
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DEFECT_DATA} barGap={3} barSize={16} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="supplier" tick={{ fill: '#9CA3AF', fontSize: 10.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT} />
            <Bar dataKey="rejections" name="Rejections" fill="#DC2626" radius={[4,4,0,0]} />
            <Bar dataKey="moisture"   name="Moisture"   fill="#F59E0B" radius={[4,4,0,0]} />
            <Bar dataKey="density"    name="Density"    fill="#B45309" radius={[4,4,0,0]} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'DM Mono', paddingTop: 8 }} />
          </BarChart>
        </ResponsiveContainer>
      )
    case 'delivery-fulfillment':
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={DELIVERY_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
            <YAxis domain={[82, 100]} tick={{ fill: '#9CA3AF', fontSize: 9.5, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`]} />
            <ReferenceLine y={95} stroke="#16A34A" strokeDasharray="5 3" label={{ value: 'SLA 95%', fill: '#16A34A', fontSize: 9.5, fontFamily: 'DM Mono', position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="otd" name="OTD %" stroke="#2B4D3A" strokeWidth={2.5} dot={{ r: 5, fill: '#2B4D3A', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    default:
      return <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Select a report to preview</div>
  }
}

/* ── Stat strip ────────────────────────────────────────── */
const STATS: Record<ReportId, { label: string; value: string; sub: string }[]> = {
  'yield-variance':        [{ label: 'Avg Yield',       value: '85.9%',      sub: 'Aug 2026' },       { label: 'Out-of-Spec',  value: '3 batches',  sub: 'this period' }, { label: 'Best Origin',  value: 'Yirgacheffe', sub: '89.1% avg' }],
  'roaster-efficiency':    [{ label: 'Total Output',    value: '1,161 KG',   sub: 'this month' },     { label: 'Best Roaster', value: 'R-01 Probat',sub: '72% util' },    { label: 'Avg Batch',    value: '27.6 KG',     sub: 'per cycle' }],
  'stock-movement':        [{ label: 'Closing Stock',   value: '6,150 KG',   sub: 'Aug 2026' },       { label: 'Received',     value: '5,500 KG',   sub: 'this month' },  { label: 'Consumed',     value: '4,780 KG',    sub: 'production' }],
  'packaging-depletion':   [{ label: 'Min Days Left',   value: '21 days',    sub: '2KG bag' },        { label: 'SKUs Below 25d',value: '2 SKUs',    sub: 'reorder urgent' },{ label: 'Total Units', value: '6,410',       sub: 'across all SKUs' }],
  'gross-profit-per-batch':[{ label: 'Avg Margin',      value: '56.8%',      sub: 'per batch' },      { label: 'Best Batch',   value: 'BAT-0289',   sub: '59.0% margin' },{ label: 'Total Revenue',value: '224K ETB',    sub: 'Aug batches' }],
  'monthly-revenue':       [{ label: 'Revenue Aug',     value: '1.45M ETB',  sub: '+18.2% MoM' },     { label: 'Net Profit',   value: '522K ETB',   sub: '57.2% margin' },{ label: 'OPEX',         value: '276K ETB',    sub: '+4.1% MoM' }],
  'supplier-defect':       [{ label: 'Total Rejections',value: '11 lots',    sub: 'Aug 2026' },       { label: 'Worst Supplier',value: 'Yirgalem',  sub: '5 rejections' },{ label: 'COPQ',         value: '156K ETB',    sub: 'total cost' }],
  'delivery-fulfillment':  [{ label: 'Avg OTD Rate',    value: '92.6%',      sub: 'Aug 2026' },       { label: 'SLA Breaches', value: '9 deliveries',sub: 'past 5 weeks' },{ label: 'Best Week',   value: 'W31',         sub: '96.3% OTD' }],
}

function StatStrip({ id }: { id: ReportId }) {
  const items = STATS[id] ?? []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
      {items.map(s => (
        <div key={s.label} style={{ padding: '12px 14px', background: 'var(--bg-primary)', border: '1px solid #F0EDE8', borderRadius: 9 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
          <div style={{ fontSize: 15, fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Checkbox button ───────────────────────────────────── */
function CheckBtn({ checked, color, label, onClick }: { checked: boolean; color: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7, border: `1.5px solid ${checked ? color + '40' : '#E5E3DC'}`, background: checked ? color + '08' : '#FAFAF8', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', width: '100%' }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${checked ? color : '#D1D5DB'}`, background: checked ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
        {checked && <svg width="8" height="8" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 500, color: checked ? color : '#6B7280' }}>{label}</span>
    </button>
  )
}

/* ── Report catalog card ───────────────────────────────── */
function CatalogCard({ t, onOpen }: { t: ReportTemplate; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '18px 20px', background: 'var(--surface-01)', border: `1.5px solid ${hovered ? '#2B4D3A40' : 'var(--border-neutral)'}`, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: hovered ? '0 4px 16px rgba(43,77,58,0.1)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: hovered ? '#2B4D3A' : '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={hovered ? '#FFFFFF' : '#6B7280'} strokeWidth="1.75">
            {t.icon.split('M').filter(Boolean).map((s, i) => <path key={i} d={`M${s}`} />)}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: '18px', marginBottom: 4 }}>{t.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '17px' }}>{t.description}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {t.tags.slice(0,2).map(tag => (
            <span key={tag} style={{ fontSize: 10, fontFamily: 'DM Mono', padding: '2px 7px', borderRadius: 4, background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', color: 'var(--text-muted)' }}>{tag}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', flexShrink: 0 }}>{t.estimatedRows.toLocaleString()} rows</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button onClick={onOpen} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: hovered ? '#2B4D3A' : '#F5F3EF', color: hovered ? '#FFFFFF' : '#2B4D3A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
          Open Report
        </button>
        <button onClick={onOpen} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border-neutral)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Mono', transition: 'all 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          Export
        </button>
      </div>
    </div>
  )
}

/* ── Catalog skeleton ──────────────────────────────────── */
function CatalogSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{ padding: '18px 20px', background: 'var(--surface-01)', border: '1.5px solid var(--border-neutral)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-02)', animation: 'skel 1.4s ease infinite', animationDelay: `${i * 0.1}s` }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 13, borderRadius: 6, background: 'var(--surface-02)', width: '70%', marginBottom: 8, animation: 'skel 1.4s ease infinite', animationDelay: `${i * 0.1}s` }} />
              <div style={{ height: 10, borderRadius: 5, background: 'var(--surface-02)', width: '90%', animation: 'skel 1.4s ease infinite', animationDelay: `${i * 0.1 + 0.1}s` }} />
            </div>
          </div>
          <div style={{ height: 32, borderRadius: 7, background: 'var(--surface-02)', animation: 'skel 1.4s ease infinite', animationDelay: `${i * 0.1 + 0.15}s` }} />
        </div>
      ))}
      <style>{`@keyframes skel{0%,100%{opacity:0.4}50%{opacity:0.9}}`}</style>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function Reports() {
  const { isMobile, isTablet, isLaptop, isDesktop, isNarrow } = useBreakpoint()
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? 'viewer'
  const pagePadding = isMobile ? '12px 12px' : isTablet ? '18px 20px' : isLaptop ? '24px 28px' : '28px 32px'
  const maxWidthStyle = isDesktop ? { maxWidth: 1600, margin: '0 auto' } : {}
  const [view, setView] = useState<'catalog' | 'studio'>('catalog')
  const [catalogState, setCatalogState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [selected,  setSelected]  = useState<ReportTemplate>(TEMPLATES[0])
  const [origins,   setOrigins]   = useState<Set<OriginKey>>(new Set(['guji', 'yirgacheffe', 'harrar']))
  const [roasts,    setRoasts]    = useState<Set<RoastKey>>(new Set(['medium', 'dark']))
  const [startDate, setStartDate] = useState('2026-08-01')
  const [endDate,   setEndDate]   = useState('2026-08-06')
  const [exportFmt, setExportFmt] = useState<ExportFmt>('pdf')
  const [autoEmail, setAutoEmail] = useState(false)
  const [running,   setRunning]   = useState(false)
  const [generated, setGenerated] = useState(false)
  const [progress,  setProgress]  = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setCatalogState('ok'), 900)
    return () => clearTimeout(t)
  }, [])

  const cats = Array.from(new Set(TEMPLATES.map(t => t.category)))
  const canExport = can(role as any, 'reports.export')
  const toggleOrigin = (k: OriginKey) => setOrigins(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  const toggleRoast  = (k: RoastKey)  => setRoasts(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  const handleRun = () => {
    setRunning(true); setGenerated(false); setProgress(0)
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setRunning(false); setGenerated(true); return 100 }
        return p + Math.random() * 18
      })
    }, 120)
  }

  if (!can(role as any, 'reports.view')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, padding: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Access Restricted</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>You do not have permission to view reports. Contact your administrator.</div>
      </div>
    )
  }

  if (view === 'catalog') {
    return (
      <div className="page-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', ...maxWidthStyle }}>
        <div style={{ padding: pagePadding, borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)', flexShrink: 0 }}>
          <div className="section-eyebrow">Analytics</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4, gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.025em' }}>Reports</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Understand business performance, inventory, operations, finance, sales, roasting, delivery, and other authorized activity.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-secondary)' }}>
                {TEMPLATES.length} reports
              </div>
              <button onClick={() => setView('studio')} className="btn-secondary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Report Studio
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: pagePadding }}>
          {catalogState === 'loading' && <CatalogSkeleton />}

          {catalogState === 'error' && (
            <div style={{ padding: '52px 24px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>Unable to load reports</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Please try again.</div>
              <button onClick={() => { setCatalogState('loading'); setTimeout(() => setCatalogState('ok'), 900) }}
                style={{ padding: '8px 20px', borderRadius: 8, background: '#2B4D3A', border: 'none', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )}

          {catalogState === 'ok' && TEMPLATES.length === 0 && (
            <div style={{ padding: '52px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>No reports available</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data available for the selected period. Try changing your filters or date range.</div>
            </div>
          )}

          {catalogState === 'ok' && cats.map(cat => (
            <div key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'DM Mono', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{cat}</div>
                <div style={{ flex: 1, height: 1, background: '#F0EDE8' }} />
                <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{TEMPLATES.filter(t => t.category === cat).length} reports</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {TEMPLATES.filter(t => t.category === cat).map(t => (
                  <CatalogCard key={t.id} t={t} onOpen={() => { setSelected(t); setView('studio') }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* Studio view */
  return (
    <div className="page-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', ...maxWidthStyle }}>

      {/* Header */}
      <div style={{ padding: pagePadding, borderBottom: '1px solid var(--border-neutral)', background: 'var(--surface-01)', flexShrink: 0 }}>
        <div className="section-eyebrow">Analytics</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.025em' }}>Enterprise Reporting Studio</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Custom report builder · Multi-dimensional analytics · Automated scheduling</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setView('catalog')} className="btn-secondary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              All Reports
            </button>
            <div style={{ padding: '5px 10px', borderRadius: 7, background: 'var(--surface-02)', border: '1px solid var(--border-neutral)', fontSize: 11.5, fontFamily: 'DM Mono', color: 'var(--text-secondary)' }}>
              {TEMPLATES.length} templates
            </div>
          </div>
        </div>
      </div>

      {/* Split body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isNarrow ? 'column' : 'row', overflow: isNarrow ? 'auto' : 'hidden' }}>

        {/* ── Left: Template Library ────────────────────── */}
        <div style={{ width: isNarrow ? '100%' : 272, minWidth: isNarrow ? '100%' : 272, background: 'var(--surface-01)', borderRight: isNarrow ? 'none' : '1px solid var(--border-neutral)', borderBottom: isNarrow ? '1px solid var(--border-neutral)' : 'none', overflowY: 'auto', maxHeight: isNarrow ? 360 : undefined }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #F0EDE8' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: 'DM Mono' }}>Report Templates</div>
          </div>
          <div style={{ padding: '8px 8px' }}>
            {cats.map(cat => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#C4C2BA', letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: 'DM Mono', padding: '4px 8px 4px', marginBottom: 3 }}>{cat}</div>
                {TEMPLATES.filter(t => t.category === cat).map(t => {
                  const active = t.id === selected.id
                  return (
                    <button key={t.id} onClick={() => { setSelected(t); setGenerated(false); setProgress(0) }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 9, width: '100%', padding: '9px 10px', borderRadius: 8, border: `1.5px solid ${active ? '#2B4D3A' : 'transparent'}`, background: active ? '#F0FDF4' : 'transparent', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.12s', marginBottom: 3 }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F5F3EF' }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? '#2B4D3A' : '#F5F3EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.12s' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#6B7280'} strokeWidth="1.75">
                          {t.icon.split('M').filter(Boolean).map((s, i) => <path key={i} d={`M${s}`} />)}
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? '#2B4D3A' : '#1F2937', lineHeight: '17px', marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{t.estimatedRows.toLocaleString()} rows</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Configurator + Preview ─────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--surface-02)' }}>

          {/* Selected report header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{selected.category}</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{selected.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, maxWidth: 500 }}>{selected.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'flex-end', maxWidth: 200 }}>
              {selected.tags.map(tag => (
                <span key={tag} style={{ fontSize: 10.5, fontFamily: 'DM Mono', fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', color: 'var(--text-secondary)' }}>{tag}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 294px', gap: 14 }}>

            {/* Preview column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <StatStrip id={selected.id} />

              {/* Chart card */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Interactive Preview</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>{startDate} → {endDate}</span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)', animation: 'statusPulse 2.5s ease-in-out infinite' }} />
                    <style>{`@keyframes statusPulse { 0%,100% { box-shadow:0 0 0 3px rgba(22,163,74,0.2) } 50% { box-shadow:0 0 0 5px rgba(22,163,74,0.07) } }`}</style>
                  </div>
                </div>
                <ReportChart id={selected.id} />
              </div>

              {/* Scheduled reports panel */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Active Scheduled Exports</div>
                {[
                  { name: 'Monthly Revenue Statement', freq: 'Every 1st · 07:00 EAT', recip: 'gm@flavorcoffee.et',  on: true },
                  { name: 'Weekly Yield Variance',     freq: 'Every Monday · 08:00', recip: 'ops@flavorcoffee.et', on: true },
                  { name: 'Supplier Defect Summary',   freq: 'Every Friday · 16:00', recip: 'qc@flavorcoffee.et',  on: false },
                ].map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid #F0EDE8', background: 'var(--bg-primary)', marginBottom: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.on ? '#16A34A' : '#D1D5DB', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginTop: 1 }}>{s.freq} · {s.recip}</div>
                    </div>
                    <button style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border-neutral)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'DM Mono', whiteSpace: 'nowrap' as const }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Configurator column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

              {/* Date scope */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'DM Mono', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 11 }}>Date Scope</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 9 }}>
                  {([['Start', startDate, setStartDate], ['End', endDate, setEndDate]] as [string, string, (v: string) => void][]).map(([label, val, fn]) => (
                    <div key={label}>
                      <label style={{ fontSize: 10.5, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 5 }}>{label}</label>
                      <input type="date" value={val} onChange={e => fn(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-primary)', background: 'var(--bg-primary)', outline: 'none', boxSizing: 'border-box' as const }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {([['Today', () => { setStartDate('2026-08-06'); setEndDate('2026-08-06') }], ['Week', () => { setStartDate('2026-08-03'); setEndDate('2026-08-06') }], ['Month', () => { setStartDate('2026-08-01'); setEndDate('2026-08-06') }]] as [string, () => void][]).map(([label, fn]) => (
                    <button key={label} onClick={fn} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border-neutral)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'DM Mono' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F3EF'} onMouseLeave={e => e.currentTarget.style.background = '#FAFAF8'}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin filter */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'DM Mono', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Coffee Origin</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {([['guji','Guji','#2B4D3A'],['yirgacheffe','Yirgacheffe','#1D4ED8'],['harrar','Harrar','#B45309'],['sidama','Sidama','#7C3AED'],['limu','Limu','#0E7490']] as [OriginKey,string,string][]).map(([k,l,c]) => (
                    <CheckBtn key={k} checked={origins.has(k)} color={c} label={l} onClick={() => toggleOrigin(k)} />
                  ))}
                </div>
              </div>

              {/* Roast filter */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'DM Mono', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Roast Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {([['light','Light Roast','#F59E0B'],['medium','Medium Roast','#B45309'],['dark','Dark Roast','#374151']] as [RoastKey,string,string][]).map(([k,l,c]) => (
                    <CheckBtn key={k} checked={roasts.has(k)} color={c} label={l} onClick={() => toggleRoast(k)} />
                  ))}
                </div>
              </div>

              {/* Export format */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'DM Mono', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Export Format</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                  {([['pdf','PDF','📄'],['xlsx','Excel','📊'],['csv','CSV','📋']] as [ExportFmt,string,string][]).map(([k,l,e]) => (
                    <button key={k} onClick={() => setExportFmt(k)} style={{ padding: '10px 0', borderRadius: 8, border: `1.5px solid ${exportFmt === k ? '#2B4D3A' : '#E5E3DC'}`, background: exportFmt === k ? '#F0FDF4' : '#FAFAF8', cursor: 'pointer', transition: 'all 0.12s', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 16 }}>{e}</span>
                      <span style={{ fontSize: 10.5, fontFamily: 'DM Mono', fontWeight: 700, color: exportFmt === k ? '#2B4D3A' : '#6B7280' }}>{l}</span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginTop: 8 }}>
                  {exportFmt === 'pdf' ? 'Print-ready A4 with letterhead' : exportFmt === 'xlsx' ? 'Multi-sheet workbook + pivot tables' : 'Raw tabular CSV for BI ingestion'}
                </div>
              </div>

              {/* Auto schedule */}
              <div style={{ background: 'var(--surface-01)', border: '1px solid var(--border-neutral)', borderRadius: 12, padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: autoEmail ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>Scheduled Email</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'DM Mono' }}>Every Monday · 08:00 EAT</div>
                  </div>
                  <button onClick={() => setAutoEmail(v => !v)} style={{ width: 40, height: 22, borderRadius: 999, background: autoEmail ? '#2B4D3A' : '#E5E3DC', border: 'none', cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s', padding: 0, flexShrink: 0 }}>
                    <div style={{ position: 'absolute' as const, top: 3, left: autoEmail ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--surface-01)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)' }} />
                  </button>
                </div>
                {autoEmail && (
                  <div style={{ padding: '9px 10px', background: 'var(--surface-02)', borderRadius: 7, border: '1px solid var(--border-neutral)' }}>
                    <div style={{ fontSize: 10.5, fontFamily: 'DM Mono', color: '#374151', marginBottom: 4 }}>Recipient</div>
                    <input defaultValue="gm@flavorcoffee.et" style={{ width: '100%', padding: '5px 8px', borderRadius: 5, border: '1px solid var(--border-neutral)', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-primary)', background: 'var(--surface-01)', outline: 'none', boxSizing: 'border-box' as const }} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'DM Mono' }}>Next: Mon Aug 10 · 08:00 EAT</div>
                  </div>
                )}
              </div>

              {/* Run CTA */}
              <div>
                {running && (
                  <div style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'DM Mono', color: 'var(--text-secondary)', marginBottom: 5 }}>
                      <span>Querying {selected.estimatedRows} records…</span>
                      <span>{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border-neutral)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: 'linear-gradient(90deg, #2B4D3A, #4A7C5A)', borderRadius: 99, transition: 'width 0.15s ease' }} />
                    </div>
                  </div>
                )}
                <button onClick={handleRun} disabled={running}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: running ? '#E5E3DC' : generated ? '#16A34A' : '#2B4D3A', color: running ? '#9CA3AF' : '#FFFFFF', fontSize: 13.5, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: running ? 'none' : '0 3px 10px rgba(43,77,58,0.25)' }}>
                  {running
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                      Running Query…</>
                    : generated
                    ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Download {exportFmt.toUpperCase()}</>
                    : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Query &amp; Download</>
                  }
                </button>
                {generated && (
                  <div style={{ marginTop: 8, padding: '9px 11px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#15803D' }}>{selected.title.slice(0, 28)}….{exportFmt}</div>
                      <div style={{ fontSize: 10, fontFamily: 'DM Mono', color: 'var(--text-muted)', marginTop: 1 }}>{selected.estimatedRows} records · {startDate} → {endDate}</div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
