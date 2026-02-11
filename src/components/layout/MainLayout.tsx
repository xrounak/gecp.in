import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AccessibilityControls from './AccessibilityControls';

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900">
            <AccessibilityControls />
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
