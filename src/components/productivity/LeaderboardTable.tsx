import React from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { ProductivityBadge } from './ProductivityBadge'

export interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  subtitle: string
  score: number
  avatarUrl?: string
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  title?: string
}

export function LeaderboardTable({ entries, title = "Top Performers" }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-amber-500" />
      case 2: return <Medal className="w-5 h-5 text-slate-400" />
      case 3: return <Award className="w-5 h-5 text-amber-700" />
      default: return <span className="text-sm font-bold text-slate-500">#{rank}</span>
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-[#0A1A2F]">{title}</h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 bg-white">
              <th className="px-6 py-4 font-semibold">Rank</th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold text-right">Score</th>
              <th className="px-6 py-4 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, _idx) => (
              <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100">
                    {getRankIcon(entry.rank)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {entry.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                        {entry.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{entry.name}</p>
                      <p className="text-xs text-slate-500">{entry.subtitle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-[#0A1A2F] text-lg">{entry.score.toFixed(0)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ProductivityBadge score={entry.score} />
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No ranking data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
