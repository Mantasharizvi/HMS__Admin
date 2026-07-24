import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import StatCard from '../../components/dashboard/StatCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import AppointmentChart from '../../components/dashboard/AppointmentChart';
import DepartmentLoadChart from '../../components/dashboard/DepartmentLoadChart';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import QuickWidgets from '../../components/dashboard/QuickWidgets';
import DashboardToolbar from '../../components/dashboard/DashboardToolbar';
import RecentPatientsTable from '../../components/dashboard/RecentPatientsTable';
import ExportReportModal from '../../components/reports/ExportReportModal';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const statusLabel = { success: 'Stable', warning: 'Observation', danger: 'Critical' };
const APPOINTMENT_STATUS_COLORS = { Completed: '#218A5D', Confirmed: '#14899E', Pending: '#B87A17', Cancelled: '#C7423C' };

// Cutoff, in days, for each "Recently Admitted" date-range filter option.
const RANGE_DAYS = { Today: 0, 'Last 7 days': 7, 'Last 30 days': 30, 'This year': 365 };

/** True when `dateStr` falls within `range` days of today (inclusive). */
function isWithinRange(dateStr, range) {
  const days = RANGE_DAYS[range];
  if (days === undefined) return true;
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - date) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

export default function Dashboard() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [range, setRange] = useState('Last 7 days');
  const [showExportModal, setShowExportModal] = useState(false);

  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState({ labels: [], datasets: [] });
  const [appointmentStatus, setAppointmentStatus] = useState({ labels: [], values: [], colors: [] });
  const [departmentLoad, setDepartmentLoad] = useState({ labels: [], values: [] });
  const [notifications, setNotifications] = useState([]);
  const [quickWidgets, setQuickWidgets] = useState({ upcomingAppointments: [], expiringMedicines: [] });
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data.data)).catch(() => toast.error('Could not load dashboard stats'));

    api.get('/dashboard/revenue-chart').then((res) => {
      const { labels, opd, ipd, pharmacy } = res.data.data;
      setRevenueChart({
        labels,
        datasets: [
          { label: 'OPD', data: opd, color: '#14899E' },
          { label: 'IPD', data: ipd, color: '#0B5566' },
          { label: 'Pharmacy', data: pharmacy, color: '#B87A17' },
        ],
      });
    }).catch(() => {});

    api.get('/dashboard/appointment-status').then((res) => {
      const rows = res.data.data;
      setAppointmentStatus({
        labels: rows.map((r) => r._id),
        values: rows.map((r) => r.count),
        colors: rows.map((r) => APPOINTMENT_STATUS_COLORS[r._id] || '#94A3B8'),
      });
    }).catch(() => {});

    api.get('/dashboard/department-load').then((res) => {
      const rows = res.data.data.filter((r) => r._id);
      setDepartmentLoad({ labels: rows.map((r) => r._id), values: rows.map((r) => r.count) });
    }).catch(() => {});

    api.get('/dashboard/notifications').then((res) => {
      setNotifications(res.data.data.map((n) => ({
        ...n,
        time: new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      })));
    }).catch(() => {});

    api.get('/dashboard/quick-widgets').then((res) => setQuickWidgets(res.data.data)).catch(() => {});

    api.get('/dashboard/recent-patients').then((res) => setRecentPatients(res.data.data)).catch(() => toast.error('Could not load recent admissions'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { id: 'patients', label: 'Total Patients', value: stats.totalPatients.toLocaleString('en-IN'), icon: 'Users', accent: '#0B5566' },
      { id: 'beds', label: 'Occupied Beds', value: `${stats.occupiedBeds} / ${stats.totalBeds}`, icon: 'BedDouble', accent: '#218A5D' },
      { id: 'appointments', label: "Today's Appointments", value: String(stats.todayAppointments), icon: 'CalendarCheck', accent: '#B87A17' },
      { id: 'bills', label: 'Pending Bills', value: `${stats.pendingBillsCount} unpaid`, icon: 'ReceiptIndianRupee', accent: '#C7423C' },
    ];
  }, [stats]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return recentPatients.filter((p) => {
      const matchesSearch =
        !term || p.name.toLowerCase().includes(term) || p.doctor.toLowerCase().includes(term);
      const matchesDept = department === 'All Departments' || p.department === department;
      const matchesRange = isWithinRange(p.date, range);
      return matchesSearch && matchesDept && matchesRange;
    });
  }, [search, department, range, recentPatients]);

  // Same shape the export modal/util expects: [{ key, header }] + plain row objects.
  const exportColumns = [
    { key: 'name', header: 'Patient' },
    { key: 'doctor', header: 'Doctor' },
    { key: 'department', header: 'Department' },
    { key: 'ward', header: 'Ward / Bed' },
    { key: 'date', header: 'Date' },
    { key: 'statusLabel', header: 'Condition' },
  ];
  const exportRows = filteredPatients.map((p) => ({ ...p, statusLabel: statusLabel[p.status] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-600 mt-1">Overview of today's hospital activity.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.id} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
        ))}
      </div>

      {/* Revenue + Appointment status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Revenue Overview" className="xl:col-span-2">
          <RevenueChart labels={revenueChart.labels} datasets={revenueChart.datasets} />
        </Card>
        <Card title="Appointment Status">
          <AppointmentChart labels={appointmentStatus.labels} values={appointmentStatus.values} colors={appointmentStatus.colors} />
        </Card>
      </div>

      {/* Department load + Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Patient Load by Department" className="xl:col-span-2">
          <DepartmentLoadChart labels={departmentLoad.labels} values={departmentLoad.values} />
        </Card>
        <NotificationsPanel items={notifications} />
      </div>

      {/* Quick widgets */}
      <QuickWidgets
        upcomingAppointments={quickWidgets.upcomingAppointments}
        expiringMedicines={quickWidgets.expiringMedicines}
      />

      {/* Recent patients: search + filter + table */}
      <Card title="Recently Admitted">
        <div className="mb-4">
          <DashboardToolbar
            search={search}
            onSearchChange={setSearch}
            department={department}
            onDepartmentChange={setDepartment}
            range={range}
            onRangeChange={setRange}
            onExport={() => setShowExportModal(true)}
          />
        </div>
        <RecentPatientsTable data={filteredPatients} />
      </Card>

      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Recently Admitted"
        columns={exportColumns}
        rows={exportRows}
      />
    </div>
  );
}
