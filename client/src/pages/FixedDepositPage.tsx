"use client"

import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit2, Trash2, Clock, CheckCircle2, Banknote, Calendar } from "lucide-react"

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit } = useSociety()
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    interest_rate: "8.265",
    tenure_months: "3"
  })

  // HELPER: Unified formatting for both Date and Finish Date (e.g., 13-Jun-24)
  const formatTableDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "short", 
      year: "2-digit" 
    }).replace(/ /g, "-")
  }

  // CORE LOGIC: Fixed tenure addition and interest calculation
  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start)
    const finishDate = new Date(start)
    
    // Correctly adds months to the specific start date
    finishDate.setMonth(startDate.getMonth() + Number(months))

    // Calculate precision days for interest
    const diffTime = Math.abs(finishDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const interest = (amount * rate * diffDays) / (365 * 100)
    
    return {
      startDateStr: formatTableDate(startDate), 
      finishDateStr: formatTableDate(finishDate),
      total: Math.round(amount + interest),
      isFinished: finishDate <= new Date()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      amount: Number(formData.amount),
      start_date: formData.start_date,
      interest_rate: Number(formData.interest_rate),
      tenure_months: Number(formData.tenure_months),
    }

    if (editingId) {
      await updateFixedDeposit(editingId, payload)
      setEditingId(null)
    } else {
      await addFixedDeposit(payload)
    }
    setFormData({ ...formData, amount: "" })
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50/20 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
          <Banknote className="text-emerald-600" size={28} /> Society Treasury Ledger
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ENTRY FORM */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-slate-200 rounded-xl bg-white">
          <CardHeader className="border-b">
            <CardTitle className="text-md flex items-center gap-2 text-emerald-800 font-bold">
              <PlusCircle size={18} /> {editingId ? "Edit Entry" : "New Bank Entry"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Start Date</Label>
                <div className="relative">
                  <Input type="date" className="pl-9 h-11" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Principal (৳)</Label>
                <Input type="number" required placeholder="0" className="h-11" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Rate (%)</Label>
                  <Input type="number" step="0.001" className="h-11" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Tenure (M)</Label>
                  <Input type="number" required className="h-11" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className={`w-full font-bold h-11 transition-all ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-700 hover:bg-emerald-800'}`}>
                {editingId ? "Update Record" : "Save Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* DATA TABLE */}
        <Card className="lg:col-span-3 shadow-sm border-slate-200 rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-white border-b py-4 px-6">
            <CardTitle className="text-md font-bold flex items-center gap-2 text-slate-600">
              <Clock size={18} className="text-slate-400" /> Deposit History
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-4 text-left">Period / Status</th>
                  <th className="p-4 text-center">Principal (BDT)</th>
                  <th className="p-4 text-center">Rate (%)</th>
                  <th className="p-4 text-center">Tenure</th>
                  <th className="p-4 text-center">Finish Date (Auto)</th>
                  <th className="p-4 text-center">Maturity Est.</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((fd) => {
                  const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
                  return (
                    <tr key={fd.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{m.startDateStr}</div>
                        <Badge variant="outline" className={`text-[9px] mt-1 font-bold px-2 py-0 h-5 ${m.isFinished ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-blue-700 bg-blue-50 border-blue-100"}`}>
                          {m.isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">৳{fd.amount.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-blue-600">{fd.interest_rate}%</td>
                      <td className="p-4 text-center text-slate-500 font-medium">{fd.tenure_months} Months</td>
                      <td className="p-4 text-center font-mono text-slate-600 font-bold">{m.finishDateStr}</td>
                      <td className="p-4 text-center">
                        <div className="bg-[#002e25] text-[#48f0c3] px-3 py-1.5 rounded-lg inline-block font-bold text-xs">
                          ৳{m.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100" onClick={() => { setEditingId(fd.id); setFormData({ amount: fd.amount.toString(), start_date: fd.start_date, interest_rate: fd.interest_rate.toString(), tenure_months: fd.tenure_months.toString() }) }}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100" onClick={() => deleteFixedDeposit(fd.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}