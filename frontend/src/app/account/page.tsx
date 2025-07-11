"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Key } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "../context/authContext"
import { Navigate } from "react-router-dom"
import { Spinner } from "@/components/ui/spinner"
import { AvatarCropper } from "../../components/avatarCropper";

const API_URL = "http://localhost:8080";

export default function AccountPage() {
  const { user, logout, login, token } = useAuth();
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // State for the profile form
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  // State for UI feedback
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  // STATE FOR THE CROPPER ---
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && token) {
        setIsFetchingProfile(true);
        try {
          const response = await fetch(`${API_URL}/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!response.ok) throw new Error("Could not load your profile data.");
          
          const profileData = await response.json();
          
          setFullName(profileData.full_name || user.fullName);
          setBio(profileData.bio || "");
          setWebsite(profileData.website || "");
          setAvatarUrl(profileData.avatar_url || "/placeholder.svg?height=80&width=80");

        } catch (error) {
          console.error("Failed to fetch profile", error);
          alert((error as Error).message);
        } finally {
          setIsFetchingProfile(false);
        }
      }
    };
    fetchProfile();
  }, [user, token]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setSaveStatus("saving");
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, bio, website }),
      });
      if (!response.ok) throw new Error("Failed to update profile.");
      const updatedProfile = await response.json();
      login({ user: { ...user, fullName: updatedProfile.full_name }, token });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      alert((error as Error).message);
      setSaveStatus("idle");
    }
  };

  //  This function OPENS THE CROPPER 
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImageSrc(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // This function UPLOADS THE CROPPED IMAGE 
  const handleUploadCroppedImage = async (croppedImageBlob: Blob) => {
    if (!user || !token) return;

    const formData = new FormData();
    formData.append("avatar", croppedImageBlob, 'avatar.png');

    try {
      const response = await fetch(`${API_URL}/profile/avatar?t=${new Date().getTime()}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload avatar.");
      }

      const data = await response.json();
      setAvatarUrl(data.avatarUrl); 
      alert("Avatar updated!");
    } catch (error) {
      alert((error as Error).message);
    }
  };
  
  const headerUser = {
    name: fullName,
    email: user.email,
    avatar: avatarUrl || "/placeholder.svg?height=32&width=32",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={headerUser} onLogout={logout} />
      
      <input type="file" ref={avatarFileRef} onChange={handleAvatarChange} hidden accept="image/*" />

      {/* --- ADD THE CROPPER COMPONENT TO THE PAGE --- */}
      <AvatarCropper
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={cropperImageSrc}
        onCropComplete={handleUploadCroppedImage}
      />

      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and security settings</p>
            </div>

            {isFetchingProfile ? (
              <div className="flex justify-center items-center h-96">
                <Spinner size="large" />
              </div>
            ) : (
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <form onSubmit={handleProfileUpdate}>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal information and profile settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={avatarUrl} alt={fullName} />
                            <AvatarFallback className="text-lg">{fullName ? fullName.charAt(0) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Button type="button" variant="outline" onClick={() => avatarFileRef.current?.click()}>Change Avatar</Button>
                            <p className="text-sm text-muted-foreground mt-2">JPG, GIF or PNG. 5MB max.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={user.email} disabled />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea id="bio" placeholder="Tell us about yourself" value={bio} onChange={(e) => setBio(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input id="website" placeholder="https://yourwebsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                        </div>

                        <Button type="submit" disabled={saveStatus !== 'idle'}>
                          {saveStatus === 'saving' && 'Saving...'}
                          {saveStatus === 'saved' && 'Saved!'}
                          {saveStatus === 'idle' && 'Save Changes'}
                        </Button>
                      </CardContent>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <Card><CardHeader><CardTitle>Password</CardTitle><CardDescription>Change your password to keep your account secure</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="currentPassword">Current Password</Label><Input id="currentPassword" type="password" /></div><div className="space-y-2"><Label htmlFor="newPassword">New Password</Label><Input id="newPassword" type="password" /></div><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm New Password</Label><Input id="confirmPassword" type="password" /></div><Button>Update Password</Button></CardContent></Card>
                  <Card><CardHeader><CardTitle>Two-Factor Authentication</CardTitle><CardDescription>Add an extra layer of security to your account</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">SMS Authentication</div><div className="text-sm text-muted-foreground">Receive codes via SMS</div></div><Switch /></div><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">Authenticator App</div><div className="text-sm text-muted-foreground">Use an authenticator app</div></div><Switch /></div></CardContent></Card>
                  <Card><CardHeader><CardTitle>API Keys</CardTitle><CardDescription>Manage your API keys for external integrations</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center justify-between p-3 border rounded-lg"><div><div className="font-medium">Production API Key</div><div className="text-sm text-muted-foreground">Created on Dec 15, 2024</div></div><Button variant="outline" size="sm">Regenerate</Button></div><Button variant="outline"><Key className="mr-2 h-4 w-4" />Create New API Key</Button></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="notifications" className="space-y-6">
                  <Card><CardHeader><CardTitle>Email Notifications</CardTitle><CardDescription>Choose what email notifications you'd like to receive</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">Project Updates</div><div className="text-sm text-muted-foreground">Get notified when projects are updated</div></div><Switch defaultChecked /></div><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">Team Invitations</div><div className="text-sm text-muted-foreground">Get notified when you're invited to teams</div></div><Switch defaultChecked /></div><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">Marketing Emails</div><div className="text-sm text-muted-foreground">Receive updates about new features</div></div><Switch /></div></CardContent></Card>
                  <Card><CardHeader><CardTitle>Push Notifications</CardTitle><CardDescription>Manage your push notification preferences</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">Build Notifications</div><div className="text-sm text-muted-foreground">Get notified when builds complete</div></div><Switch defaultChecked /></div><div className="flex items-center justify-between"><div className="space-y-0.5"><div className="text-sm font-medium">Collaboration</div><div className="text-sm text-muted-foreground">Get notified about team activity</div></div><Switch defaultChecked /></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="billing" className="space-y-6">
                  <Card><CardHeader><CardTitle>Current Plan</CardTitle><CardDescription>Manage your subscription and billing information</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between p-4 border rounded-lg"><div><div className="font-medium">Pro Plan</div><div className="text-sm text-muted-foreground">$29/month • Next billing: Jan 15, 2025</div></div><Badge>Active</Badge></div><div className="mt-4 space-x-2"><Button variant="outline">Change Plan</Button><Button variant="outline">Cancel Subscription</Button></div></CardContent></Card>
                  <Card><CardHeader><CardTitle>Payment Method</CardTitle><CardDescription>Update your payment information</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center space-x-3"><CreditCard className="h-8 w-8 text-muted-foreground" /><div><div className="font-medium">•••• •••• •••• 4242</div><div className="text-sm text-muted-foreground">Expires 12/2027</div></div></div><Button variant="outline" size="sm">Update</Button></div></CardContent></Card>
                  <Card><CardHeader><CardTitle>Billing History</CardTitle><CardDescription>View your past invoices and payments</CardDescription></CardHeader><CardContent><div className="space-y-3">{[{ date: "Dec 15, 2024", amount: "$29.00", status: "Paid" }, { date: "Nov 15, 2024", amount: "$29.00", status: "Paid" }, { date: "Oct 15, 2024", amount: "$29.00", status: "Paid" },].map((invoice, index) => (<div key={index} className="flex items-center justify-between p-3 border rounded-lg"><div><div className="font-medium">{invoice.date}</div><div className="text-sm text-muted-foreground">Pro Plan Subscription</div></div><div className="text-right"><div className="font-medium">{invoice.amount}</div><Badge variant="secondary" className="text-xs">{invoice.status}</Badge></div></div>))}</div></CardContent></Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}