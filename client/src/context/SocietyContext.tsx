"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"
import emailjs from "@emailjs/browser"

interface SocietyContextType {
  currentUser: any
  members: any[]
  transactions: any[]
  fixedDeposits: any[]
  societyTotalFund: number
  isLoading: boolean
  isSyncing: boolean
  login: (email: string, pass: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (data: any) => Promise<void>
  uploadProfilePic: (file: File) => Promise<string>
  refreshData: () => Promise<void>
  approveMember: (id: string) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>
  approveInstalment: (transaction: any, status: "Approved" | "Rejected") => Promise<void>
  addFixedDeposit: (data: any) => Promise<void>
  updateFixedDeposit: (id: string, data: any) => Promise<void>
  deleteFixedDeposit: (id: string) => Promise<void>
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined)

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [fixedDeposits, setFixedDeposits] = useState<any[]>([])
  const [societyTotalFund, setSocietyTotalFund] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(true)
  const [, setLocation] = useLocation()

  const refreshData = useCallback(async () => {
    setIsSyncing(true)
    try {
      const { data: stats, error: statsError } = await supabase.rpc('get_society_stats')
      
      const [membersRes, transRes, fdRes] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("Installments").select("*").order("created_at", { ascending: false }),
        supabase.from("fixed_deposits").select("*").order("start_date", { ascending: false })
      ])

      if (!statsError && stats && stats.length > 0) {
        const total = Number(stats[0].total_installments || 0) + Number(stats[0].total_interest || 0)
        if (total > 0) {
          setSocietyTotalFund(total)
          localStorage.setItem("persistent_total_fund", total.toString())
        }
      }

      setMembers(membersRes.data || [])
      setTransactions(transRes.data || [])
      setFixedDeposits(fdRes.data || [])
    } catch (err) {
      console.error("[SocietyContext] Refresh failed:", err)
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    const savedFund = localStorage.getItem("persistent_total_fund")
    if (savedFund) setSocietyTotalFund(Number(savedFund))

    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem("user")
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser) refreshData()
  }, [currentUser, refreshData])

  const login = async (email: string, pass: string) => {
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    if (authError) return false
    const { data } = await supabase.from("members").select("*").eq("email", email.trim()).eq("password", pass).single()
    if (data?.status === 'active') {
      setCurrentUser(data)
      localStorage.setItem("user", JSON.stringify(data))
      return true
    }
    return false
  }

  const logout = () => {
    supabase.auth.signOut()
    setCurrentUser(null)
    localStorage.removeItem("user")
    setLocation("/")
  }

  const register = async (userData: any) => {
    const { data: current } = await supabase.from("members").select("id")
    const nextId = (current && current.length > 0 ? Math.max(...current.map(m => m.id)) : 0) + 1
    const { error } = await supabase.from("members").insert([{ ...userData, id: nextId, society_id: `SCS-${String(nextId).padStart(3, '0')}`, status: "pending", fixed_deposit_amount: 0, fixed_deposit_interest: 0, is_admin: false }])
    if (!error) await refreshData()
    return !error
  }

  const approveMember = async (id: string) => {
    await supabase.from("members").update({ status: "active" }).eq("id", id)
    await refreshData()
  }

  const deleteMember = async (id: string) => {
    await supabase.from("members").delete().eq("id", id)
    await refreshData()
  }

  const updateProfile = async (data: any) => {
    const { error } = await supabase.from("members").update(data).eq("id", currentUser.id)
    if (!error) {
      const updated = { ...currentUser, ...data }
      setCurrentUser(updated)
      localStorage.setItem("user", JSON.stringify(updated))
    }
  }

  const uploadProfilePic = async (file: File): Promise<string> => {
    const fileName = `${currentUser.id}-${Date.now()}.${file.name.split(".").pop()}`
    await supabase.storage.from("avatars").upload(fileName, file)
    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)
    await updateProfile({ profile_pic: data.publicUrl })
    return data.publicUrl
  }

  const submitInstalment = async (amount: number, file: File, month: string) => {
    const fileName = `proof-${currentUser.id}-${Date.now()}.${file.name.split(".").pop()}`
    await supabase.storage.from("payments").upload(fileName, file)
    const { data } = supabase.storage.from("payments").getPublicUrl(fileName)
    await supabase.from("Installments").insert([{
      member_id: currentUser.id,
      memberName: currentUser.full_name || currentUser.memberName,
      society_id: currentUser.society_id,
      amount: Number(amount),
      payment_proof_url: data.publicUrl,
      proofPath: fileName,
      month: month,
      status: "Pending",
      created_at: new Date().toISOString(),
    }])
    await refreshData()
  }

  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected") => {
    await supabase.from("Installments").update({ status, approved_at: status === "Approved" ? new Date().toISOString() : null }).eq("id", transaction.id)
    const member = members.find((m) => String(m.id) === String(transaction.member_id))
    if (member?.email) {
      await emailjs.send("service_b8gcj9p", "template_vi2p4ul", {
        member_name: member.full_name,
        member_email: member.email,
        amount: transaction.amount,
        month: transaction.month, status,
        proof_url: transaction.payment_proof_url,
      }, "nKSxYmGpgjuB2J4tF")
      if (transaction.proofPath) await supabase.storage.from("payments").remove([transaction.proofPath])
    }
    await refreshData()
  }

  const addFixedDeposit = async (data: any) => {
    await supabase.from("fixed_deposits").insert([data])
    await refreshData()
  }

  const updateFixedDeposit = async (id: string, data: any) => {
    await supabase.from("fixed_deposits").update(data).eq("id", id)
    await refreshData()
  }

  const deleteFixedDeposit = async (id: string) => {
    if (window.confirm("Delete this?")) {
      await supabase.from("fixed_deposits").delete().eq("id", id)
      await refreshData()
    }
  }

  return (
    <SocietyContext.Provider value={{
      currentUser, members, transactions, fixedDeposits, societyTotalFund, isLoading, isSyncing,
      login, register, logout, updateProfile, uploadProfilePic, refreshData,
      approveMember, deleteMember, submitInstalment, approveInstalment,
      addFixedDeposit, updateFixedDeposit, deleteFixedDeposit,
    }}>
      {children}
    </SocietyContext.Provider>
  )
}

export function useSociety() {
  const context = useContext(SocietyContext)
  if (!context) throw new Error("useSociety must be used within a SocietyProvider")
  return context
}