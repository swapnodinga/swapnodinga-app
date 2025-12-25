import React from 'react';
import { useSociety } from '../context/SocietyContext';
import { Table, Tag, Card, Button } from 'lucide-react'; // Or your preferred UI library

const AdminMembers = () => {
  const { members, deleteMember, approveMember } = useSociety();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Member Management</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-left text-sm uppercase font-semibold">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Fixed Deposit</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-gray-200 text-sm">
                <td className="px-5 py-5">{member.name}</td>
                <td className="px-5 py-5">{member.email}</td>
                <td className="px-5 py-5">
                  <span className={`px-2 py-1 rounded ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-5 py-5">৳{member.fixedDeposit.toLocaleString()}</td>
                <td className="px-5 py-5">
                  {member.status !== 'active' && (
                    <button 
                      onClick={() => approveMember(member.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Approve
                    </button>
                  )}
                  <button 
                    onClick={() => deleteMember(member.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMembers;