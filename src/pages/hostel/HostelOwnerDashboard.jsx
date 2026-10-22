import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HostelOwnerLayout, { NAV_ITEMS } from '../../components/hostelOwner/HostelOwnerLayout';
import OverviewSection from '../../components/hostelOwner/OverviewSection';
import ProfileSection from '../../components/hostelOwner/ProfileSection';
import ListingSection from '../../components/hostelOwner/ListingSection';
import StatusSection from '../../components/hostelOwner/StatusSection';
import { mockOwner, mockOverview, mockProfile, mockCampuses } from '../../components/hostelOwner/mockData';

export default function HostelOwnerDashboard() {
  const [active, setActive] = useState('overview');
  const navigate = useNavigate();

  const title = NAV_ITEMS.find((n) => n.id === active)?.label ?? 'Overview';

  // TODO: connect to AuthContext logout
  const handleSignOut = () => navigate('/login');

  return (
    <HostelOwnerLayout
      active={active}
      onNavigate={setActive}
      onSignOut={handleSignOut}
      owner={mockOwner}
      title={title}
    >
      {active === 'overview' ? (
        <OverviewSection data={mockOverview} onNavigate={setActive} />
      ) : active === 'profile' ? (
        <ProfileSection initial={mockProfile} campuses={mockCampuses} />
      ) : active === 'listing' ? (
        <ListingSection />
      ) : (
        <StatusSection />
      )}
    </HostelOwnerLayout>
  );
}