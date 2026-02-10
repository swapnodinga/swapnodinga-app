"use client"

import { useState, useMemo } from "react"
import { useSociety } from "@/context/SocietyContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Banknote, Loader2, Plus, 
  TrendingUp, Calendar, History, 
  Trash2, Edit, RefreshCw, ChevronRight 
} from "lucide-react"

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit, currentUser } = useSociety()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    reference_no: "",
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    interest_rate: "8.265",
    tenure_months: "3"
  })

  // --- DATE FORMATTING LOGIC ---
  const formatTableDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", { 
      day: "2-digit", month: "short", year: "2-digit" 
    }).replace(/ /g, "-")
  }

  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start)
    const finishDate = new Date(start)
    finishDate.setMonth(startDate.getMonth() + Number(months))
    
    // Calculate exact days for precision interest
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const interest = (amount * rate * diffDays) / (365 * 100)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize today to start of day
    
    const finishCompare = new Date(finishDate)
    finishCompare.setHours(0, 0, 0, 0)

    const diffToFinish = Math.ceil((finishCompare.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      finishDate,
      finishDateStr: formatTableDate(finishDate.toISOString()),
      interestAmount: Math.round(interest),
      total: Math.round(amount + interest),
      isFinished: finishCompare <= today,
      isExpiringSoon: diffToFinish <= 7 && diffToFinish > 0 
    }
  }

  // --- CALCULATED SUMMARY STATS (Fixed Accounting Logic) ---
  const stats = useMemo(() => {
    let activePrincipal = 0
    let totalInterest = 0
    let activeCount = 0

    fixedDeposits.forEach(fd => {
      const m = getMaturityData(Number(fd.amount), Number(fd.interest_rate), fd.start_date, Number(fd.tenure_months))
      
      // DEEP FIX: Only count principal if the deposit hasn't matured yet
      // This prevents double-counting when reinvesting
      if (!m.isFinished) {
        activePrincipal += Number(fd.amount)
        activeCount++
      }
      
      totalInterest += m.interestAmount
    })

    return { activePrincipal, totalInterest, activeCount }
  }, [fixedDeposits])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months),
        society_id: currentUser?.society_id,
        member_id: currentUser?.id,
        status: "Active"
      }
      
      if (editingId) {
        await updateFixedDeposit(editingId, payload)
      } else {
        await addFixedDeposit(payload)
      }
      
      setShowForm(false)
      setEditingId(null)
      setFormData({ reference_no: "", amount: "", start_date: new Date().toISOString().split("T")[0], interest_rate: "8.265", tenure_months: "3" })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (fd: any) => {
    setEditingId(fd.id)
    setFormData({
      reference_no: fd.reference_no || "",
      amount: fd.amount.toString(),
      start_date: fd.start_date,
      interest_rate: fd.interest_rate.toString(),
      tenure_months: fd.tenure_months.toString()
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReinvest = (fd: any) => {
    const m = getMaturityData(Number(fd.amount), Number(fd.interest_rate), fd.start_date, Number(fd.tenure_months))
    setEditingId(null)
    setFormData({
      reference_no: "", 
      amount: m.total.toString(), 
      start_date: m.finishDate.toISOString().split("T")[0], 
      interest_rate: fd.interest_rate.toString(),
      tenure_months: fd.tenure_months.toString()
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this MTDR record? This will remove it from the treasury calculations.")) {
      await deleteFixedDeposit(id)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto bg-[#f8fafc] min-h-screen">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Banknote className="text-emerald-600" size={36} /> Treasury Ledger
          </h1>
          <p className="text-slate-500 font-medium ml-12">"MTDR Investment & Fixed Deposit Management"</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200">
          {showForm ? "Close Form" : <><Plus size={18} className="mr-2"/> New Deposit Entry</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white border-b-4 border-b-emerald-500">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><TrendingUp className="text-emerald-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Active Principal</p>
              <h3 className="text-2xl font-black text-slate-800">৳{stats.activePrincipal.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-b-4 border-b-blue-500">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><Calendar className="text-blue-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Running MTDRs</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.activeCount} Records</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-b-4 border-b-amber-500">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl"><TrendingUp className="text-amber-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Total Est. Interest</p>
              <h3 className="text-2xl font-black text-amber-600">৳{stats.totalInterest.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {showForm && (
          <Card className="lg:col-span-1 border-none shadow-xl animate-in slide-in-from-left duration-300 h-fit">
             <CardHeader className={`${editingId ? 'bg-blue-600' : 'bg-emerald-600'} rounded-t-xl py-4 transition-colors`}>
                <CardTitle className="text-white text-lg">{editingId ? 'Update Deposit' : 'Deposit Details'}</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Start Date</Label>
                    <Input type="date" required value={formData.start_date} onChange={(e)=>setFormData({...formData, start_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">MTDR Reference #</Label>
                    <Input placeholder="e.g. 3957631" required value={formData.reference_no} onChange={(e)=>setFormData({...formData, reference_no: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Principal Amount</Label>
                    <Input type="number" placeholder="৳ 0.00" required value={formData.amount} onChange={(e)=>setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Rate (%)</Label>
                      <Input type="number" step="0.001" value={formData.interest_rate} onChange={(e)=>setFormData({...formData, interest_rate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Months</Label>
                      <Input type="number" value={formData.tenure_months} onChange={(e)=>setFormData({...formData, tenure_months: e.target.value})} />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className={`w-full font-bold h-12 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900'} text-white`}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : editingId ? "Update Entry" : "Confirm & Save"}
                  </Button>
                </form>
             </CardContent>
          </Card>
        )}

        <div className={`${showForm ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4`}>
          {fixedDeposits.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
               <History className="text-slate-300 mx-auto mb-4" size={48} />
               <p className="text-slate-400 font-medium">No fixed deposits recorded yet.</p>
            </div>
          ) : (
            fixedDeposits.map((fd: any) => {
              const m = getMaturityData(Number(fd.amount), Number(fd.interest_rate), fd.start_date, Number(fd.tenure_months))
              return (
                <Card key={fd.id} className={`border-none shadow-sm hover:shadow-md transition-all overflow-hidden group ${m.isExpiringSoon ? 'ring-2 ring-amber-400' : ''}`}>
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className={`w-2 ${m.isFinished ? 'bg-slate-300' : m.isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 p-5 grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Reference</p>
                        <h4 className="text-md font-bold text-slate-700">MTDR-{fd.reference_no || 'Manual'}</h4>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className={`text-[9px] ${m.isFinished ? 'bg-slate-50 text-slate-500' : m.isExpiringSoon ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                            {m.isFinished ? 'MATURED' : m.isExpiringSoon ? 'FINISHING SOON' : 'ACTIVE'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Principal</p>
                        <h4 className="text-md font-black text-slate-800">৳{Number(fd.amount).toLocaleString()}</h4>
                      </div>

                      <div className="hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Maturity Date</p>
                        <h4 className="text-sm font-bold text-slate-600">{m.finishDateStr}</h4>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Interest Earned</p>
                        <h4 className="text-md font-bold text-amber-600">৳{m.interestAmount.toLocaleString()}</h4>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        {(m.isExpiringSoon || m.isFinished) ? (
                           <Button 
                             onClick={() => handleReinvest(fd)}
                             variant="outline" 
                             className="flex flex-col h-auto py-1 px-3 border-amber-200 bg-amber-50 hover:bg-amber-100 group/btn"
                           >
                              <RefreshCw size={14} className="text-amber-600 group-hover/btn:rotate-180 transition-transform duration-500" />
                              <span className="text-[9px] font-bold text-amber-700">REINVEST</span>
                           </Button>
                        ) : (
                           <span className="text-[10px] font-bold text-slate-300">IN PROGRESS</span>
                        )}
                      </div>

                      <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="sm" onClick={() => handleEdit(fd)} className="text-blue-500 hover:bg-blue-50">
                           <Edit size={16} />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => handleDelete(fd.id)} className="text-red-500 hover:bg-red-50">
                           <Trash2 size={16} />
                         </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}