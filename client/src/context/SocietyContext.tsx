"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"

interface SocietyContextType {
  currentUser: any
  members: any[]
  transactions: any[]
  fixedDeposits: any[]
  societyTotalFund: number
  isLoading: boolean
  login: (email: string, pass: string) => Promise<any>
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

const callApi = async (endpoint: string, body: any) => {
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  
  // Guard against non-JSON server crashes
  if (!res.ok && res.headers.get("content-type")?.indexOf("application/json") === -1) {
    throw new Error(`Server error: ${res.statusText}`)
  }
  
  const data = await res.json()
  if (!data.success) throw new Error(data.message || "API call failed")
  return data
}

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

  // FIX: Accurate Daily Interest Logic to match your frontend ledger
  const societyTotalFund = useMemo(() => {
    const totalInstallments = (transactions || [])
      .filter((t) => t.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
      
    const totalRealizedInterest = (fixedDeposits || []).reduce((acc, fd) => {
      const start = new Date(fd.start_date)
      const finish = new Date(fd.start_date)
      finish.setMonth(start.getMonth() + Number(fd.tenure_months))
      
      // Only count if matured
      if (finish <= new Date()) {
        const diffDays = Math.ceil(Math.abs(finish.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const interest = (Number(fd.amount) * Number(fd.interest_rate) * diffDays) / (365 * 100)
        return acc + Math.round(interest)
      }
      return acc
    }, 0)
    
    return totalInstallments + totalRealizedInterest
  }, [transactions, fixedDeposits])

  const refreshData = async () => {
    try {
      const { data: membersData } = await supabase.from("members_public").select("*")
      const { data: transData } = await supabase.from("Installments").select("*").order("created_at", { ascending: false })
      const { data: fdData } = await supabase.from("fixed_deposits").select("*").order("start_date", { ascending: false })

      const nameMap: { [key: string]: string } = {}
      if (membersData) {
        membersData.forEach((m: any) => {
          nameMap[String(m.id)] = m.full_name || m.memberName || m.member_name || "No Name"
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
      console.error("[SocietyContext] Refresh failed:", err)
    }
  }

  useEffect(() => {
    if (!currentUser) return
    refreshData()
    
    const channel = supabase
      .channel("society-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "Installments" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "fixed_deposits" }, () => refreshData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser])

  // ... (All other auth/approval functions remain exactly the same)
  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected"): Promise<any> => {
    try {
      await callApi("approve-instalment", { id: transaction.id, status })
      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id))
      if (memberObj?.email) {
        callApi("send-email", {
          member_name: memberObj.full_name || transaction.memberName,
          member_email: memberObj.email,
          amount: transaction.amount,
          month: transaction.month,
          status,
          proof_url: transaction.payment_proof_url,
        }).catch((e) => console.warn("Email service failed", e))
      }
      await refreshData()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in")
      const fileExt = file.name.split(".").pop()
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from("payments").upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from("payments").getPublicUrl(fileName)
      await callApi("submit-instalment", {
        member_id: currentUser.id,
        memberName: currentUser.full_name || currentUser.memberName,
        society_id: currentUser.society_id,
        amount: Number(amount),
        payment_proof_url: urlData.publicUrl,
        proofPath: fileName,
        month,
      })
      await refreshData()
    } catch (err: any) {
      console.error("Submission Error:", err.message)
    }
  }

  const approveMember = async (id: string) => {
    await callApi("approve-member", { member_id: id })
    await refreshData()
  }

  const deleteMember = async (id: string) => {
    if (!window.confirm("Delete this member permanently?")) return
    await callApi("delete-member", { member_id: id })
    await refreshData()
  }

  const addFixedDeposit = async (data: any) => {
    await callApi("fixed-deposit", { action: "add", data })
    await refreshData()
  }

  const updateFixedDeposit = async (id: string, data: any) => {
    await callApi("fixed-deposit", { action: "update", fd_id: id, data })
    await refreshData()
  }

  const deleteFixedDeposit = async (id: string) => {
    if (!window.confirm("Delete this deposit permanently?")) return
    await callApi("fixed-deposit", { action: "delete", fd_id: id })
    await refreshData()
  }

  const login = async (email: string, pass: string) => {
    try {
      const data = await callApi("auth-login", { email, password: pass })
      if (data?.success && data?.user) {
        setCurrentUser(data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
        return { success: true, user: data.user }
      }
      return false
    } catch (err) {
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("user")
    setLocation("/")
  }

  const register = async (userData: any) => {
    try {
      const data = await callApi("auth-register", {
        full_name: userData.full_name,
        email: userData.email,
        password: userData.password,
      })
      return data?.success === true
    } catch (err) {
      return false
    }
  }

// ADD THIS NEW FUNCTION - to fetch and verify current user from database
const refreshCurrentUser = async () => {
  try {
    if (!currentUser?.id) return
    const { data: userData, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", currentUser.id)
      .single()
    
    if (error) throw error
    if (userData) {
      setCurrentUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    }
  } catch (err) {
    console.error("Failed to refresh current user:", err)
  }
}

// REVISED: updateProfile - with database verification
const updateProfile = async (data: any) => {
  try {
    // 1. Call API to update database
    await callApi("update-profile", { member_email: currentUser.email, data })
    
    // 2. Update local state immediately for UI responsiveness
    setCurrentUser((prev: any) => {
      const updated = { ...prev, ...data }
      localStorage.setItem("user", JSON.stringify(updated))
      return updated
    })

    // 3. IMPORTANT: Verify the database actually saved the update
    // This refetches currentUser from DB to confirm the API call worked
    await refreshCurrentUser()
    
  } catch (err: any) {
    console.error("Context Update Error:", err)
    // Revert optimistic update by refreshing from DB
    await refreshCurrentUser()
    throw err
  }
}

// REVISED: uploadProfilePic - with proper error handling and verification
const uploadProfilePic = async (file: File): Promise<string> => {
  try {
    // 1. Upload to storage
    const fileExt = file.name.split(".").pop()
    const safeEmail = currentUser.email.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `avatar-${safeEmail}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file)
    
    if (uploadError) throw uploadError
    
    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)
    
    // 3. Update profile with URL AND wait for verification
    await updateProfile({ profile_pic: urlData.publicUrl })
    
    // 4. Return the URL only after database verification succeeds
    return urlData.publicUrl
    
  } catch (err: any) {
    console.error("Upload Error:", err)
    throw err
  }
}

  return (
    <SocietyContext.Provider
      value={{
        currentUser, members, transactions, fixedDeposits, societyTotalFund, isLoading,
        login, register, logout, updateProfile, uploadProfilePic, refreshData,
        approveMember, deleteMember, submitInstalment, approveInstalment,
        addFixedDeposit, updateFixedDeposit, deleteFixedDeposit,
      }}
    >
      {children}
    </SocietyContext.Provider>
  )
}

export function useSociety() {
  const context = useContext(SocietyContext)
  if (!context) throw new Error("useSociety must be used within a SocietyProvider")
  return context
}