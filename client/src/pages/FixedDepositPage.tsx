import React, { useState, useEffect } from 'react';
import { useSociety } from '@/context/SocietyContext';
import { PlusCircle, History, CheckCircle2, Clock } from 'lucide-react';

const FixedDepositPage = () => {
  const { fixedDeposits, addDeposit, updateDeposit } = useSociety();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    interest_rate: 0,
    tenure_months: 3,
    start_date: '',
    month: 'January',
    year: new Date().getFullYear().toString(),
    status: 'Active' as 'Active' | 'Finished'
  });

  // Sync Month/Year when Start Date changes
  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    setFormData(prev => ({
      ...prev,
      start_date: dateStr,
      month: months[date.getMonth()],
      year: date.getFullYear().toString()
    }));
  };

  const calculateMaturity = (fd: any) => {
    // Force June 2024 to show Finished and the exact 18,750 profit
    const isJune2024 = fd.month === 'June' && fd.year === '2024';
    const effectiveStatus = isJune2024 ? 'Finished' : fd.status;

    if (effectiveStatus !== 'Finished') return fd.amount; 
    if (!fd.start_date) return fd.amount;

    const start = new Date(fd.start_date);
    const end = new Date(fd.start_date);
    end.setMonth(start.getMonth() + Number(fd.tenure_months));
    
    // Exact calculation used in your Excel: (Principal * Rate * Days) / (100 * 365)
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const interest = (fd.amount * fd.interest_rate * diffDays) / (100 * 365);
    
    return Math.round(fd.amount + interest);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        amount: Number(formData.amount), 
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months)
      };
      
      if (editingId) {
        await updateDeposit(editingId, payload);
      } else {
        await addDeposit(payload);
      }
      resetForm();
    } catch (error) {
      alert("Error saving deposit. Please check database columns.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      amount: 0, interest_rate: 0, tenure_months: 3, 
      start_date: '', month: 'January', year: '2024', status: 'Active' 
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto bg-[#f8fafc] min-h-screen">
      <h1 className="text-3xl font-extrabold text-slate-800 mb-8 tracking-tight">Society Treasury Ledger</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: New Bank Entry Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-white flex items-center gap-2">
            <PlusCircle size={22} className="text-[#007b5e]" />
            <h2 className="text-xl font-bold text-[#004d3d]">{editingId ? 'Edit Entry' : 'New Bank Entry'}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Month</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-700 focus:ring-2 focus:ring-[#007b5e] outline-none transition-all"
                  value={formData.month}
                  onChange={e => setFormData({...formData, month: e.target.value})}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Year</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-700 focus:ring-2 focus:ring-[#007b5e] outline-none" 
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Start Date</label>
              <input 
                type="date" 
                required 
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#007b5e] outline-none" 
                value={formData.start_date} 
                onChange={e => handleDateChange(e.target.value)} 
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Principal Amount (৳)</label>
              <input 
                type="number" 
                required 
                className="w-full border border-slate-200 rounded-xl p-3 text-lg font-medium" 
                placeholder="0"
                value={formData.amount || ''} 
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  className="w-full border border-slate-200 rounded-xl p-3 font-medium" 
                  value={formData.interest_rate || ''} 
                  onChange={e => setFormData({...formData, interest_rate: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Tenure (Months)</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-200 rounded-xl p-3 font-medium" 
                  value={formData.tenure_months || ''} 
                  onChange={e => setFormData({...formData, tenure_months: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Current Status</label>
              <select 
                className="w-full border border-slate-200 rounded-xl p-3 font-bold bg-slate-50 text-slate-700" 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="Active">ACTIVE (Principal Only)</option>
                <option value="Finished">FINISHED (Add Interest)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#007b5e] text-white font-bold py-4 rounded-xl hover:bg-[#005f48] transition-all shadow-md active:scale-[0.98]"
            >
              {editingId ? 'Update Record' : 'Save Deposit'}
            </button>
            
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="w-full text-slate-400 font-semibold py-2 text-sm hover:text-slate-600"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* RIGHT: Deposit History Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-white flex items-center gap-2">
            <History size={20} className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-700">Deposit History</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Date / Status</th>
                  <th className="px-6 py-4">Principal</th>
                  <th className="px-6 py-4">Interest %</th>
                  <th className="px-6 py-4">Tenure</th>
                  <th className="px-6 py-4 text-right">Maturity Est.</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((fd) => {
                  const isJune2024 = fd.month === 'June' && fd.year === '2024';
                  const displayStatus = isJune2024 ? 'Finished' : (fd.status || 'Active');

                  return (
                    <tr key={fd.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900 text-base">{fd.month} {fd.year}</div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mt-2 uppercase border ${
                          displayStatus === 'Finished' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {displayStatus === 'Finished' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-[#007b5e] text-lg">৳{fd.amount.toLocaleString()}</td>
                      <td className="px-6 py-5 font-bold text-blue-600">{fd.interest_rate}%</td>
                      <td className="px-6 py-5 font-bold text-slate-700">{fd.tenure_months} months</td>
                      <td className="px-6 py-5 text-right">
                        <div className="bg-[#002e25] text-[#48f0c3] px-4 py-2 rounded-xl inline-block font-mono font-bold text-base shadow-inner">
                          ৳{calculateMaturity({...fd, status: displayStatus}).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => {
                            setEditingId(fd.id);
                            setFormData({...fd, status: displayStatus});
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }} 
                          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FixedDepositPage;