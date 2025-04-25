import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert components

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
  role: 'patient' | 'provider';

};

export default function Messages() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Removed selectedType, searchTerm, appliedSearch, page, limit state variables as they are not used in this component
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Loading state for recent messages list
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); // Loading state for conversation messages
  const [error, setError] = useState<string | null>(null); // Error state for recent messages list
  const [messagesError, setMessagesError] = useState<string | null>(null); // Error state for conversation messages
  const [userData, setUserData] = useState<any>(null);
  const [newAddedMessage, setNewAddedMessage] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any>([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const token = await getToken()
        if (!token) return
        
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/me/`;
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

  useEffect(() => {
    if (!selectedUser) return;
    (async () => {
      setIsMessagesLoading(true); // Set message loading state
      setMessagesError(null); // Clear previous message errors
      const token = await getToken();
      if (!token) {
        setMessagesError('Authentication token not available.'); // Set message error state
        setIsMessagesLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/${selectedUser?.id}`, {
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
        setMessagesError(err.message || 'An unexpected error occurred while fetching messages.'); // Set message error state
      } finally {
        setIsMessagesLoading(false); // Clear message loading state
      }
    })();
  }, [selectedUser, newAddedMessage, getToken]); // Added getToken to dependencies

  useEffect(() => {
    const fetchData = async () => {
      // Removed dependency on selectedType as it's not used for fetching recent messages here
      setIsLoading(true);
      setError(null);
      setRecentMessages([]); // Clear recent messages on new fetch
      try {
        const token = await getToken();

        if (!token) {
          throw new Error('Authentication token not available.');
        }

        // Fetch recent parent messages
        const messagesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/messages/parent-messages/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!messagesResponse.ok) {
           // It's better to throw an error to be caught below
           const errorData = await messagesResponse.text(); // or .json() if applicable
           console.error('Failed to fetch recent messages:', errorData);
           throw new Error('Failed to fetch recent messages');
        }

        const messagesData = await messagesResponse.json();

        // Check if messagesData is an array before setting state
        if (Array.isArray(messagesData)) {
            setRecentMessages(messagesData);
        } else {
            console.error('Received non-array data for recent messages:', messagesData);
            setRecentMessages([]); // Set to empty array if data is not as expected
            // Optionally set an error state here as well
            // setError('Received unexpected data format for recent messages.');
        }

      } catch (err: any) {
        console.error('Error fetching recent messages:', err);
        setError(err.message || 'An unexpected error occurred while fetching recent messages.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getToken]); // Removed selectedType, appliedSearch from dependencies

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    
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
        throw new Error('Failed to send message');
      }

      setNewAddedMessage((prev) => prev + 1)
      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[80vh] mt-10">
      <Card className="w-1/3 flex flex-col">
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Select a user to start messaging</CardDescription>
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
            </div>
          ) : recentMessages.length > 0 ? (
            recentMessages.map((user: any) => (
              <div
                key={`${user.role}-${user.id}`} // Use a more unique key if possible
                className={`p-3 rounded-lg cursor-pointer ${selectedUser?.id === user.id ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500 capitalize">({user.role})</span>
                </div>
              </div>
            ))
          ) : (
            !error && <p className="text-sm text-gray-500 text-center py-4">No recent messages found.</p> // Show only if no error
          )}
        </CardContent>
      </Card>

      {selectedUser ? (
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversation with {selectedUser.name}</CardTitle>
            {/* Display role if type is not available */}
            <CardDescription>{selectedUser.role === 'patient' ? 'Patient' : selectedUser.role === 'provider' ? 'Provider' : 'User'}</CardDescription>
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
                    className={`mb-4 flex flex-row ${msg?.sender_id === userData?.id ? 'justify-end' : 'justify-start'}`}
                  >
                   <div className={`p-3 rounded-xl ${msg?.sender_id === userData?.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                   <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg?.sender_id === userData?.id ? 'text-white' : 'text-gray-800'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                   </div>
                  </div>
                ))
            ) : (
              !messagesError && <p className="text-sm text-gray-500 text-center py-4">No messages yet.</p> // Show only if no error
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