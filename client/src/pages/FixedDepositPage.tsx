"use client"

import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Banknote, Upload, FileText, Loader2, Plus, TrendingUp, Wallet, PieChart } from "lucide-react"

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit, currentUser } = useSociety()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    interest_rate: "8.265",
    tenure_months: "3"
  })

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

  // Summary Calculations
  const stats = fixedDeposits.reduce((acc: any, fd: any) => {
    const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
    acc.totalPrincipal += Number(fd.amount)
    acc.totalMaturity += m.total
    if (!m.isFinished) acc.activeCount += 1
    return acc
  }, { totalPrincipal: 0, totalMaturity: 0, activeCount: 0 })

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `fd-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('fd-slips').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('fd-slips').getPublicUrl(fileName)
    return publicUrl
  }

  const handleRowUpload = async (event: React.ChangeEvent<HTMLInputElement>, fdId: string) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingId(fdId)
    try {
      const url = await uploadFile(file)
      await updateFixedDeposit(fdId, { slip_url: url })
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploadingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      let slipUrl = ""
      if (selectedFile) slipUrl = await uploadFile(selectedFile)

      const dateObj = new Date(formData.start_date)
      const payload = {
        amount: Number(formData.amount),
        start_date: formData.start_date,
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months),
        month: dateObj.toLocaleString('default', { month: 'long' }),
        year: dateObj.getFullYear().toString(),
        status: "Active",
        society_id: currentUser?.society_id || "SOC_01",
        member_id: currentUser?.id,
        slip_url: slipUrl || undefined
      }

      editingId ? await updateFixedDeposit(editingId, payload) : await addFixedDeposit(payload)
      
      setEditingId(null)
      setSelectedFile(null)
      setFormData({ ...formData, amount: "" })
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 px-2 space-y-6 max-w-full mx-auto min-h-screen font-sans">
      <div className="flex justify-between items-center mb-2 px-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0f172a]">
          <Banknote className="text-[#059669]" size={28} /> Society Treasury Ledger
        </h1>
      </div>

      {/* TOP SUMMARY CARTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Principal</p>
              <h3 className="text-xl font-bold text-slate-800">৳{stats.totalPrincipal.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Maturity Value</p>
              <h3 className="text-xl font-bold text-slate-800">৳{stats.totalMaturity.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
              <PieChart size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Deposits</p>
              <h3 className="text-xl font-bold text-slate-800">{stats.activeCount} Records</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ENTRY FORM */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-[#e2e8f0] rounded-xl bg-white">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-[15px] font-bold text-[#065f46] flex items-center gap-2">
              <Plus size={16} className="bg-[#ecfdf5] rounded p-0.5" /> New Bank Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 px-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Start Date</Label>
                <Input type="date" required className="h-10 border-slate-200 text-sm" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Principal Amount (৳)</Label>
                <Input type="number" required className="h-10 border-slate-200 text-sm" placeholder="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Rate (%)</Label>
                  <Input type="number" step="0.001" className="h-10 border-slate-200 text-sm" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Tenure (M)</Label>
                  <Input type="number" required className="h-10 border-slate-200 text-sm" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Attach FD Slip</Label>
                <Input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="h-10 border-slate-200 text-[11px] pt-1.5 cursor-pointer" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full font-bold h-10 bg-[#059669] hover:bg-[#047857] text-white">
                {isSubmitting ? "Processing..." : "Save Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* HISTORY TABLE */}
        <Card className="lg:col-span-3 shadow-sm border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3 text-left">Period / Status</th>
                  <th className="p-3 text-center">Principal (BDT)</th>
                  <th className="p-3 text-center">Rate (%)</th>
                  <th className="p-3 text-center">Tenure</th>
                  <th className="p-3 text-center">Finish Date</th>
                  <th className="p-3 text-center">Maturity Est.</th>
                  <th className="p-3 text-center">FD Slip</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((fd: any) => {
                  const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
                  return (
                    <tr key={fd.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-800 text-[13px]">{m.startDateStr}</div>
                        <Badge variant="outline" className={`text-[9px] font-bold ${m.isFinished ? "text-[#059669] bg-[#ecfdf5]" : "text-[#2563eb] bg-[#eff6ff]"} border-none`}>
                          {m.isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700 text-[14px]">৳{fd.amount.toLocaleString()}</td>
                      <td className="p-3 text-center font-bold text-[#2563eb] text-[14px]">{fd.interest_rate}%</td>
                      <td className="p-3 text-center text-slate-500 font-medium text-[13px]">{fd.tenure_months}M</td>
                      <td className="p-3 text-center text-slate-700 font-bold text-[13px]">{m.finishDateStr}</td>
                      <td className="p-3 text-center">
                        <div className="bg-[#022c22] text-[#34d399] px-2.5 py-1.5 rounded-lg inline-block font-bold text-[13px]">
                          ৳{m.total.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="p-3 text-center">
                        {fd.slip_url ? (
                          <a href={fd.slip_url} target="_blank" rel="noreferrer" className="text-[#059669] font-bold text-[11px] hover:underline flex flex-col items-center">
                            <FileText size={18} /> View Slip
                          </a>
                        ) : (
                          <div className="flex justify-center">
                            <label className="cursor-pointer text-slate-400 hover:text-[#059669] p-1.5 rounded-full hover:bg-slate-100">
                              {uploadingId === fd.id ? <Loader2 className="animate-spin" size={18} /> : <><Upload size={18} /><input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleRowUpload(e, fd.id)} /></>}
                            </label>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-3 font-bold text-[12px]">
                          <button onClick={() => { setEditingId(fd.id); setFormData({ amount: fd.amount.toString(), start_date: fd.start_date, interest_rate: fd.interest_rate.toString(), tenure_months: fd.tenure_months.toString() }) }} className="text-[#2563eb] hover:underline">Edit</button>
                          <button onClick={() => deleteFixedDeposit(fd.id)} className="text-[#ef4444] hover:underline">Delete</button>
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