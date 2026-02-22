"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"
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
  login: (email: string, pass: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (data: any) => Promise<void>
  uploadProfilePic: (file: File) => Promise<string>
  refreshData: () => Promise<void>
  approveMember: (id: string) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>
  approveInstalment: (transaction: any, status: "Approved" | "Rejected") => Promise<any>
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
  const [isLoading, setIsLoading] = useState(true)
  const [, setLocation] = useLocation()

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse user session")
      }
    }
    setIsLoading(false)
  }, [])

  const societyTotalFund = useMemo(() => {
    const totalInstallments = (transactions || [])
      .filter((t) => t.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    const totalRealizedInterest = (fixedDeposits || [])
      .reduce((acc, curr) => acc + (Number(curr.realized_interest) || 0), 0)

    return totalInstallments + totalRealizedInterest
  }, [transactions, fixedDeposits])

  // ✅ FIX: Fetch Installments via server API to bypass RLS
  const refreshData = async () => {
    try {
      const [membersRes, transRes, fdRes] = await Promise.all([
        supabase.from("members").select("*"),
        fetch("/api/transactions").then((r) => r.json()),
        supabase.from("fixed_deposits").select("*").order("start_date", { ascending: false }),
      ])

      const membersData = membersRes.data
      const transData = transRes.success ? transRes.transactions : []
      const fdData = fdRes.data

      if (fdRes.error) console.error("Error fetching FDs:", fdRes.error)

      const nameMap: { [key: string]: string } = {}
      if (membersData) {
        membersData.forEach((m: any) => {
          const name = m.full_name || m.memberName || m.member_name || "No Name"
          nameMap[String(m.id)] = name
        })
      }

      const enrichedTransData = (transData || []).map((trans: any) => ({
        ...trans,
        memberName: nameMap[String(trans.member_id)] || trans.memberName || `Member #${trans.member_id}`,
      }))

      setMembers(membersData || [])
      setTransactions(enrichedTransData)
      setFixedDeposits(fdData || [])
    } catch (err) {
      console.error("[SocietyContext] Data refresh failed:", err)
    }
  }

  useEffect(() => {
    if (currentUser) refreshData()
  }, [currentUser])

  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected") => {
    try {
      const res = await fetch("/api/approve-instalment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: transaction.id, status }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message || "Server update failed")

      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id))
      const targetEmail = memberObj?.email

      if (targetEmail) {
        try {
          emailjs.send(
            "service_b8gcj9p",
            "template_vi2p4ul",
            {
              member_name: memberObj.full_name || transaction.memberName,
              member_email: targetEmail,
              amount: transaction.amount,
              month: transaction.month,
              status: status,
              proof_url: transaction.payment_proof_url,
            },
            "nKSxYmGpgjuB2J4tF",
          )
        } catch (e) {
          console.warn("Mail background error ignored.")
        }
      }

      if (status === "Approved" && transaction.proofPath) {
        await supabase.storage.from("payments").remove([transaction.proofPath])
      }

      await refreshData()

      return { success: true }
    } catch (err: any) {
      console.error("Workflow failed:", err)
      return { success: false, error: err.message }
    }
  }

  const addFixedDeposit = async (data: any) => {
    const { error } = await supabase.from("fixed_deposits").insert([data])
    if (error) throw error
    await refreshData()
  }

  const updateFixedDeposit = async (id: string, data: any) => {
    const { error } = await supabase.from("fixed_deposits").update(data).eq("id", id)
    if (error) throw error
    await refreshData()
  }

  const deleteFixedDeposit = async (id: string) => {
    if (!window.confirm("Delete this deposit permanently?")) return
    const { error } = await supabase.from("fixed_deposits").delete().eq("id", id)
    if (error) throw error
    await refreshData()
  }

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in")
      const fileExt = file.name.split(".").pop()
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from("payments").upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from("payments").getPublicUrl(fileName)

      await supabase.from("Installments").insert([{
        member_id: currentUser.id,
        memberName: currentUser.full_name || currentUser.memberName,
        society_id: currentUser.society_id,
        amount: Number(amount),
        payment_proof_url: urlData.publicUrl,
        proofPath: fileName,
        month: month,
        status: "Pending",
        created_at: new Date().toISOString(),
      }])
      await refreshData()
    } catch (err: any) {
      console.error("Submission Error:", err.message)
    }
  }

  const login = async (email: string, pass: string) => {
    try {
      const { data: memberData } = await supabase.from("members").select("*").eq("email", email.trim()).eq("password", pass).single()
      if (memberData && memberData.status === 'active') {
        setCurrentUser(memberData)
        localStorage.setItem("user", JSON.stringify(memberData))
        return true
      }
      return false
    } catch (err) { return false }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("user")
    setLocation("/")
  }

  const register = async (userData: any) => {
    try {
      const { data: currentMembers } = await supabase.from("members").select("id")
      const lastId = currentMembers && currentMembers.length > 0 ? Math.max(...currentMembers.map(m => m.id)) : 0
      await supabase.from("members").insert([{
        ...userData,
        id: lastId + 1,
        society_id: `SCS-${String(lastId + 1).padStart(3, '0')}`,
        status: "pending",
        fixed_deposit_amount: 0,
        fixed_deposit_interest: 0,
        is_admin: false
      }])
      await refreshData()
      return true
    } catch (err) { return false }
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
      const u = { ...currentUser, ...data }
      setCurrentUser(u)
      localStorage.setItem("user", JSON.stringify(u))
    }
  }

  const uploadProfilePic = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
    await supabase.storage.from("avatars").upload(fileName, file)
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)
    await updateProfile({ profile_pic: urlData.publicUrl })
    return urlData.publicUrl
  }

  return (
    <SocietyContext.Provider value={{
        currentUser, members, transactions, fixedDeposits, societyTotalFund, isLoading,
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
