"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, LogOut } from "lucide-react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { useUser } from "@/contexts/UserContext";

function GoogleIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
        </svg>
    );
}

export function AuthForm() {
    const router = useRouter();
    const { currentUser, login, logout, loading: userLoading } = useUser();
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const firstName = useMemo(() => {
        if (!currentUser?.name) return "there";
        return currentUser.name.split(" ")[0];
    }, [currentUser]);

    const handleGoogleSignIn = async () => {
        setAuthLoading(true);
        setError(null);
        try {
            await login();
            router.push("/transactions");
        } catch (err) {
            console.error(err);
            setError("Could not start Google sign-in. Please try again.");
        } finally {
            setAuthLoading(false);
        }
    };

    const handleContinue = () => {
        router.push("/transactions");
    };

    const handleSwitchAccount = async () => {
        try {
            await logout();
        } catch (err) {
            console.error(err);
            setError("There was an issue signing out. Please try again.");
        }
    };

    const isBusy = authLoading || userLoading;

    return (
        <div className="w-full max-w-xl">
            <Card className="border border-[#e3e6f0] bg-white shadow-lg rounded-3xl">
                <CardContent className="p-8 space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="h-44 w-44 sm:h-56 sm:w-56">
                            <Image
                                src="/Monopoluri_Logo.png"
                                alt="Monopoluri"
                                width={320}
                                height={320}
                                className="h-full w-full object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <motion.h2
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-3xl font-semibold text-[#1f2937]"
                        >
                            {currentUser ? `Welcome back, ${firstName}!` : "Sign in to continue"}
                        </motion.h2>
                        <p className="text-sm text-gray-600">
                            Connect with Google to view transactions, goals, and insights. Your data stays private to your account.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-[#e2445c]/30 bg-[#e2445c]/10 px-4 py-3 text-sm text-[#a5273c] text-left">
                            {error}
                        </div>
                    )}

                    {currentUser ? (
                        <div className="space-y-3">
                            <div className="rounded-xl border border-[#e3e6f0] bg-[#f7f9fc] px-4 py-3 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-xs text-gray-500">Signed in as</p>
                                    <p className="text-sm font-semibold text-[#1f2937]">{currentUser.name}</p>
                                </div>
                                <button
                                    onClick={handleSwitchAccount}
                                    className="flex items-center gap-2 text-sm text-[#5f6b7a] hover:text-[#1f2937]"
                                    disabled={isBusy}
                                >
                                    <LogOut size={16} />
                                    Switch
                                </button>
                            </div>
                            <Button
                                className="w-full h-12 justify-center gap-2"
                                size="lg"
                                onClick={handleContinue}
                                disabled={isBusy}
                            >
                                Continue
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="w-full h-12 justify-center gap-2"
                            size="lg"
                            onClick={handleGoogleSignIn}
                            disabled={isBusy}
                        >
                            {isBusy ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <GoogleIcon />
                                    Sign in with Google
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
