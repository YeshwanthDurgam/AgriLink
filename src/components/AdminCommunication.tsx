import { useState, useEffect } from 'react';
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
}

const AdminCommunication = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [activeTab, setActiveTab] = useState('announcements');

  // Form state for new announcement
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/admin/communication/announcements');
      setAnnouncements(response.data.data.docs || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
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
        }
      };
      await apiService.post('/admin/communication/announcements', payload);
      toast.success('Announcement created successfully!');
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        content: '',
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
      await apiService.put(`/admin/communication/announcements/${editingAnnouncement._id}`, formData);
      toast.success('Announcement updated successfully!');
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
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

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
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
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <Badge className={getPriorityColor(announcement.priority)}>
                            {announcement.priority}
                          </Badge>
                          <Badge className={getStatusColor(announcement.status)}>
                            {announcement.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{announcement.content}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {announcement.targetAudience.join(', ')}
                          </span>
                          {announcement.targetRegions.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {announcement.targetRegions.join(', ')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(announcement.schedule.publishAt).toLocaleDateString()}
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
                      <span>Recipients: {announcement.deliveryStats.totalRecipients}</span>
                      <span>Delivered: {announcement.deliveryStats.delivered}</span>
                      <span>Opened: {announcement.deliveryStats.opened}</span>
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
              <div className="text-gray-500 py-8 text-center">
                Coming soon: Search for any user, farmer, or buyer and send direct messages (email, SMS, or in-app).
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