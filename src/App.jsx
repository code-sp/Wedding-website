import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ImageProvider, useImageContext } from './context/ImageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Contact from './components/Contact';
import Home from './components/Home';
import Events from './components/Events';
import FamilyTree from './components/FamilyTree';
import Registration from './components/Registration';
import Story from './components/Story';
import Gallery from './components/Gallery';
import LandingPage from './components/LandingPage';
import GuestDirectory from './components/GuestDirectory';
import ClientDirectory from './components/ClientDirectory';
import PortalSettings from './components/PortalSettings';
import ErrorBoundary from './components/ErrorBoundary';

// Route Guard for Admin Only
const AdminRoute = ({ children }) => {
    const { isAdmin, loading } = useAuth();
    if (loading) return null;
    return isAdmin ? children : <Navigate to="/" />;
};

// Route Guard for Admin or Client
const PortalManagementRoute = ({ children }) => {
    const { isAdmin, isClient, loading } = useAuth();
    if (loading) return null;
    return (isAdmin || isClient) ? children : <Navigate to="/" />;
};

// Guard to prevent access to disabled tabs
const TabGuard = ({ id, children }) => {
    const { settings, loading: contentLoading } = useImageContext();
    const { isAdmin, loading: authLoading } = useAuth();
    
    if (contentLoading || authLoading) return null;
    
    if (isAdmin) return children;

    const enabledTabs = settings?.enabledTabs || [];
    return enabledTabs.includes(id) ? children : <Navigate to="/" />;
};

const RootRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return isAuthenticated ? <Home /> : <LandingPage />;
};

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ImageProvider>
                    <Router>
                        <div className="flex flex-col min-h-screen relative">
                            <main className="flex-grow">
                                <Routes>
                                    <Route path="/" element={<RootRoute />} />
                                    <Route path="/registration" element={<Registration />} />

                                    {/* Protected / Semi-Protected Routes with TabGuard */}
                                    <Route path="/home" element={<ProtectedRoute><TabGuard id="home"><Home /></TabGuard></ProtectedRoute>} />
                                    <Route path="/story" element={<ProtectedRoute><TabGuard id="story"><Story /></TabGuard></ProtectedRoute>} />
                                    <Route path="/events" element={<ProtectedRoute><TabGuard id="events"><Events /></TabGuard></ProtectedRoute>} />
                                    <Route path="/gallery" element={<ProtectedRoute><TabGuard id="gallery"><Gallery /></TabGuard></ProtectedRoute>} />
                                    <Route path="/family-tree" element={<ProtectedRoute><TabGuard id="family_tree"><FamilyTree /></TabGuard></ProtectedRoute>} />
                                    <Route path="/contact" element={<ProtectedRoute><TabGuard id="contact"><Contact /></TabGuard></ProtectedRoute>} />

                                    {/* Client List */}
                                    <Route path="/rsvp-list" element={<PortalManagementRoute><GuestDirectory /></PortalManagementRoute>} />
                                    
                                    {/* Global Admin Portal */}
                                    <Route path="/master-directory" element={<AdminRoute><ClientDirectory /></AdminRoute>} />
                                    <Route path="/settings" element={<AdminRoute><PortalSettings /></AdminRoute>} />
                                </Routes>
                            </main>
                        </div>
                    </Router>
                </ImageProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
