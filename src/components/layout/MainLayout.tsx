import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BackgroundTask from '@/components/BackgroundTask';

const MainLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <BackgroundTask />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
