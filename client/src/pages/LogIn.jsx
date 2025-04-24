import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaCircleExclamation } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { signInStart, signInSuccess, signInFailure } from "../redux/auth/authSlice";
import apiClient from "@/utils/apiClient";

export default function LogIn({ className, ...props }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error: reduxError } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    dispatch(signInStart());

    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
    
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      } else {
        throw new Error("No token received from server.");
      }
    
      console.log("Login API Response:", response.data);
    
      if (response.data.user) {
        dispatch(signInSuccess(response.data.user));
        navigate("/donors", { replace: true });
      } else {
        throw new Error("Invalid login response.");
      }
    
    } catch (err) {
      console.error("Login Error:", err);
      dispatch(signInFailure(err.response?.data?.message || err.message));
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
    
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {error && (
                      <div className="mb-4 text-sm text-red-600 mt-3 flex items-center">
                        <FaCircleExclamation className="mr-2" />
                        {error}
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Log In"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don't have an account?{" "}
                  <Link to="/signup" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
