import { useImageContext } from '../context/ImageContext';
import { Settings, Check, X, ShieldAlert } from 'lucide-react';
import PageLayout from './PageLayout';

const ALL_TABS = [
    { id: 'home', label: 'Home Dashboard' },
    { id: 'story', label: 'Our Story' },
    { id: 'events', label: 'Events' },
    { id: 'family_tree', label: 'Family Tree' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Contact' }
];

const PortalSettings = () => {
    const { settings, updateSettings } = useImageContext();
    const enabledTabs = settings?.enabledTabs || [];

    const toggleTab = (tabId) => {
        const newTabs = enabledTabs.includes(tabId) 
            ? enabledTabs.filter(t => t !== tabId)
            : [...enabledTabs, tabId];
            
        updateSettings({ ...settings, enabledTabs: newTabs });
    };

    return (
        <PageLayout backgroundText="settings">
            <div className="w-full h-full overflow-y-auto custom-scrollbar relative z-10 p-6 md:p-12">
                <div className="max-w-4xl mx-auto space-y-10">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/15 text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mb-4 shadow-sm backdrop-blur-md">
                                Portal Admin
                            </span>
                            <h2 className="font-display font-bold text-4xl lg:text-5xl text-white tracking-tighter">
                                Portal <span className="text-white/50 italic font-light">Settings</span>
                            </h2>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings className="text-white/50" />
                            <h3 className="text-xl font-bold text-white">Module Configuration</h3>
                        </div>
                        <p className="text-white/40 text-sm mb-6 max-w-2xl">
                            Toggle which tabs and features are visible to your guests. Changes save automatically. Admin users can always see all tabs.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ALL_TABS.map(tab => {
                                const isEnabled = enabledTabs.includes(tab.id);
                                return (
                                    <button 
                                        key={tab.id}
                                        onClick={() => toggleTab(tab.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                            isEnabled 
                                                ? 'bg-white/10 border-white/30 hover:bg-white/20' 
                                                : 'bg-black/20 border-white/5 hover:border-white/10 opacity-60'
                                        }`}
                                    >
                                        <span className={`font-bold ${isEnabled ? 'text-white' : 'text-white/40'}`}>
                                            {tab.label}
                                        </span>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                            isEnabled ? 'bg-green-500 text-white' : 'bg-white/10 text-transparent'
                                        }`}>
                                            {isEnabled && <Check size={14} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </PageLayout>
    );
};

export default PortalSettings;
