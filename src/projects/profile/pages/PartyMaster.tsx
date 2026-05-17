import React, { useState, useMemo } from 'react';
import { useAppContext, type PartyMaster } from '../store/AppContext';
import { 
  Plus, Search, Edit2, Trash2, Phone, User, MapPin, 
  FileText, X, CreditCard, Mail, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EditableSelect } from '../components/EditableSelect';
import { BRANCHES } from '../store/AppContext';

export const PartyMasterPage: React.FC = () => {
  const { parties, addParty, updateParty, deleteParty, orders, t } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  
  // Drawer/Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyMaster | null>(null);

  // Form States
  const [partyName, setPartyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 DAYS');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');

  // Calculate order stats per party
  const partyStats = useMemo(() => {
    const stats: Record<string, { count: number; totalVal: number }> = {};
    orders.forEach(o => {
      const name = o.partyName.trim().toUpperCase();
      const val = o.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (!stats[name]) {
        stats[name] = { count: 0, totalVal: 0 };
      }
      stats[name].count += 1;
      stats[name].totalVal += val;
    });
    return stats;
  }, [orders]);

  // Filter parties list
  const filteredParties = useMemo(() => {
    return parties.filter(p => {
      const matchSearch = 
        p.partyName.toUpperCase().includes(searchTerm.toUpperCase()) ||
        p.contactPerson.toUpperCase().includes(searchTerm.toUpperCase()) ||
        p.mobileNumber.includes(searchTerm) ||
        (p.gstNumber && p.gstNumber.toUpperCase().includes(searchTerm.toUpperCase()));
        
      const matchBranch = selectedBranch === 'All' || p.location === selectedBranch;
      
      return matchSearch && matchBranch;
    });
  }, [parties, searchTerm, selectedBranch]);

  const openAddDrawer = () => {
    setEditingParty(null);
    setPartyName('');
    setContactPerson('');
    setMobileNumber('');
    setLocation(BRANCHES[0] || '');
    setDeliveryAddress('');
    setPaymentTerms('30 DAYS');
    setGstNumber('');
    setEmail('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (party: PartyMaster) => {
    setEditingParty(party);
    setPartyName(party.partyName);
    setContactPerson(party.contactPerson);
    setMobileNumber(party.mobileNumber);
    setLocation(party.location);
    setDeliveryAddress(party.deliveryAddress);
    setPaymentTerms(party.paymentTerms || '30 DAYS');
    setGstNumber(party.gstNumber || '');
    setEmail(party.email || '');
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    if (!location) {
      toast.error('Location is required');
      return;
    }

    try {
      if (editingParty) {
        await updateParty({
          id: editingParty.id,
          partyName,
          contactPerson,
          mobileNumber,
          location,
          deliveryAddress,
          paymentTerms,
          gstNumber,
          email
        });
        toast.success('Party ledger updated successfully!');
      } else {
        await addParty({
          partyName,
          contactPerson,
          mobileNumber,
          location,
          deliveryAddress,
          paymentTerms,
          gstNumber,
          email
        });
        toast.success('New party ledger created!');
      }
      setIsDrawerOpen(false);
    } catch (err) {
      toast.error('Failed to save party ledger');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteParty(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 transition-colors duration-300 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-transparent bg-clip-text">
              {t('partyMaster')}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-450 font-bold uppercase tracking-wider">
              Tally Ledgers
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Manage corporate customer databases, credit policies, and auto-fill ledger entries dynamically.
          </p>
        </div>
        <button
          onClick={openAddDrawer}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all self-start md:self-auto uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Create Ledger Account
        </button>
      </div>

      {/* Filter and Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Search & Filter Panel */}
        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by Party Name, Person, Phone, GST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
            >
              <option value="All">All Branches</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Stats Overview */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Total Registered Ledgers</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white block">{parties.length}</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Star className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      {/* Parties Table / Cards List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-wider">
                <th className="px-6 py-4">Party Details</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Billing & GST</th>
                <th className="px-6 py-4">Tally Prime Stats</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <Star className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-800 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">No ledger matches found</p>
                    <p className="text-[10px] mt-1 font-semibold">Try modifying your filters or create a new ledger account above.</p>
                  </td>
                </tr>
              ) : (
                filteredParties.map(p => {
                  const stats = partyStats[p.partyName.trim().toUpperCase()] || { count: 0, totalVal: 0 };
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-900/30 transition-all">
                      {/* Name & Branch */}
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white block hover:text-blue-600 transition cursor-pointer" onClick={() => openEditDrawer(p)}>
                            {p.partyName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {p.location}
                            </span>
                            {p.paymentTerms && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                {p.paymentTerms}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-5">
                        <div className="space-y-1 text-xs">
                          {p.contactPerson && (
                            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {p.contactPerson}
                            </span>
                          )}
                          {p.mobileNumber && (
                            <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {p.mobileNumber}
                            </span>
                          )}
                          {p.email && (
                            <span className="font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5 truncate max-w-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {p.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* GST & Delivery Address */}
                      <td className="px-6 py-5">
                        <div className="space-y-1 text-xs max-w-sm">
                          {p.gstNumber && (
                            <span className="font-black text-slate-800 dark:text-slate-250 flex items-center gap-1.5 uppercase">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                              GST: <span className="text-blue-600 dark:text-blue-450">{p.gstNumber}</span>
                            </span>
                          )}
                          {p.deliveryAddress && (
                            <span className="font-medium text-slate-400 dark:text-slate-500 flex gap-1.5 line-clamp-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {p.deliveryAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Orders Stats */}
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {stats.count} Orders Placed
                          </span>
                          {stats.totalVal > 0 && (
                            <span className="text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-450 uppercase block">
                              Volume: ₹{stats.totalVal.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDrawer(p)}
                            title="Edit Ledger Details"
                            className="p-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-850 hover:text-blue-600 dark:hover:text-blue-450 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.partyName)}
                            title="Delete Ledger Account"
                            className="p-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-850 hover:text-red-600 dark:hover:text-red-450 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Overlay & Content */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-900 shadow-2xl h-full flex flex-col transition-all duration-300 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
              <div>
                <h2 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
                  <Star className="w-4 h-4 text-blue-500 fill-current" />
                  {editingParty ? 'Edit Party Ledger' : 'Create Party Ledger'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Tally Prime style ledger registry
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
              {/* Party Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Party / Customer Name *</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value.toUpperCase())}
                  placeholder="e.g. LARSEN & TOUBRO LTD"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              {/* Branch / Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Branch / Location *</label>
                <EditableSelect
                  value={location}
                  onChange={(val) => setLocation(val)}
                  options={BRANCHES}
                />
              </div>

              {/* Contact Person & Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value.toUpperCase())}
                    placeholder="e.g. RAHUL SHAH"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              {/* Email & GST Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="24AAAAA1111A1Z1"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="IMMEDIATE">IMMEDIATE PAYMENT</option>
                    <option value="7 DAYS">7 DAYS CREDIT</option>
                    <option value="15 DAYS">15 DAYS CREDIT</option>
                    <option value="30 DAYS">30 DAYS CREDIT</option>
                    <option value="45 DAYS">45 DAYS CREDIT</option>
                    <option value="60 DAYS">60 DAYS CREDIT</option>
                  </select>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Default Delivery Address</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value.toUpperCase())}
                  placeholder="Enter full default factory/delivery address"
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex items-center justify-end gap-3 bg-white dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-wider"
                >
                  {editingParty ? 'Save Changes' : 'Create Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
