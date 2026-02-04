import React, { useState } from 'react';
import { useSociety } from '@/context/SocietyContext';
import { Edit2, Plus, TrendingUp, Calendar } from 'lucide-react';

const FixedDepositPage = () => {
  const { fixedDeposits, addDeposit, updateDeposit } = useSociety();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: 0,
    interest_rate: 0,
    tenure_months: 0,
    start_date: '',
    month: '',
    year: ''
  });

  // Accurate calculation: (Principal * Rate * Days) / (100 * 365)
  const calculateMaturity = (amount: number, rate: number, startDate: string, months: number) => {
    if (!startDate || !amount || !rate) return amount;
    
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setMonth(start.getMonth() + Number(months));
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const interest = (amount * rate * diffDays) / (100 * 365);
    return amount + interest;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDeposit(editingId, formData);
      } else {
        await addDeposit(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      alert("Error saving deposit");
    }
  };

  const handleEdit = (deposit: any) => {
    setEditingId(deposit.id);
    setFormData({
      amount: deposit.amount,
      interest_rate: deposit.interest_rate,
      tenure_months: deposit.tenure_months,
      start_date: deposit.start_date || '',
      month: deposit.month,
      year: deposit.year
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Society Treasury Ledger</h1>
        <button 
          onClick={() => { setEditingId(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} /> Add New FD
        </button>
      </div>

      {/* FD Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Period</th>
              <th className="p-4">Principal (BDT)</th>
              <th className="p-4">Rate (%)</th>
              <th className="p-4">Maturity Est.</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fixedDeposits.map((fd) => (
              <tr key={fd.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium">{fd.month} {fd.year}</div>
                  <div className="text-xs text-gray-500">{fd.start_date}</div>
                </td>
                <td className="p-4">৳{fd.amount.toLocaleString()}</td>
                <td className="p-4">{fd.interest_rate}%</td>
                <td className="p-4 font-semibold text-green-700">
                  ৳{calculateMaturity(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleEdit(fd)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Deposit' : 'New Fixed Deposit'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full border rounded-lg p-2"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Amount" 
                  type="number"
                  className="border rounded-lg p-2"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                />
                <input 
                  placeholder="Rate (e.g. 8.265)" 
                  type="number" 
                  step="0.001"
                  className="border rounded-lg p-2"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({...formData, interest_rate: Number(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedDepositPage;