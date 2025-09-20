'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { T, useLanguage } from '@/app/language-provider';
import { createArtisanProfile } from '@/services/artisan-service';
import { artisanVoiceToListing } from '@/ai/flows/artisan-voice-to-listing'; // We need this for speech-to-text
import { enhanceArtisanStory } from '@/ai/flows/enhance-artisan-story';

export default function CreateArtisanProfilePage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const [name, setName] = useState('');
    const [story, setStory] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleVoiceToText = async (voiceRecordingDataUri: string) => {
        setIsProcessing(true);
        toast({
            title: t('Processing your story...'),
            description: t('Our AI is crafting a beautiful narrative for you.'),
        });
        
        try {
            // 1. Get transcript (re-using artisanVoiceToListing for speech-to-text part)
            const speechResult = await artisanVoiceToListing({
                photoDataUri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // Dummy image
                voiceRecordingDataUri
            });
            const transcript = speechResult.description; // We'll just grab the transcribed text
            
            if (!transcript) {
                throw new Error("Could not understand audio.");
            }

            // 2. Enhance the story
            const storyResult = await enhanceArtisanStory({ transcript });
            setStory(storyResult.enhancedStory);

            toast({
                title: t('Story Enhanced!'),
                description: t('We\'ve written your story. You can edit it below.'),
            });

        } catch (error) {
            console.error("Error processing voice story:", error);
            toast({
                variant: 'destructive',
                title: t('AI Processing Failed'),
                description: t('We couldn\'t process your voice recording. Please try again or type your story manually.'),
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const voiceRecordingDataUri = reader.result as string;
                        handleVoiceToText(voiceRecordingDataUri);
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Error accessing microphone:", error);
                toast({
                    variant: "destructive",
                    title: t("Microphone Access Denied"),
                    description: t("Please enable microphone permissions to use this feature."),
                });
            }
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        toast({
            title: t("Creating Your Profile..."),
            description: t("Setting up your new creative space.")
        });
        
        try {
            const newArtisanId = await createArtisanProfile({ name, story });
            toast({
                title: t("Profile Created!"),
                description: t("Redirecting you to your new dashboard...")
            });
            router.push(`/artisan/home?id=${newArtisanId}`);
        } catch (error) {
            console.error("Error creating profile:", error);
            toast({
                variant: "destructive",
                title: t("Failed to Create Profile"),
                description: t("There was an error saving your profile. Please try again."),
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl py-12">
            <h1 className="font-headline text-4xl md:text-5xl mb-4 text-center"><T>Tell Us About Yourself</T></h1>
            <p className="text-xl text-muted-foreground mb-12 text-center"><T>Create your artisan profile to get started.</T></p>
            
            <Card>
                <CardHeader>
                    <CardTitle><T>New Artisan Profile</T></CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name"><T>Your Name</T></Label>
                            <Input 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder={t("e.g., Meera Devi")} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="story"><T>Your Story</T></Label>
                            <Textarea 
                                id="story" 
                                value={story} 
                                onChange={(e) => setStory(e.target.value)} 
                                placeholder={t("Share your journey, your craft, and what inspires you.")} 
                                rows={6} 
                                required 
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label><T>Or, tell us your story:</T></Label>
                            <Button type="button" variant="outline" size="icon" onClick={toggleRecording} disabled={isProcessing}>
                                {isRecording ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                            </Button>
                        </div>

                        <Button type="submit" size="lg" disabled={isProcessing || !name || !story}>
                            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                            <T>Create Profile and Continue</T>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
