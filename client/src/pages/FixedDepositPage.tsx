"use client"

import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Banknote, Calendar, Clock, Upload, Receipt, TrendingUp, Wallet } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit, currentUser } = useSociety()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    interest_rate: "8.265",
    tenure_months: "3",
    slip_url: ""
  })

  // Summary logic
  const totalPrincipal = fixedDeposits.reduce((sum, fd) => sum + Number(fd.amount), 0)
  const activeDepositsCount = fixedDeposits.filter(fd => {
    const finishDate = new Date(fd.start_date)
    finishDate.setMonth(finishDate.getMonth() + Number(fd.tenure_months))
    return finishDate > new Date()
  }).length

  const formatTableDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "short", 
      year: "2-digit" 
    }).replace(/ /g, "-")
  }

  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start)
    const finishDate = new Date(start)
    finishDate.setMonth(startDate.getMonth() + Number(months))
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const interest = (amount * rate * diffDays) / (365 * 100)
    return {
      startDateStr: formatTableDate(startDate), 
      finishDateStr: formatTableDate(finishDate),
      total: Math.round(amount + interest),
      isFinished: finishDate <= new Date()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `slips/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('fixed_deposits')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('fixed_deposits')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, slip_url: data.publicUrl }))
    } catch (error: any) {
      alert("Error uploading slip: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const dateObj = new Date(formData.start_date)
    const payload = {
      amount: Number(formData.amount),
      start_date: formData.start_date,
      interest_rate: Number(formData.interest_rate),
      tenure_months: Number(formData.tenure_months),
      month: dateObj.toLocaleString('default', { month: 'long' }), 
      year: dateObj.getFullYear().toString(), 
      status: "Active",
      society_id: currentUser?.society_id,
      member_id: currentUser?.id,
      slip_url: formData.slip_url 
    }

    try {
      if (editingId) {
        await updateFixedDeposit(editingId, payload)
        setEditingId(null)
      } else {
        await addFixedDeposit(payload)
      }
      setFormData({ ...formData, amount: "", slip_url: "" })
    } catch (err: any) {
      console.error("Save failed:", err)
      alert("Error saving deposit. Please check your SQL policies.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen font-sans">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0f172a]">
          <Banknote className="text-[#059669]" size={28} /> Society Treasury Ledger
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Wallet size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Principal</p>
              <h3 className="text-xl font-bold text-slate-800">৳{totalPrincipal.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><TrendingUp size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Active Deposits</p>
              <h3 className="text-xl font-bold text-slate-800">{activeDepositsCount} Records</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Receipt size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Avg. Rate</p>
              <h3 className="text-xl font-bold text-slate-800">8.26%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1 h-fit shadow-sm border-[#e2e8f0] rounded-xl bg-white">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-[15px] flex items-center gap-2 text-[#065f46] font-bold">
              <span className="p-1 bg-[#ecfdf5] rounded text-[#059669]">+</span> New Bank Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5 px-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase font-bold text-slate-400">Start Date</Label>
                <div className="relative">
                  <Input type="date" required className="pl-9 h-11" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                  <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase font-bold text-slate-400">Principal (৳)</Label>
                <Input type="number" required placeholder="0" className="h-11" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">Rate (%)</Label>
                  <Input type="number" step="0.001" className="h-11" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">Tenure (M)</Label>
                  <Input type="number" required className="h-11" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase font-bold text-slate-400">Deposit Slip</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="slip-upload" className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg h-11 cursor-pointer hover:bg-slate-50 text-slate-500 text-xs">
                    <Upload size={14} /> {uploading ? "Uploading..." : formData.slip_url ? "Slip Ready" : "Browse..."}
                  </Label>
                  <Input id="slip-upload" type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting || uploading} className={`w-full font-bold h-11 text-white ${editingId ? 'bg-[#2563eb]' : 'bg-[#059669]'}`}>
                {isSubmitting ? "Processing..." : (editingId ? "Update Entry" : "Save Deposit")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-white border-b py-4 px-6">
            <CardTitle className="text-[15px] font-bold flex items-center gap-2 text-slate-600">
              <Clock size={18} className="text-slate-400" /> Deposit History
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-4 text-left">Period</th>
                  <th className="p-4 text-center">Principal</th>
                  <th className="p-4 text-center">Rate</th>
                  <th className="p-4 text-center">Finish Date</th>
                  <th className="p-4 text-center">Maturity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((fd) => {
                  const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
                  return (
                    <tr key={fd.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{m.startDateStr}</div>
                        <Badge variant="outline" className={`text-[10px] border-none ${m.isFinished ? "text-[#059669] bg-[#ecfdf5]" : "text-[#2563eb] bg-[#eff6ff]"}`}>
                          {m.isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold">৳{fd.amount.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-[#2563eb]">{fd.interest_rate}%</td>
                      <td className="p-4 text-center text-slate-700 font-bold">{m.finishDateStr}</td>
                      <td className="p-4 text-center">
                        <div className="bg-[#022c22] text-[#34d399] px-3 py-1.5 rounded-lg inline-block font-bold">
                          ৳{m.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          {fd.slip_url && (
                            <a href={fd.slip_url} target="_blank" className="text-slate-400 hover:text-[#059669]"><Receipt size={16} /></a>
                          )}
                          <button onClick={() => { setEditingId(fd.id); setFormData({ ...fd, amount: fd.amount.toString(), slip_url: fd.slip_url || "" }) }} className="text-[#2563eb] font-bold text-[13px]">Edit</button>
                          <button onClick={() => confirm("Delete?") && deleteFixedDeposit(fd.id)} className="text-[#ef4444] font-bold text-[13px]">Delete</button>
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