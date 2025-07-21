import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Bell, 
  Send, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  MapPin,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  targetAudience: string[];
  targetRegions: string[];
  status: string;
  schedule: {
    publishAt: string;
    expireAt?: string;
  };
  createdBy: {
    name: string;
  };
  createdAt: string;
  deliveryStats: {
    totalRecipients: number;
    delivered: number;
    opened: number;
  };
  image?: string; // Added for carousel type
  targetUrl?: string; // Added for carousel type
}

interface Farmer {
  _id: string;
  name: string;
  email: string;
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  senderRole: string;
  receiverRole: string;
  content: string;
  createdAt: string;
}

const AdminCommunication = () => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [activeTab, setActiveTab] = useState('announcements');

  // Form state for new announcement
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '', // for carousel
    targetUrl: '', // for carousel
    type: 'general',
    priority: 'medium',
    targetAudience: ['all'],
    targetRegions: [],
    schedule: {
      publishAt: new Date().toISOString().slice(0, 16),
      expireAt: ''
    },
    delivery: {
      email: false,
      sms: false,
      push: true,
      inApp: true
    }
  });

  // Messaging state
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [unreadMessages, setUnreadMessages] = useState<{ [farmerId: string]: boolean }>({});

  // Persist active tab in localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('adminCommActiveTab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem('adminCommActiveTab', activeTab);
  }, [activeTab]);

  // Do not select any farmer by default
  useEffect(() => {
    setSelectedFarmer(null);
  }, [activeTab]);

  // Fetch messages only when a farmer is selected
  useEffect(() => {
    if (selectedFarmer) {
      fetchMessages(selectedFarmer._id);
    }
  }, [selectedFarmer]);

  // Scroll to bottom when messages change or farmer is selected
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, selectedFarmer]);

  // Filter and sort farmers
  const filteredFarmers = useMemo(() => {
    const search = farmerSearch.trim().toLowerCase();
    return farmers
      .filter(farmer =>
        farmer.name.toLowerCase().includes(search) ||
        farmer.email.toLowerCase().includes(search)
      )
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [farmers, farmerSearch]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (activeTab === 'direct') {
      fetchFarmers();
    }
  }, [activeTab]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/admin/communication/announcements');
      console.log('Full API response:', response);
      console.log('response.data:', response.data);
      console.log('response.data.docs:', response.data?.docs);
      setAnnouncements(response.data?.docs || []);
      toast.dismiss('announcements-error');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.', { id: 'announcements-error' });
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to view announcements.', { id: 'announcements-error' });
      } else {
        toast.error('Failed to load announcements', { id: 'announcements-error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const res = await apiService.get('/admin/farmers?limit=100');
      console.log('Farmers API response:', res);
      // Try both possible response paths
      const farmersList = res.data?.data?.docs || res.data?.docs || [];
      setFarmers(farmersList);
    } catch (err) {
      toast.error('Failed to load farmers');
    } finally {
      setLoadingFarmers(false);
    }
  };

  const fetchMessages = async (farmerId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiService.get(`/messages?userId=${user.id}&partnerId=${farmerId}`);
      setMessages(res.data.data || res.data || []);
      setUnreadMessages(prev => ({ ...prev, [farmerId]: false })); // Mark as read after fetching
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const payload = {
        ...formData,
        targetCategories: [],
        visibility: 'public',
        tags: [],
        schedule: {
          ...formData.schedule,
          publishAt: new Date(formData.schedule.publishAt).toISOString(),
        },
        image: formData.type === 'carousel' ? formData.image : undefined,
        targetUrl: formData.type === 'carousel' ? formData.targetUrl : undefined,
        status: formData.type === 'carousel' ? 'active' : undefined
      };
      await apiService.post('/admin/communication/announcements', payload);
      toast.success('Announcement created successfully!');
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        content: '',
        image: '',
        targetUrl: '',
        type: 'general',
        priority: 'medium',
        targetAudience: ['all'],
        targetRegions: [],
        schedule: {
          publishAt: new Date().toISOString().slice(0, 16),
          expireAt: ''
        },
        delivery: {
          email: false,
          sms: false,
          push: true,
          inApp: true
        }
      });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    
    try {
      const payload = {
        ...formData,
        image: formData.type === 'carousel' ? formData.image : undefined,
        targetUrl: formData.type === 'carousel' ? formData.targetUrl : undefined,
      };
      await apiService.put(`/admin/communication/announcements/${editingAnnouncement._id}`, payload);
      toast.success('Announcement updated successfully!');
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        image: '',
        targetUrl: '',
        type: 'general',
        priority: 'medium',
        targetAudience: ['all'],
        targetRegions: [],
        schedule: {
          publishAt: new Date().toISOString().slice(0, 16),
          expireAt: ''
        },
        delivery: {
          email: false,
          sms: false,
          push: true,
          inApp: true
        }
      });
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await apiService.delete(`/admin/communication/announcements/${id}`);
      toast.success('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleApproveAnnouncement = async (id: string) => {
    try {
      await apiService.post(`/admin/communication/announcements/${id}/approve`, {
        notes: 'Approved by admin'
      });
      toast.success('Announcement approved successfully!');
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to approve announcement');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedFarmer || !messageInput.trim()) return;
    try {
      await apiService.post('/messages', {
        senderId: user.id,
        receiverId: selectedFarmer._id,
        senderRole: 'Admin',
        receiverRole: 'Farmer',
        content: messageInput.trim(),
      });
      setMessageInput('');
      fetchMessages(selectedFarmer._id);
      setUnreadMessages(prev => ({ ...prev, [selectedFarmer._id]: true })); // Mark as unread after sending
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      image: announcement.image || '',
      targetUrl: announcement.targetUrl || '',
      type: announcement.type,
      priority: announcement.priority || 'medium',
      targetAudience: announcement.targetAudience,
      targetRegions: announcement.targetRegions,
      schedule: {
        publishAt: new Date(announcement.schedule.publishAt).toISOString().slice(0, 16),
        expireAt: announcement.schedule.expireAt ? new Date(announcement.schedule.expireAt).toISOString().slice(0, 16) : ''
      },
      delivery: {
        email: false,
        sms: false,
        push: true,
        inApp: true
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Communication Management</h2>
          <p className="text-gray-600">Manage announcements, direct messages, and notifications</p>
        </div>
      </div>
      <Tabs defaultValue="announcements" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="direct">Direct Messaging</TabsTrigger>
          <TabsTrigger value="notifications">System Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements">
          {/* Existing Announcements UI */}
          <div className="flex justify-end mb-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Announcement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter announcement title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter announcement content"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="price_update">Price Update</SelectItem>
                          <SelectItem value="crop_ban">Crop Ban</SelectItem>
                          <SelectItem value="harvest_schedule">Harvest Schedule</SelectItem>
                          <SelectItem value="weather_alert">Weather Alert</SelectItem>
                          <SelectItem value="system_maintenance">System Maintenance</SelectItem>
                          <SelectItem value="carousel">Carousel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {formData.type === 'carousel' && (
                    <>
                      <div>
                        <Label htmlFor="carousel-image">Image</Label>
                        <Input
                          id="carousel-image"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setFormData({ ...formData, image: ev.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="carousel-target-url">Target URL</Label>
                        <Input
                          id="carousel-target-url"
                          type="url"
                          placeholder="https://..."
                          value={formData.targetUrl}
                          onChange={e => setFormData({ ...formData, targetUrl: e.target.value })}
                          required={formData.type === 'carousel'}
                        />
                      </div>
                      {formData.image && (
                        <div className="relative mt-4 w-full h-48 rounded-xl overflow-hidden shadow border">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 w-full p-4 bg-black bg-opacity-50 text-white">
                            <div className="text-xl font-bold">{formData.title || 'Title here'}</div>
                            <div className="text-base">{formData.content || 'Description here'}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div>
                    <Label htmlFor="publishAt">Publish Date</Label>
                    <Input
                      id="publishAt"
                      type="datetime-local"
                      value={formData.schedule.publishAt}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        schedule: { ...formData.schedule, publishAt: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAnnouncement}>
                      <Send className="w-4 h-4 mr-2" />
                      Create Announcement
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Announcements ({announcements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{announcement.title || 'Untitled'}</h3>
                          <Badge className={getPriorityColor(announcement.priority)}>
                            {announcement.priority || 'N/A'}
                          </Badge>
                          <Badge className={getStatusColor(announcement.status)}>
                            {announcement.status || 'N/A'}
                          </Badge>
                        </div>
                        {announcement.type === 'carousel' && announcement.image && (
                          <img src={announcement.image} alt="Carousel" className="mb-2 rounded shadow max-h-32" />
                        )}
                        <p className="text-gray-600 text-sm mb-2">{announcement.content || ''}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {(announcement.targetAudience || []).join(', ')}
                          </span>
                          {announcement.targetRegions && announcement.targetRegions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {announcement.targetRegions.join(', ')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {announcement.schedule && announcement.schedule.publishAt
                              ? new Date(announcement.schedule.publishAt).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {announcement.status === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => handleApproveAnnouncement(announcement._id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Delivery Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2">
                      <span>Recipients: {announcement.deliveryStats?.totalRecipients ?? 0}</span>
                      <span>Delivered: {announcement.deliveryStats?.delivered ?? 0}</span>
                      <span>Opened: {announcement.deliveryStats?.opened ?? 0}</span>
                    </div>
                  </div>
                ))}
                
                {announcements.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p>No announcements found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Direct Messaging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Farmer List */}
                <div className="w-1/3 border-r pr-4 max-h-96 overflow-y-auto">
                  <h4 className="font-semibold mb-2">Farmers</h4>
                  <Input
                    className="mb-2"
                    placeholder="Search farmers..."
                    value={farmerSearch}
                    onChange={e => setFarmerSearch(e.target.value)}
                  />
                  {loadingFarmers ? (
                    <div>Loading...</div>
                  ) : (
                    <ul>
                      {filteredFarmers.map(farmer => (
                        <li
                          key={farmer._id}
                          className={`p-2 rounded cursor-pointer ${selectedFarmer?._id === farmer._id ? 'bg-green-100' : ''}`}
                          onClick={() => setSelectedFarmer(farmer)}
                        >
                          <span className="font-medium">{farmer.name}</span>
                          {unreadMessages[farmer._id] && (
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                          )}
                          <span className="block text-xs text-gray-500">{farmer.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Conversation */}
                <div className="flex-1 flex flex-col h-96">
                  {selectedFarmer ? (
                    <>
                      <div className="border-b pb-2 mb-2">
                        <h4 className="font-semibold">Conversation with {selectedFarmer.name}</h4>
                      </div>
                      <div ref={messageListRef} className="flex-1 overflow-y-auto mb-2 bg-gray-50 p-2 rounded">
                        {loadingMessages ? (
                          <div>Loading...</div>
                        ) : (
                          <ul className="space-y-2">
                            {messages.map(msg => (
                              <li key={msg._id} className={`flex ${msg.sender === user.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg ${msg.sender === user.id ? 'bg-green-200' : 'bg-gray-200'}`}>
                                  <span className="block text-sm">{msg.content}</span>
                                  <span className="block text-xs text-gray-500 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={messageInput}
                          onChange={e => setMessageInput(e.target.value)}
                          placeholder="Type your message..."
                          onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                        />
                        <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Select a farmer to start conversation</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                System Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 py-8 text-center">
                Coming soon: View and send system-wide notifications to users.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 py-8 text-center">
                Coming soon: Manage reusable message templates for announcements and alerts.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter announcement content"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="price_update">Price Update</SelectItem>
                    <SelectItem value="crop_ban">Crop Ban</SelectItem>
                    <SelectItem value="harvest_schedule">Harvest Schedule</SelectItem>
                    <SelectItem value="weather_alert">Weather Alert</SelectItem>
                    <SelectItem value="system_maintenance">System Maintenance</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.type === 'carousel' && (
              <>
                <div>
                  <Label htmlFor="edit-carousel-image">Image</Label>
                  <Input
                    id="edit-carousel-image"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setFormData({ ...formData, image: ev.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Carousel Preview" className="mt-2 rounded shadow max-h-40" />
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-carousel-target-url">Target URL</Label>
                  <Input
                    id="edit-carousel-target-url"
                    type="url"
                    placeholder="https://..."
                    value={formData.targetUrl}
                    onChange={e => setFormData({ ...formData, targetUrl: e.target.value })}
                    required={formData.type === 'carousel'}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAnnouncement}>
                <Edit className="w-4 h-4 mr-2" />
                Update Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCommunication; 