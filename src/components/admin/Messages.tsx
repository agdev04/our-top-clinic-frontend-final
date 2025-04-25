import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components
import { AlertCircle } from 'lucide-react'; // Import an icon for the alert

type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_type: 'admin' | 'patient' | 'provider';
};

type User = {
  id: number;
  name: string;
  type: 'patient' | 'provider';
};

export default function Messages() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedType, setSelectedType] = useState<'patient' | 'provider'>('patient');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [messagesError, setMessagesError] = useState<string | null>(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [userData, setUserData] = useState<any>(null);
  const [newAddedMessage, setNewAddedMessage] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any>([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const token = await getToken()
        if (!token) return
        
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/me`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        setUserData(data.user)
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    
    fetchUserData()
  }, [selectedUser])

  // useEffect for fetching messages for the selected user
  useEffect(() => {
    if (!selectedUser) return;

    (async () => {
      setIsMessagesLoading(true);
      setMessagesError(null); // Clear previous message errors
      const token = await getToken();
      if (!token) {
        setMessagesError('Authentication token not available.');
        setIsMessagesLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/${selectedUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          setMessages([]);
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setMessagesError(err.message || 'An unexpected error occurred while fetching messages.');
      } finally {
        setIsMessagesLoading(false);
      }
    })();
  }, [selectedUser, newAddedMessage, getToken]);

  // useEffect for fetching initial users/contacts and recent messages
  useEffect(() => {
    const fetchData = async () => {
      // if (!selectedType) return; // Keep this if needed, but initial load should run
      setIsLoading(true);
      setError(null); // Clear general errors
      setUsers([]); // Clear previous users
      setRecentMessages([]); // Clear previous recent messages
      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error('Authentication token not available.');
        }

        // Fetch recent messages (parent messages)
        const messagesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/parent-messages/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!messagesResponse.ok) {
          // Handle recent messages fetch error separately if needed, or combine
          console.error('Failed to fetch recent messages'); 
          // Optional: throw new Error('Failed to fetch recent messages'); 
        } else {
          const messagesData = await messagesResponse.json();
          setRecentMessages(messagesData); 
        }


        // Fetch users based on selected type
        let usersResponse;
        if (selectedType === 'patient') {
          usersResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/?page=${page}&limit=${limit}${appliedSearch ? `&search=${encodeURIComponent(appliedSearch)}` : ''}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } else { // Assuming 'provider'
          usersResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/providers/`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }

        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch ${selectedType}s`);
        }

        const usersDataResponse = await usersResponse.json();
        
        const usersList = selectedType === 'patient' ? usersDataResponse.patients : usersDataResponse.providers;
        
        // Format users data
        const formattedUsers = usersList.map((user: any) => ({
          id: user.user_id,
          name: `${user.first_name} ${user.last_name}`,
          type: selectedType
        }));
        
        setUsers(formattedUsers);
      } catch (err: any) {
        console.error('Error fetching contacts data:', err);
        setError(err.message || 'An unexpected error occurred while fetching contacts.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  // Dependency array might need adjustment based on pagination logic not shown
  // Added getToken, selectedType, appliedSearch, page, limit. Check if page/limit changes should trigger this.
  }, [getToken, selectedType, appliedSearch, page, limit]);

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    
    // Consider adding loading state for sending message if needed
    // setSendMessageError(null); // Clear previous send errors

    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          content: newMessage
        })
      });

      if (!response.ok) {
        // Try to get error message from backend response
        let errorMsg = 'Failed to send message';
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (parseError) {
            // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }

      setNewAddedMessage((prev) => prev + 1) // Trigger refresh of messages
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err);
      // Optionally set a state to show send error to user, e.g., setSendMessageError(...)
      setError(err instanceof Error ? err.message : 'Failed to send message'); // Using general error for now
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[80vh] mt-10">
      <Card className="w-1/3 flex flex-col">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>Search and select a user to message</CardDescription>
          <div className="flex flex-col w-full gap-2">
            <Select 
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as 'patient' | 'provider')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patients</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
              </SelectContent>
            </Select>
            <div className='flex gap-x-2'>
            <Input 
              placeholder="Search contacts..." 
              className="w-full"
              onChange={(e) => {
                const inputValue = e.target.value.toLowerCase();
                setSearchTerm(inputValue);
              }}
            />
            <Button onClick={() => {
                setAppliedSearch(searchTerm);
            }}>
              Search
            </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {error && (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Contacts</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <p className='text-sm mt-5'>Recent Messages</p>
              <hr />
              <div className='mb-5' />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* User list rendering */}
              {users.length > 0 ? users.map(user => (
                <div 
                  key={user.id} 
                  className={`p-3 rounded-lg cursor-pointer ${selectedUser?.id === user.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500 capitalize">({user.type})</span>
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 text-center py-4">No {selectedType}s found.</p>}

              <p className='text-sm mt-5'>Recent Messages</p>
              <hr />
              <div className='mb-5' />

              {/* Recent messages list rendering */}
              {recentMessages.length > 0 ? recentMessages.map((user: any) => (
                  <div 
                  key={user.id} 
                  className={`p-3 rounded-lg cursor-pointer ${selectedUser?.id === user.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedUser(user)} // Assuming recent messages can also be selected
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-gray-500 capitalize">({user.role})</span>
                  </div>
                </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">No recent messages.</p>}
            </>
          )}
        </CardContent>
        {/* Pagination controls START */}
        <div className="flex items-center justify-between space-x-2 p-4 border-t">
          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                setPage(1); // Reset page when limit changes
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className='text-sm text-gray-500'>per page</span>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              // Disable 'Next' if the number of fetched users is less than the limit, 
              // indicating we are likely on the last page.
              disabled={!isLoading && users.length < limit} 
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {selectedUser ? (
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversation with {selectedUser.name}</CardTitle>
            <CardDescription>{selectedUser.type === 'patient' ? 'Patient' : 'Provider'}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {messagesError && (
               <Alert variant="destructive" className="mb-4">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Error Loading Messages</AlertTitle>
                 <AlertDescription>{messagesError}</AlertDescription>
               </Alert>
            )}
            {isMessagesLoading ? (
              <div className="space-y-4">
                  <div className="flex justify-start"><Skeleton className="h-12 w-3/5 rounded-xl" /></div>
                  <div className="flex justify-end"><Skeleton className="h-16 w-3/5 rounded-xl" /></div>
                  <div className="flex justify-start"><Skeleton className="h-10 w-2/5 rounded-xl" /></div>
              </div>
            ) : messages && messages.length > 0 ? (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`mb-4 flex flex-row ${msg?.sender_id ===  userData?.id ? 'justify-end' : 'justify-start'}`}
                  >
                   <div className={`p-3 rounded-xl ${msg?.sender_id ===  userData?.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                   <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg?.sender_id ===  userData?.id ? 'text-white' : 'text-gray-800'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                   </div>
                  </div>
                ))
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">No messages yet.</p>
            ) }
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" /> Send
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>Select a user to start messaging</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}