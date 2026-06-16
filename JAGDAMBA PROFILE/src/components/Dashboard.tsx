import React, { useMemo } from 'react';
import { useAppContext, ALL_STAGES } from '../store/AppContext';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Truck, ScrollText, Database, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { t, branch, orders, dispatches, challans, plates, usages } = useAppContext();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (branch && branch !== 'All') return orders.filter(o => o.location === branch);
    return orders;
  }, [orders, branch]);

  const today = new Date().toISOString().split('T')[0];

  // Stats
  const todayOrders = filtered.filter(o => o.orderDate === today).length;
  const pendingJobs = filtered.filter(o => !['Dispatch Done', 'Challan Done', 'Payment Pending', 'Payment Received'].includes(o.stage)).length;
  const readyForDispatch = filtered.filter(o => o.stage === 'Ready').length;
  const urgentPending = filtered.filter(o => o.urgent && !['Dispatch Done', 'Challan Done', 'Payment Pending', 'Payment Received'].includes(o.stage)).length;
  const pendingChallans = challans.filter(c => c.status === 'Pending').length;
  const totalBalanceAmt = challans.reduce((s, c) => s + (c.balanceAmount ?? (c.totalAmount - (c.amountPaid || 0))), 0);
  const pendingDispatchCount = dispatches.filter(d => d.pendingQty > 0).length;

  // Plate balance
  const totalPlateBalance = plates.reduce((acc, plate) => {
    const plateUsages = usages.filter(u => u.plateId === plate.id);
    const consumed = plateUsages.reduce((sum, u) => sum + u.usedWeight + u.scrapQuantity, 0);
    return acc + (plate.initialWeight - consumed);
  }, 0);

  // Stage pipeline
  const stageCounts = ALL_STAGES.map(stage => ({
    stage,
    count: filtered.filter(o => o.stage === stage).length,
  })).filter(s => s.count > 0);

  // Recent orders
  const recentOrders = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  // Urgent orders
  const urgentOrders = filtered.filter(o => o.urgent && !['Dispatch Done', 'Challan Done', 'Payment Received'].includes(o.stage));

  const primaryStats = [
    { id: 'today', label: "Today's Orders", value: todayOrders.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-100', route: '/production-status' },
    { id: 'pending', label: 'Pending Jobs', value: pendingJobs.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', route: '/production-status' },
    { id: 'ready', label: 'Ready for Dispatch', value: readyForDispatch.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', route: '/dispatch' },
    { id: 'urgent', label: 'Urgent Orders', value: urgentPending.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', route: '/production-status' },
  ];

  const secondaryStats = [
    { label: 'Pending Dispatch', value: pendingDispatchCount.toString(), icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', route: '/dispatch' },
    { label: 'Pending Challans', value: pendingChallans.toString(), icon: ScrollText, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', route: '/challan' },
    { label: 'Pending Payments', value: `₹${Math.round(totalBalanceAmt).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', route: '/challan' },
    { label: 'Plate Balance', value: `${totalPlateBalance.toLocaleString()} Kg`, icon: Database, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', route: '/plate-tracking' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h1>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => navigate('/order-entry')} className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all">
          <Package className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => navigate(stat.route)}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 card-hover cursor-pointer"
          >
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secondaryStats.map((stat, idx) => (
          <div
            key={idx}
            onClick={() => navigate(stat.route)}
            className={`bg-white rounded-xl p-3.5 shadow-sm border flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${stat.border}`}
          >
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{stat.value}</h3>
              <p className="text-2xs font-semibold text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Production Pipeline */}
      {stageCounts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Production Pipeline</h2>
          <div className="flex flex-wrap gap-2">
            {stageCounts.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-1.5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                  <p className="text-lg font-bold text-slate-800">{s.count}</p>
                  <p className="text-3xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{s.stage}</p>
                </div>
                {i < stageCounts.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent Orders</h2>
            <button onClick={() => navigate('/production-status')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">View All →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.map(order => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  {order.urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot flex-shrink-0"></span>}
                  <div>
                    <p className="text-sm font-bold text-slate-800">{order.partyName}</p>
                    <p className="text-xxs text-slate-500">
                      {order.orderNo} • {order.items[0]?.cuttingType} 
                      {order.items[0]?.thickness ? ` • ${order.items[0].thickness}${!order.items[0].thickness.toLowerCase().includes('mm') ? 'mm' : ''}` : ''}
                      {order.items[0]?.cuttingType === 'Circle' && ` (OD:${order.items[0].outerDiameter || '-'})`}
                      {order.items[0]?.cuttingType === 'Square' && ` (${order.items[0].length || '-'}x${order.items[0].width || '-'})`}
                    </p>
                  </div>
                </div>
                <span className="text-2xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {order.stage}
                </span>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">No orders yet</div>
            )}
          </div>
        </div>

        {/* Urgent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-red-50 bg-red-50/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Urgent Delivery Orders
            </h2>
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{urgentOrders.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {urgentOrders.map(order => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{order.partyName}</p>
                  <p className="text-xxs text-slate-500">
                    {order.orderNo} • Due: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
                  </p>
                </div>
                <span className="text-2xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {order.stage}
                </span>
              </div>
            ))}
            {urgentOrders.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">No urgent orders 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
