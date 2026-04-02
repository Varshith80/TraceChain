import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Factory, Store, ShoppingBag } from 'lucide-react';
import type { AppRole } from '@/types/fabric';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['manufacturer', 'retailer', 'consumer']),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'consumer' as AppRole,
    companyName: '',
    gstNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, signInWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle OAuth callback (Supabase redirects back with session in hash)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setGoogleLoading(true);
        const { error } = await signInWithGoogle(session.access_token);
        await supabase.auth.signOut(); // Clear Supabase session, we use our JWT
        setGoogleLoading(false);
        if (error) {
          toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
        }
      }
    };
    handleOAuthCallback();
  }, [signInWithGoogle, toast]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const route = user.role === 'admin' ? '/admin' 
        : user.role === 'manufacturer' ? '/manufacturer'
        : user.role === 'retailer' ? '/retailer'
        : '/consumer';
      navigate(route, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isSignUp) {
        const validation = signUpSchema.safeParse(formData);
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach(err => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          fullName: formData.fullName,
          companyName: formData.companyName,
          gstNumber: formData.gstNumber,
        });

        if (error) {
          toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        } else {
          toast({ 
            title: 'Account created!', 
            description: formData.role === 'consumer' 
              ? 'Welcome! You can now start verifying products.'
              : 'Your account is pending admin approval.'
          });
        }
      } else {
        const validation = loginSchema.safeParse(formData);
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach(err => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'consumer', label: 'Consumer', icon: ShoppingBag, desc: 'Verify products' },
    { value: 'retailer', label: 'Retailer', icon: Store, desc: 'Track inventory' },
    { value: 'manufacturer', label: 'Manufacturer', icon: Factory, desc: 'Create batches' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Join TraceChain to verify product authenticity' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select value={formData.role} onValueChange={(v: AppRole) => setFormData(prev => ({ ...prev, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            <span>{opt.label}</span>
                            <span className="text-muted-foreground">- {opt.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.role === 'manufacturer' || formData.role === 'retailer') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your Company Ltd."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                      <Input
                        id="gstNumber"
                        value={formData.gstNumber}
                        onChange={e => setFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {/* Google sign-in for consumers - only on sign-in or when signing up as consumer */}
            {(isSignUp ? formData.role === 'consumer' : true) && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={googleLoading}
                  onClick={async () => {
                    setGoogleLoading(true);
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin + window.location.pathname },
                      });
                      if (error) throw error;
                      // Redirect happens; OAuth callback effect will handle exchange
                    } catch (e: any) {
                      setGoogleLoading(false);
                      toast({ title: 'Google sign-in failed', description: e?.message || 'Enable Google provider in Supabase', variant: 'destructive' });
                    }
                  }}
                >
                  {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continue with Google
                </Button>
              </>
            )}
          </form>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <p>Already have an account? <button onClick={() => setIsSignUp(false)} className="text-primary hover:underline">Sign in</button></p>
            ) : (
              <p>Don't have an account? <button onClick={() => setIsSignUp(true)} className="text-primary hover:underline">Sign up</button></p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}