'use client';

import { CircleUser } from 'lucide-react';

const contacts = [
  { name: '林小明', role: '產品經理', email: 'ming@example.com' },
  { name: '陳美華', role: '設計師', email: 'meihua@example.com' },
  { name: '王大偉', role: '工程師', email: 'dawei@example.com' },
  { name: '李雅婷', role: '行銷專員', email: 'yating@example.com' },
];

export default function PeoplePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <CircleUser className="w-8 h-8 text-[#8b5cf6]" />
          <h1 className="text-2xl font-bold text-[#e8e8ed]">人員</h1>
          <span className="bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full px-3 py-1 text-xs">
            即將推出
          </span>
        </div>
        <p className="text-[#8b8b9e] mb-8 ml-11">團隊成員與聯絡人管理</p>

        <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg divide-y divide-[#2a2a3a]">
          {contacts.map((contact) => (
            <div key={contact.name} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6] text-sm font-bold">
                {contact.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-[#e8e8ed] font-medium text-sm">{contact.name}</h3>
                <p className="text-[#5c5c72] text-xs">{contact.role}</p>
              </div>
              <span className="text-[#5c5c72] text-xs">{contact.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
