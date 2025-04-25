import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, FileText, MessageSquare, Pill, HeartPulse, Activity, Thermometer, User, ChevronRight } from 'lucide-react';

// Dummy patient data for mock UI
const patientData = {
  name: 'John',
  nextAppointment: {
    provider: 'Dr. Smith',
    date: 'May 15',
    daysToGo: 2,
  },
  summary: {
    upcomingAppointments: 2,
    nextAppointmentDate: 'Dr. Smith on May 15',
    medicalRecords: 5,
    lastRecordsUpdate: '3 days ago',
    unreadMessages: 3,
    unreadSource: 'Dr. Johnson, Lab Results',
    prescriptions: 2,
    refills: 1,
  },
  healthMetrics: {
    heartRate: 72,
    bloodPressure: '120/80',
    weight: 165,
    temperature: 98.6,
  },
  recentActivity: [
    {
      title: 'Lab Results Received',
      description: 'Your blood work results are now available',
      date: 'Today',
      icon: FileText,
    },
    {
      title: 'Appointment Confirmed',
      description: 'Your appointment with Dr. Smith has been confirmed',
      date: 'Yesterday',
      icon: Calendar,
    },
    {
      title: 'Prescription Refilled',
      description: 'Your prescription for Medication X has been refilled',
      date: 'May 10, 2023',
      icon: Pill,
    },
  ],
  reminders: [
    {
      title: 'Annual Physical',
      description: 'Schedule your annual physical examination',
      due: 'Due in 2 weeks',
      priority: 'High',
    },
    {
      title: 'Flu Vaccination',
      description: 'Seasonal flu vaccination recommended',
      due: 'Due now',
      priority: 'Medium',
    },
    {
      title: 'Dental Checkup',
      description: 'Regular dental checkup and cleaning',
      due: null,
      priority: '',
    },
  ],
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  if (!priority) return null;
  let bg = 'bg-red-100 text-red-700';
  if (priority === 'Medium') bg = 'bg-yellow-100 text-yellow-700';
  if (priority === 'Low') bg = 'bg-gray-100 text-gray-600';
  return <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${bg}`}>{priority} Priority</span>;
};

const PatientDashboardContent: React.FC = () => {
  return (
    <div className="space-y-8 mt-10">
      {/* Banner Greeting & Button */}
      <div className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 p-6 flex flex-col md:flex-row justify-between items-center text-white mb-6 shadow">
        <div>
          <div className="text-xl md:text-2xl font-bold mb-1">Good evening, {patientData.name}</div>
          <div>Your next appointment is in {patientData.nextAppointment.daysToGo} days with {patientData.nextAppointment.provider}</div>
        </div>
        <Button className="mt-4 md:mt-0 bg-white text-teal-600 font-semibold hover:bg-gray-100" variant="outline">View Appointments</Button>
      </div>
      {/* Overview Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
            <CardDescription className="flex justify-between items-center text-sm mt-2"><span className="text-2xl font-bold text-slate-800">{patientData.summary.upcomingAppointments}</span> <Calendar className="h-5 w-5 text-teal-500" /></CardDescription>
          </CardHeader>
          <CardContent className="text-gray-500 text-xs">Next: {patientData.summary.nextAppointmentDate}</CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Medical Records</CardTitle>
            <CardDescription className="flex justify-between items-center text-sm mt-2"><span className="text-2xl font-bold text-slate-800">{patientData.summary.medicalRecords}</span> <FileText className="h-5 w-5 text-teal-500" /></CardDescription>
          </CardHeader>
          <CardContent className="text-gray-500 text-xs">Last updated: {patientData.summary.lastRecordsUpdate}</CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Unread Messages</CardTitle>
            <CardDescription className="flex justify-between items-center text-sm mt-2"><span className="text-2xl font-bold text-slate-800">{patientData.summary.unreadMessages}</span> <MessageSquare className="h-5 w-5 text-teal-500" /></CardDescription>
          </CardHeader>
          <CardContent className="text-gray-500 text-xs">From: {patientData.summary.unreadSource}</CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Prescriptions</CardTitle>
            <CardDescription className="flex justify-between items-center text-sm mt-2"><span className="text-2xl font-bold text-slate-800">{patientData.summary.prescriptions}</span> <Pill className="h-5 w-5 text-teal-500" /></CardDescription>
          </CardHeader>
          <CardContent className="text-gray-500 text-xs">{patientData.summary.refills} refill needed</CardContent>
        </Card>
      </div>
      {/* Health Metrics Section */}
      <div className="bg-white rounded-lg p-5 shadow mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-base font-semibold">Health Metrics</span>
          <Button variant="link" className="text-teal-600 p-0 h-auto text-sm">View all <ChevronRight className="inline h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heart Rate</CardTitle><HeartPulse className="h-5 w-5 text-red-400" /></CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{patientData.healthMetrics.heartRate} <span className="text-xs font-normal text-gray-400">bpm</span></div><span className="text-xs text-green-600">Stable</span>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle><Activity className="h-5 w-5 text-blue-400" /></CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{patientData.healthMetrics.bloodPressure} <span className="text-xs font-normal text-gray-400">mmHg</span></div><span className="text-xs text-green-600">Improved</span>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weight</CardTitle><User className="h-5 w-5 text-purple-400" /></CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{patientData.healthMetrics.weight} <span className="text-xs font-normal text-gray-400">lbs</span></div><span className="text-xs text-red-600">Decreased</span>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gray-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle><Thermometer className="h-5 w-5 text-orange-400" /></CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{patientData.healthMetrics.temperature} <span className="text-xs font-normal text-gray-400">°F</span></div><span className="text-xs text-green-600">Stable</span>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Two Column Recent Activity & Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-5 shadow">
          <div className="flex justify-between mb-2 items-center"><span className="font-semibold">Recent Activity</span><Button variant="link" className="text-teal-600 p-0 h-auto text-sm">View all <ChevronRight className="inline h-4 w-4" /></Button></div>
          <div className="flex flex-col gap-4 mt-2">
            {patientData.recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="rounded-full bg-gray-100 p-2"><item.icon className="w-5 h-5 text-teal-400" /></span>
                <div className="flex-grow">
                  <div className="text-sm font-medium text-slate-800">{item.title}</div>
                  <div className="text-xs text-gray-500 mb-0.5">{item.description}</div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">{item.date}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Health Reminders */}
        <div className="bg-white rounded-lg p-5 shadow">
          <div className="flex justify-between mb-2 items-center"><span className="font-semibold">Health Reminders</span><Button variant="link" className="text-teal-600 p-0 h-auto text-sm">View all <ChevronRight className="inline h-4 w-4" /></Button></div>
          <div className="flex flex-col gap-4 mt-2">
            {patientData.reminders.map((r, i) => (
              <div key={i} className="flex flex-row items-center gap-3">
                <div className="flex flex-col flex-grow">
                  <div className="text-sm font-medium text-slate-800 flex items-center">{r.title}{r.priority && <PriorityBadge priority={r.priority} />}</div>
                  <div className="text-xs text-gray-500">{r.description}</div>
                  <div className="text-xs text-gray-400">{r.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardContent;