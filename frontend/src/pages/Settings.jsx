import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        finePerDay: 2.00,
        maxFine: 50.00,
        gracePeriod: true,
        studentLimit: 5,
        facultyLimit: 10,
        staffLimit: 7,
        loanPeriod: 14,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await adminAPI.getSettings();
            // data is an array of roles: [{role_name: 'student', max_books: 5, due_days: 14, fine_rate: 2, max_fine_cap: 50, grace_days: 1}, ...]

            const newSettings = { ...settings };

            data.forEach(role => {
                if (role.role_name === 'student') newSettings.studentLimit = role.max_books;
                if (role.role_name === 'faculty') newSettings.facultyLimit = role.max_books;
                if (role.role_name === 'staff') newSettings.staffLimit = role.max_books;

                // Use student role values as the global standard for the unified UI
                if (role.role_name === 'student') {
                    newSettings.loanPeriod = role.due_days;
                    newSettings.finePerDay = parseFloat(role.fine_rate).toFixed(2);
                    newSettings.maxFine = parseFloat(role.max_fine_cap).toFixed(2);
                    newSettings.gracePeriod = role.grace_days > 0;
                }
            });

            setSettings(newSettings);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load settings');
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminAPI.updateSettings({
                finePerDay: parseFloat(settings.finePerDay),
                maxFine: parseFloat(settings.maxFine),
                gracePeriod: settings.gracePeriod,
                studentLimit: parseInt(settings.studentLimit),
                facultyLimit: parseInt(settings.facultyLimit),
                staffLimit: parseInt(settings.staffLimit),
                loanPeriod: parseInt(settings.loanPeriod)
            });
            toast.success('System settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1">Configure library system preferences</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition disabled:bg-blue-400"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Fine Configuration Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                            <span className="text-yellow-500">$</span> Fine Configuration
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 mb-6">Set late return penalties</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Fine Per Day ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.finePerDay}
                                    onChange={(e) => setSettings({ ...settings, finePerDay: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Fine ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.maxFine}
                                    onChange={(e) => setSettings({ ...settings, maxFine: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-slate-800 block">Grace Period</label>
                                <span className="text-sm text-slate-500">Allow 1 day grace before fines apply</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, gracePeriod: !settings.gracePeriod })}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${settings.gracePeriod ? 'bg-blue-600' : 'bg-slate-200'}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.gracePeriod ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loan Settings Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Loan Settings
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 mb-6">Configure borrowing limits</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Student Limit</label>
                                <input
                                    type="number"
                                    value={settings.studentLimit}
                                    onChange={(e) => setSettings({ ...settings, studentLimit: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Faculty Limit</label>
                                <input
                                    type="number"
                                    value={settings.facultyLimit}
                                    onChange={(e) => setSettings({ ...settings, facultyLimit: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Staff Limit</label>
                                <input
                                    type="number"
                                    value={settings.staffLimit}
                                    onChange={(e) => setSettings({ ...settings, staffLimit: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Loan Period (Days)</label>
                            <input
                                type="number"
                                value={settings.loanPeriod}
                                onChange={(e) => setSettings({ ...settings, loanPeriod: e.target.value })}
                                className="w-full md:w-1/3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            Notifications
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 mb-6">Email notification preferences</p>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-slate-800 block">Due Date Reminders</span>
                                    <span className="text-sm text-slate-500">Send an email when a book is due tomorrow</span>
                                </div>
                                <button
                                    type="button"
                                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-blue-600"
                                >
                                    <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                                </button>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-slate-800 block">Reservation Available</span>
                                    <span className="text-sm text-slate-500">Notify user when their reserved book is returned</span>
                                </div>
                                <button
                                    type="button"
                                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-blue-600"
                                >
                                    <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
