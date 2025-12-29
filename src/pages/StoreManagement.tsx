import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Store, CreditCard, Save, Upload, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface PaymentMethod {
  type: string;
  details: string;
}

export default function StoreManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({ type: '', details: '' });
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    routing_number: '',
  });

  useEffect(() => {
    if (user) {
      fetchStore();
    }
  }, [user]);

  const fetchStore = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('student_stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          navigate('/marketplace');
          toast.error('No store found. Please create one first.');
        }
        throw error;
      }

      setStore(data);
      setFormData({
        store_name: data.store_name || '',
        store_description: data.store_description || '',
      });
      setLogoPreview(data.store_logo_url || '');
      setPaymentMethods((data.payment_methods as unknown as PaymentMethod[]) || []);
      setBankDetails((data.bank_details as unknown as typeof bankDetails) || {
        account_name: '',
        account_number: '',
        bank_name: '',
        routing_number: '',
      });
    } catch (error: any) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be less than 5MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !user) return store?.store_logo_url;

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `store-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, logoFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const addPaymentMethod = () => {
    if (!newPaymentMethod.type || !newPaymentMethod.details) {
      toast.error('Please fill in payment method details');
      return;
    }
    setPaymentMethods([...paymentMethods, newPaymentMethod]);
    setNewPaymentMethod({ type: '', details: '' });
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || !store) return;

    if (!formData.store_name.trim()) {
      toast.error('Store name is required');
      return;
    }

    setSaving(true);

    try {
      let logoUrl = store.store_logo_url;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const { error } = await supabase
        .from('student_stores')
        .update({
          store_name: formData.store_name,
          store_description: formData.store_description,
          store_logo_url: logoUrl,
          payment_methods: paymentMethods as any,
          bank_details: bankDetails as any,
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('Store updated successfully!');
      fetchStore();
    } catch (error: any) {
      console.error('Error updating store:', error);
      toast.error(error.message || 'Failed to update store');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading store...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Store Management</h1>
              <p className="text-muted-foreground">Manage your student store settings</p>
            </div>
          </div>
          <Button onClick={() => navigate('/marketplace')} variant="outline">
            Back to Marketplace
          </Button>
        </div>

        {/* Store Info Card */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Information
          </h2>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Store Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Store logo" 
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="store_name">Store Name *</Label>
            <Input
              id="store_name"
              value={formData.store_name}
              onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="store_description">Store Description</Label>
            <Textarea
              id="store_description"
              value={formData.store_description}
              onChange={(e) => setFormData(prev => ({ ...prev, store_description: e.target.value }))}
              rows={4}
            />
          </div>
        </Card>

        {/* Payment Methods Card */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </h2>

          {/* Existing Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-2">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Badge variant="outline">{method.type}</Badge>
                    <p className="text-sm mt-1">{method.details}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaymentMethod(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Payment Method */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Label>Add Payment Method</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type (e.g., PayPal, Venmo)"
                value={newPaymentMethod.type}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, type: e.target.value }))}
              />
              <Input
                placeholder="Details (e.g., email or username)"
                value={newPaymentMethod.details}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, details: e.target.value }))}
              />
              <Button onClick={addPaymentMethod} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Bank Account Details (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={bankDetails.account_name}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routing_number">Routing Number</Label>
                <Input
                  id="routing_number"
                  value={bankDetails.routing_number}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, routing_number: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
