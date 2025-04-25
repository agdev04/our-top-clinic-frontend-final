import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, DollarSign, Star } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const summaryData = [
  { title: 'Appointments', value: '8', change: '+12%', icon: <Calendar className="h-6 w-6 text-blue-500" />, changeColor: 'text-green-600' },
  { title: 'Patients', value: '24', change: '+4%', icon: <Users className="h-6 w-6 text-purple-500" />, changeColor: 'text-green-600' },
  { title: 'Earnings', value: '$1,240', change: '+8%', icon: <DollarSign className="h-6 w-6 text-green-500" />, changeColor: 'text-green-600' },
  { title: 'Rating', value: '4.8/5', change: 'Based on 56 reviews', icon: <Star className="h-6 w-6 text-yellow-500" />, changeColor: 'text-gray-500' },
];
 
const upcomingAppointments = [
  { name: 'John Smith', time: 'Today at 10:00 AM', type: 'Video Consultation', status: 'Confirmed' },
  { name: 'Sarah Johnson', time: 'Today at 2:30 PM', type: 'In-Person Visit', status: 'Confirmed' },
  { name: 'Michael Brown', time: 'Tomorrow at 11:15 AM', type: 'Video Consultation', status: 'Pending' },
];

const recentPatients = [
  { name: 'Emma Wilson', lastVisit: '2 days ago', condition: 'Hypertension' },
  { name: 'Robert Garcia', lastVisit: '1 week ago', condition: 'Diabetes Type 2' },
  { name: 'Jennifer Lee', lastVisit: '2 weeks ago', condition: 'Anxiety' },
];

const recentMessages = [
  { name: 'Sarah Johnson', time: '10:23 AM', preview: 'Regarding my upcoming appointment...' },
  // Add more messages if needed
];

const DashboardContent: React.FC = () => {
  // Mock data - replace with actual data from props or API
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Welcome back, Dr. Richard</h1>
          <p className="text-sm text-gray-500">Here's what's happening with your practice today.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Day</Button>
          <Button variant="outline" size="sm">Week</Button>
          <Button variant="default" size="sm" className="bg-[#14B8A6] hover:bg-[#0F9D8B]">Month</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map((item, index) => (
          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{item.title}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{item.value}</div>
              <p className={`text-xs ${item.changeColor}`}>
                {item.change}
                {item.title !== 'Rating' && ' from last month'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">Upcoming Appointments</CardTitle>
            <Button variant="link" size="sm" className="text-[#14B8A6] hover:text-[#0F9D8B]">View All &gt;</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((appt, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div> {/* Placeholder for avatar */}
                  <div>
                    <p className="font-medium text-gray-700">{appt.name}</p>
                    <p className="text-xs text-gray-500">{appt.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{appt.type}</p>
                  <Badge 
                    variant={appt.status === 'Confirmed' ? 'default' : 'secondary'} 
                    className={`${appt.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {appt.status}
                  </Badge>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button variant="outline" size="sm">Reschedule</Button>
                  <Button variant="default" size="sm" className="bg-[#14B8A6] hover:bg-[#0F9D8B]">Start Session</Button>
                </div>
              </div>
            ))}
            <div className="text-center mt-4">
              <Button variant="link" className="text-[#14B8A6] hover:text-[#0F9D8B]">Manage Your Schedule</Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar (Recent Patients & Messages) */}
        <div className="space-y-6">
          {/* Recent Patients */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Patients</CardTitle>
              <Button variant="link" size="sm" className="text-[#14B8A6] hover:text-[#0F9D8B]">View All &gt;</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPatients.map((patient, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 border-b last:border-b-0">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div> {/* Placeholder */}
                  <div>
                    <p className="font-medium text-sm text-gray-700">{patient.name}</p>
                    <p className="text-xs text-gray-500">Last visit: {patient.lastVisit}</p>
                    <p className="text-xs text-gray-500">Condition: {patient.condition}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">Recent Messages</CardTitle>
              <Button variant="link" size="sm" className="text-[#14B8A6] hover:text-[#0F9D8B]">View All &gt;</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMessages.map((message, index) => (
                 <div key={index} className="flex items-start space-x-3 p-2 border-b last:border-b-0">
                 <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div> {/* Placeholder */}
                 <div>
                   <p className="font-medium text-sm text-gray-700">{message.name}</p>
                   <p className="text-xs text-gray-500">{message.time}</p>
                   {/* <p className="text-xs text-gray-600 truncate w-48">{message.preview}</p> */}
                 </div>
               </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
