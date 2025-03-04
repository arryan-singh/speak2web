
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GitHub, Mail, Google, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
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
    // Simulate login process
    setTimeout(() => {
      toast({
        title: "Success",
        description: "You've been logged in successfully! (Demo only)",
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: "Social Login",
      description: `${provider} login would happen here (Demo only)`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-4">
      <Card className="w-full max-w-md shadow-lg border-gray-200 dark:border-gray-800 animate-fade-in">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold">Sign in</CardTitle>
            <Link to="/" className="text-accent hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </Link>
          </div>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => handleSocialLogin("Google")}
            >
              <Google className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:text-xs">Google</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => handleSocialLogin("GitHub")}
            >
              <GitHub className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:text-xs">GitHub</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center justify-center gap-2"
              onClick={() => handleSocialLogin("Email")}
            >
              <Mail className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:text-xs">Email</span>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-text">
                Or continue with
              </span>
            </div>
          </div>
          <form onSubmit={handleEmailLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-accent hover:text-primary underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="underline text-accent hover:text-primary transition-colors">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
