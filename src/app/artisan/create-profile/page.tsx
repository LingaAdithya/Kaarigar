
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
import { speechToText } from '@/ai/flows/speech-to-text';
import { enhanceArtisanStory } from '@/ai/flows/enhance-artisan-story';

export default function CreateArtisanProfilePage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();
    const [name, setName] = useState('');
    const [story, setStory] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTarget, setRecordingTarget] = useState<'name' | 'story' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleVoiceToText = async (voiceRecordingDataUri: string, target: 'name' | 'story') => {
        setIsProcessing(true);
        toast({
            title: target === 'name' ? t('Processing name...') : t('Processing your story...'),
            description: target === 'story' ? t('Our AI is crafting a beautiful narrative for you.') : undefined,
        });
        
        try {
            const result = await speechToText({ voiceRecordingDataUri });
            const transcript = result.transcript;
            
            if (!transcript) {
                throw new Error("Could not understand audio.");
            }

            if (target === 'story') {
                // Enhance the story
                const storyResult = await enhanceArtisanStory({ transcript });
                setStory(storyResult.enhancedStory);
                toast({
                    title: t('Story Enhanced!'),
                    description: t('We\'ve written your story. You can edit it below.'),
                });
            } else { // target === 'name'
                setName(transcript);
                 toast({
                    title: t('Name Captured!'),
                    description: t('We\'ve filled in your name.'),
                });
            }

        } catch (error) {
            console.error("Error processing voice input:", error);
            toast({
                variant: 'destructive',
                title: t('AI Processing Failed'),
                description: t('We couldn\'t process your voice recording. Please try again or type manually.'),
            });
        } finally {
            setIsProcessing(false);
            setRecordingTarget(null);
        }
    };

    const toggleRecording = async (target: 'name' | 'story') => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                audioChunksRef.current = [];
                setRecordingTarget(target);

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const voiceRecordingDataUri = reader.result as string;
                        handleVoiceToText(voiceRecordingDataUri, target);
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
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder={t("e.g., Meera Devi")} 
                                    required 
                                    className="flex-grow"
                                />
                                <Button type="button" variant="outline" size="icon" onClick={() => toggleRecording('name')} disabled={isProcessing}>
                                    {isRecording && recordingTarget === 'name' ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                                </Button>
                            </div>
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
                            <div className="flex items-center justify-between pt-2">
                                <Label><T>Or, tell us your story:</T></Label>
                                <Button type="button" variant="outline" size="icon" onClick={() => toggleRecording('story')} disabled={isProcessing}>
                                    {isRecording && recordingTarget === 'story' ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                                </Button>
                            </div>
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
