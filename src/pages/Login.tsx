
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Github, Mail, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You've been logged in successfully!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login with " + provider,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-5">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-gray-200 dark:border-gray-600 dark:bg-gray-800 animate-fade-in">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-primary dark:text-white">Sign in</CardTitle>
            <Link to="/" className="text-accent hover:text-primary transition-colors dark:hover:text-white dark:text-gray-300 p-2">
              <ArrowLeft size={20} />
            </Link>
          </div>
          <CardDescription className="dark:text-gray-300 text-base">
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-500 py-6"
              onClick={() => handleSocialLogin("github")}
            >
              <Github className="h-5 w-5" />
              <span className="sr-only md:not-sr-only md:text-sm">Github</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-500 py-6"
              onClick={() => handleSocialLogin("google")}
            >
              <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
              </svg>
              <span className="sr-only md:not-sr-only md:text-sm">Google</span>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-text dark:text-gray-300">
                Or continue with
              </span>
            </div>
          </div>
          <form onSubmit={handleEmailLogin}>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="dark:text-white text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="dark:text-white text-base">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-accent hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                className="w-full mt-2 bg-primary hover:bg-primary-dark text-white dark:bg-blue-600 dark:hover:bg-blue-700 py-6 text-base" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2 pt-5">
          <div className="text-center text-sm text-muted-foreground dark:text-gray-300">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline font-medium text-accent hover:text-primary dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
