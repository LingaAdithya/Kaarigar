'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Mic, Camera, StopCircle, Loader2, Wand2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { artisanVoiceToListing, ArtisanVoiceToListingOutput } from '@/ai/flows/artisan-voice-to-listing';
import { generateDetailsFromImage } from '@/ai/flows/generate-product-details-from-image';
import { enhancePhoto } from '@/ai/flows/ai-photo-enhancement';
import { ImageComparisonSlider } from '@/components/image-comparison-slider';
import { addProduct } from '@/services/artisan-service';
import { Progress } from '@/components/ui/progress';

type NewProduct = Parameters<typeof addProduct>[0];

enum PageState {
  FORM,
  ENHANCING,
  ENHANCED,
  SUBMITTING,
}

export default function AddProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [pageState, setPageState] = useState<PageState>(PageState.FORM);
  const [formData, setFormData] = useState<Partial<ArtisanVoiceToListingOutput>>({});
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();
    }
  }, [showCamera, toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCaptureFromCamera = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setOriginalImage(dataUrl);
        }
        setShowCamera(false);
        if (videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  };

  const handleGenerateDetailsFromImage = async () => {
    if (!originalImage) {
        toast({
            variant: "destructive",
            title: "Image Missing",
            description: "Please upload or capture a photo first.",
        });
        return;
    }
    setIsGeneratingDetails(true);
    try {
        const result = await generateDetailsFromImage({ photoDataUri: originalImage });
        setFormData(prev => ({ ...prev, ...result }));
        toast({
            title: "Product Details Generated!",
            description: "We've filled in the form based on the product image.",
        });
    } catch (error) {
        console.error("Error generating details from image:", error);
        toast({
            variant: "destructive",
            title: "AI Processing Failed",
            description: "We couldn't analyze your photo. Please try again or fill the form manually.",
        });
    } finally {
        setIsGeneratingDetails(false);
    }
  };
  
  const handleGenerateDetailsFromVoice = async (voiceRecordingDataUri: string) => {
    if (!originalImage) {
        toast({
            variant: "destructive",
            title: "Image Missing",
            description: "Please upload or capture a photo before describing your product.",
        });
        return;
    }
    setIsGeneratingDetails(true);
    try {
      const result: ArtisanVoiceToListingOutput = await artisanVoiceToListing({ 
          photoDataUri: originalImage,
          voiceRecordingDataUri 
      });

      if (!result.isMatch) {
        toast({
          variant: "destructive",
          title: "Voice Description Mismatch",
          description: "Your voice description doesn't seem to match the product photo. Please try recording again.",
          duration: 5000,
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        ...result,
      }));
      toast({
        title: "Product Details Generated!",
        description: "We've filled in the form with the details from your recording.",
      });
    } catch (error) {
      console.error("Error generating details from voice:", error);
      toast({
        variant: "destructive",
        title: "AI Processing Failed",
        description: "We couldn't process your voice recording. Please try again or fill the form manually.",
      });
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!originalImage) {
        toast({
            variant: "destructive",
            title: "Upload a Photo First",
            description: "Please upload or capture a photo of your product before recording.",
        });
        return;
      }
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
            handleGenerateDetailsFromVoice(voiceRecordingDataUri);
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
            title: "Microphone Access Denied",
            description: "Please enable microphone permissions in your browser settings.",
        });
      }
    }
  };
  
  const handleCreateListing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!originalImage) return;

    setPageState(PageState.ENHANCING);
    try {
      const result = await enhancePhoto({ photoDataUri: originalImage });
      setEnhancedImage(result.enhancedPhotoDataUri);
      setPageState(PageState.ENHANCED);
       toast({
        title: "Image Enhanced!",
        description: "Our AI has worked its magic. Compare the results.",
      });
    } catch (error) {
       console.error("Error enhancing image:", error);
       toast({
        variant: "destructive",
        title: "AI Enhancement Failed",
        description: "We couldn't enhance your image. Please try again.",
      });
      setPageState(PageState.FORM);
    }
  };

  const handleFinalSubmit = async (useEnhancedImage = true) => {
    setPageState(PageState.SUBMITTING);
    setUploadProgress(0);
    const imageToSubmit = useEnhancedImage ? enhancedImage : originalImage;

    if (!imageToSubmit) {
      toast({ variant: 'destructive', title: 'No image to submit' });
      setPageState(PageState.FORM);
      return;
    }

    try {
      const productData: NewProduct = {
        name: formData.productName,
        description: formData.description,
        price: formData.price,
        materials: formData.materials,
        origin: formData.origin,
        inspiration: formData.inspiration,
      };
      await addProduct(productData, imageToSubmit, setUploadProgress);
      toast({
          title: "Masterpiece Listed!",
          description: "Your new product is now available in the marketplace.",
      });
      // A short delay to let the user see the "complete" state
      setTimeout(() => router.push('/artisan/home'), 1000);
    } catch (error) {
      console.error("Error submitting to backend:", error);
      toast({
          variant: 'destructive',
          title: "Submission Failed",
          description: "There was an error listing your product. Please try again.",
      });
      setPageState(PageState.FORM);
    }
  }

  const renderContent = () => {
    switch (pageState) {
      case PageState.ENHANCING:
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="font-headline text-2xl mb-2">Enhancing your photo...</h2>
                <p className="text-muted-foreground">Our AI is working its magic. Please wait a moment.</p>
            </div>
        );
      case PageState.ENHANCED:
        if (!originalImage || !enhancedImage) return null;
        return (
          <div className="p-4 md:p-6">
            <Button variant="ghost" onClick={() => setPageState(PageState.FORM)} className="mb-4">
              <ArrowLeft className="mr-2" /> Back to Edit
            </Button>
            <h1 className="font-headline text-3xl text-center mb-2 text-primary">Made Beautiful!</h1>
            <p className="text-muted-foreground text-center mb-8">Drag the slider to see the difference.</p>
            <ImageComparisonSlider 
                beforeImage={originalImage}
                afterImage={enhancedImage}
                beforeHint="original product photo"
                afterHint="enhanced product photo"
            />
            <div className="mt-8 text-center">
                <Button size="lg" onClick={() => handleFinalSubmit(true)}>
                    <Wand2 className="mr-2" /> Looks Great, Create Listing
                </Button>
            </div>
          </div>
        );
      case PageState.SUBMITTING:
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-96">
                {uploadProgress < 100 ? (
                  <>
                    <h2 className="font-headline text-2xl mb-4">Listing your Masterpiece...</h2>
                    <Progress value={uploadProgress} className="w-full max-w-sm mb-2" />
                    <p className="text-muted-foreground font-mono">{Math.round(uploadProgress)}%</p>
                  </>
                ) : (
                  <>
                    <h2 className="font-headline text-2xl mb-2">Upload Complete!</h2>
                    <p className="text-muted-foreground">Finalizing your listing...</p>
                  </>
                )}

            </div>
        );
      case PageState.FORM:
      default:
        return (
          <>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateListing}>
                <div className="grid gap-6">

                  <div className="space-y-2">
                    <Label>1. Product Photo</Label>
                    <div className="flex items-center justify-center w-full">
                      <div className="w-full">
                        {originalImage ? (
                            <div className="relative">
                                <Image src={originalImage} alt="Uploaded preview" width={400} height={400} className="object-contain h-full w-full rounded-lg" />
                                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setOriginalImage(null)}>Remove</Button>
                            </div>
                        ) : showCamera ? (
                          <div className="flex flex-col items-center gap-4">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary" autoPlay muted playsInline />
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                    Please allow camera access to use this feature.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button type="button" onClick={handleCaptureFromCamera} disabled={!hasCameraPermission}>
                                <Camera className="mr-2" /> Capture
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-card hover:bg-secondary transition-colors text-center p-4">
                            <Button type="button" variant="outline" className="mb-4" onClick={() => document.getElementById('dropzone-file')?.click()}>
                                <Upload className="mr-2" /> Upload a File
                            </Button>
                            <p className="text-muted-foreground mb-2">or</p>
                            <Button type="button" variant="outline" onClick={() => setShowCamera(true)}>
                                <Camera className="mr-2" /> Use Camera
                            </Button>
                            <p className="text-xs text-muted-foreground mt-4">SVG, PNG, JPG or GIF</p>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                      <Label>2. Let AI help you</Label>
                      <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={toggleRecording} disabled={isGeneratingDetails || !originalImage}>
                              {isRecording && <StopCircle className="mr-2 h-4 w-4 text-red-500" />}
                              {!isRecording && <Mic className="mr-2 h-4 w-4" />}
                              {isRecording ? 'Stop Recording' : 'Describe with Voice'}
                          </Button>
                          <Button type="button" variant="outline" className="w-full" onClick={handleGenerateDetailsFromImage} disabled={isGeneratingDetails || !originalImage}>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Generate from Photo
                          </Button>
                      </div>
                      {isGeneratingDetails && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            AI is thinking...
                        </div>
                      )}
                      {!originalImage && <p className="text-xs text-muted-foreground text-center">Please upload a photo before using AI tools.</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productName">3. Product Name</Label>
                    <Input id="productName" placeholder="e.g., 'Royal Elephant Pair'" value={formData.productName || ''} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">4. Description</Label>
                    <Textarea id="description" placeholder="Describe your artwork, its story, and what makes it unique." value={formData.description || ''} onChange={handleInputChange} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="materials">Materials</Label>
                        <Input id="materials" placeholder="e.g., Rosewood, Natural Pigments" value={formData.materials || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="origin">Origin</Label>
                        <Input id="origin" placeholder="e.g., Jaipur, Rajasthan" value={formData.origin || ''} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inspiration">Inspiration</Label>
                    <Input id="inspiration" placeholder="e.g., Royal heritage of Rajasthan" value={formData.inspiration || ''} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" placeholder="e.g., 2300" value={formData.price || ''} onChange={handleInputChange} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button type="submit" size="lg" disabled={!originalImage}>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Enhance with AI
                    </Button>
                     <Button type="button" size="lg" variant="secondary" disabled={!originalImage} onClick={() => handleFinalSubmit(false)}>
                        List without Enhancement
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>

                </div>
              </form>
            </CardContent>
          </>
        );
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
       {pageState === PageState.FORM && (
        <>
            <h1 className="font-headline text-3xl md:text-4xl mb-2 text-center">Add Your Masterpiece</h1>
            <p className="text-muted-foreground text-center mb-8">
                Fill in the details below or use our AI tools to get started.
            </p>
        </>
       )}
      <Card className="w-full transition-all">
        {renderContent()}
      </Card>
    </div>
  );
}
