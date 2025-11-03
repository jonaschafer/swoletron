import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, ChevronDown, Calendar, Dumbbell, FileText, History } from 'lucide-react';

export default function PostLNFBlock() {
  const [view, setView] = useState('week');
  const [activeTab, setActiveTab] = useState('schedule');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const views = [
    { id: 'week', label: 'Week', progress: '4 of 12', miles: '41 miles' },
    { id: 'month', label: 'Month', progress: '1 of 3', miles: '164 miles' }
  ];
  
  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'plan', label: 'Plan', icon: FileText },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'history', label: 'History', icon: History }
  ];

  const currentView = views.find(v => v.id === view);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Post LNF</h1>
        
        <div className="flex items-center gap-2">
          {/* Miles Indicator */}
          <div className="h-8 px-3 bg-white rounded-lg flex items-center">
            <span className="text-slate-900 text-sm font-medium">{currentView.miles}</span>
          </div>
          
          {/* View Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 h-8 px-3 bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-700"
            >
              <span>{currentView.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden z-10">
                {views.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setView(v.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 ${
                      view === v.id ? 'bg-slate-700 text-white' : 'text-slate-300'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700">
            <Sun className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Navigation Panel */}
      <div className="mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 font-medium">
                Start
              </button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 text-center">
              <h2 className="text-sm sm:text-base font-semibold">Nov 3 - Nov 9</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="h-8 px-3 text-sm rounded-lg bg-slate-700 hover:bg-slate-600 font-medium">
                End
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-slate-800 p-1 rounded-lg flex gap-1 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-slate-800 rounded-xl p-6 min-h-[300px]">
        {activeTab === 'schedule' ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">This Week's Schedule</h3>
            <p className="text-slate-400">All workouts for Nov 3-9 appear here...</p>
          </div>
        ) : activeTab === 'plan' ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">12-Week Training Plan</h3>
            <p className="text-slate-400">Overall plan and reasoning (markdown) appears here...</p>
          </div>
        ) : activeTab === 'exercises' ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">Exercise Library</h3>
            <p className="text-slate-400">All exercises with descriptions (TBD)...</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-2">Training History</h3>
            <p className="text-slate-400">Past workouts and progress (TBD)...</p>
          </div>
        )}
      </div>
    </div>
  );
}