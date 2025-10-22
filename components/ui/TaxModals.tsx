import React, { useState } from 'react';
import { useToast } from './ToastProvider';

export function ScenarioLabModal({ 
  isOpen, 
  onClose, 
  opportunity 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  opportunity?: any; 
}) {
  const [scenario, setScenario] = useState({
    name: opportunity?.title || 'Quick Scenario',
    revenue_change: 0,
    expense_change: 0,
    timing_change: 'immediate'
  });
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleRun = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      success('Scenario Analysis Complete', `${scenario.name}: Potential tax impact of $${Math.abs(scenario.revenue_change * 0.15).toLocaleString()}`);
      onClose();
    } catch (e) {
      error('Scenario Failed', 'Unable to run scenario analysis');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tax Scenario Lab</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Scenario Name</label>
            <input 
              value={scenario.name}
              onChange={(e) => setScenario(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Revenue Impact ($)</label>
            <input 
              type="number"
              value={scenario.revenue_change}
              onChange={(e) => setScenario(prev => ({ ...prev, revenue_change: Number(e.target.value) }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expense Impact ($)</label>
            <input 
              type="number"
              value={scenario.expense_change}
              onChange={(e) => setScenario(prev => ({ ...prev, expense_change: Number(e.target.value) }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Timing</label>
            <select 
              value={scenario.timing_change}
              onChange={(e) => setScenario(prev => ({ ...prev, timing_change: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="immediate">Immediate</option>
              <option value="q4_2025">Q4 2025</option>
              <option value="q1_2026">Q1 2026</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              onClick={handleRun}
              disabled={loading}
              className="flex-1 bg-sky-600 text-white py-2 rounded hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Scenario'}
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReminderModal({ 
  isOpen, 
  onClose, 
  item 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  item?: any; 
}) {
  const [reminder, setReminder] = useState({
    title: item?.title || item?.text || 'Tax Task',
    due_date: '',
    priority: 'medium',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSave = async () => {
    if (!reminder.title || !reminder.due_date) {
      error('Validation Error', 'Title and due date are required');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('Reminder Created', `"${reminder.title}" scheduled for ${reminder.due_date}`);
      onClose();
    } catch (e) {
      error('Save Failed', 'Unable to create reminder');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Reminder</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              value={reminder.title}
              onChange={(e) => setReminder(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., File Section 179 documentation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input 
              type="date"
              value={reminder.due_date}
              onChange={(e) => setReminder(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select 
              value={reminder.priority}
              onChange={(e) => setReminder(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea 
              value={reminder.notes}
              onChange={(e) => setReminder(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full border rounded px-3 py-2 h-20"
              placeholder="Additional details..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-sky-600 text-white py-2 rounded hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Reminder'}
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}