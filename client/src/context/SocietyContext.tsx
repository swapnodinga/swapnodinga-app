import React, { createContext, useContext, useState, useEffect } from "react";
import { format } from "date-fns";

// Types
export type UserRole = "admin" | "member";

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  type: "instalment" | "interest";
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  proofUrl?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "pending";
  monthlyInstalment: number;
  fixedDeposit: number;
  totalInstalmentPaid: number;
  totalInterestEarned: number;
  joinDate: string;
}

interface SocietyContextType {
  currentUser: Member | null;
  members: Member[];
  transactions: Transaction[];
  societyTotalFund: number;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, pass: string) => Promise<void>;
  submitInstalment: (amount: number, proofUrl: string) => void;
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  addMember: (member: Omit<Member, "id" | "joinDate" | "totalInstalmentPaid" | "totalInterestEarned">) => void;
  updateMemberFixedDeposit: (id: string, amount: number) => void;
  deleteMember: (id: string) => void;
  approveMember: (id: string) => void;
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined);

// Mock Data
const MOCK_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@swapnodinga.com",
    role: "admin",
    status: "active",
    monthlyInstalment: 0,
    fixedDeposit: 0,
    totalInstalmentPaid: 0,
    totalInterestEarned: 0,
    joinDate: "2024-01-01",
  },
  {
    id: "2",
    name: "Rahim Uddin",
    email: "rahim@example.com",
    role: "member",
    status: "active",
    monthlyInstalment: 5000,
    fixedDeposit: 100000,
    totalInstalmentPaid: 60000,
    totalInterestEarned: 5000,
    joinDate: "2024-02-15",
  },
  {
    id: "3",
    name: "Karim Hasan",
    email: "karim@example.com",
    role: "member",
    status: "active",
    monthlyInstalment: 5000,
    fixedDeposit: 50000,
    totalInstalmentPaid: 45000,
    totalInterestEarned: 2500,
    joinDate: "2024-03-01",
  },
  {
    id: "4",
    name: "New Applicant",
    email: "new@example.com",
    role: "member",
    status: "pending",
    monthlyInstalment: 5000,
    fixedDeposit: 0,
    totalInstalmentPaid: 0,
    totalInterestEarned: 0,
    joinDate: "2024-12-10",
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    memberId: "2",
    memberName: "Rahim Uddin",
    type: "instalment",
    amount: 5000,
    date: "2024-12-01",
    status: "approved",
    proofUrl: "https://placehold.co/400x600?text=Payment+Proof",
  },
  {
    id: "t2",
    memberId: "3",
    memberName: "Karim Hasan",
    type: "instalment",
    amount: 5000,
    date: "2024-12-02",
    status: "pending",
    proofUrl: "https://placehold.co/400x600?text=Payment+Proof",
  },
];

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  // Calculate total society fund (mock logic: sum of all instalments + fixed deposits)
  const societyTotalFund = members.reduce(
    (sum, m) => sum + m.totalInstalmentPaid + m.fixedDeposit + m.totalInterestEarned, 
    0
  );

  const login = async (email: string, pass: string) => {
    // Simple mock login
    const user = members.find((m) => m.email === email);
    if (user) {
      if (user.status === 'pending') {
        alert("Your account is pending approval by the admin.");
        return false;
      }
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = async (name: string, email: string, pass: string) => {
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: "member",
      status: "pending", // Requires admin approval
      monthlyInstalment: 5000, // Default
      fixedDeposit: 0,
      totalInstalmentPaid: 0,
      totalInterestEarned: 0,
      joinDate: format(new Date(), "yyyy-MM-dd"),
    };
    setMembers([...members, newMember]);
    alert("Registration successful! Please wait for admin approval.");
  };

  const submitInstalment = (amount: number, proofUrl: string) => {
    if (!currentUser) return;
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      memberId: currentUser.id,
      memberName: currentUser.name,
      type: "instalment",
      amount,
      date: format(new Date(), "yyyy-MM-dd"),
      status: "pending",
      proofUrl,
    };
    setTransactions([newTx, ...transactions]);
    alert("Instalment submitted for approval!");
  };

  const approveTransaction = (id: string) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...t, status: "approved" } : t))
    );
    // Update member balance
    const tx = transactions.find((t) => t.id === id);
    if (tx && tx.type === "instalment") {
      setMembers(
        members.map((m) =>
          m.id === tx.memberId
            ? { ...m, totalInstalmentPaid: m.totalInstalmentPaid + tx.amount }
            : m
        )
      );
      // Simulate email notification
      console.log(`Email sent to member: Your payment of ${tx.amount} has been approved.`);
    }
  };

  const rejectTransaction = (id: string) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...t, status: "rejected" } : t))
    );
    // Simulate email notification
    console.log(`Email sent to member: Your payment has been rejected.`);
  };

  const addMember = (memberData: Omit<Member, "id" | "joinDate" | "totalInstalmentPaid" | "totalInterestEarned">) => {
    const newMember: Member = {
      ...memberData,
      id: Math.random().toString(36).substr(2, 9),
      totalInstalmentPaid: 0,
      totalInterestEarned: 0,
      joinDate: format(new Date(), "yyyy-MM-dd"),
    };
    setMembers([...members, newMember]);
  };

  const updateMemberFixedDeposit = (id: string, amount: number) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, fixedDeposit: amount } : m))
    );
  };

  const deleteMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const approveMember = (id: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, status: "active" } : m))
    );
  };

  return (
    <SocietyContext.Provider
      value={{
        currentUser,
        members,
        transactions,
        societyTotalFund,
        login,
        logout,
        register,
        submitInstalment,
        approveTransaction,
        rejectTransaction,
        addMember,
        updateMemberFixedDeposit,
        deleteMember,
        approveMember,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const context = useContext(SocietyContext);
  if (context === undefined) {
    throw new Error("useSociety must be used within a SocietyProvider");
  }
  return context;
}
