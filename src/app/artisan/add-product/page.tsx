
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Mic, Camera, StopCircle, Loader2, Wand2, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { artisanVoiceToListing, ArtisanVoiceToListingOutput } from '@/ai/flows/artisan-voice-to-listing';
import { generateDetailsFromImage } from '@/ai/flows/generate-product-details-from-image';
import { enhancePhoto } from '@/ai/flows/ai-photo-enhancement';
import { addProduct } from '@/services/artisan-service';
import { Progress } from '@/components/ui/progress';
import { T, useLanguage } from '@/app/language-provider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type NewProduct = Parameters<typeof addProduct>[1];

enum PageState {
  FORM,
  ENHANCING,
  ENHANCED,
  SUBMITTING,
}

function AddProductContent() {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const artisanId = searchParams.get('id');
  
  const [pageState, setPageState] = useState<PageState>(PageState.FORM);
  const [formData, setFormData] = useState<Partial<ArtisanVoiceToListingOutput>>({});
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImages, setEnhancedImages] = useState<string[]>([]);
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
            title: t('Camera Access Denied'),
            description: t('Please enable camera permissions in your browser settings.'),
          });
        }
      };
      getCameraPermission();
    }
  }, [showCamera, toast, t]);
  
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
            title: t("Image Missing"),
            description: t("Please upload or capture a photo first."),
        });
        return;
    }
    setIsGeneratingDetails(true);
    try {
        const result = await generateDetailsFromImage({ photoDataUri: originalImage });
        setFormData(prev => ({ ...prev, ...result }));
        toast({
            title: t("Product Details Generated!"),
            description: t("We've filled in the form based on the product image."),
        });
    } catch (error) {
        console.error("Error generating details from image:", error);
        toast({
            variant: "destructive",
            title: t("AI Processing Failed"),
            description: t("We couldn't analyze your photo. Please try again or fill the form manually."),
        });
    } finally {
        setIsGeneratingDetails(false);
    }
  };
  
  const handleGenerateDetailsFromVoice = async (voiceRecordingDataUri: string) => {
    if (!originalImage) {
        toast({
            variant: "destructive",
            title: t("Image Missing"),
            description: t("Please upload or capture a photo before describing your product."),
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
          title: t("Voice Description Mismatch"),
          description: t("Your voice description doesn't seem to match the product photo. Please try recording again."),
          duration: 5000,
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        ...result,
      }));
      toast({
        title: t("Product Details Generated!"),
        description: t("We've filled in the form with the details from your recording."),
      });
    } catch (error) {
      console.error("Error generating details from voice:", error);
      toast({
        variant: "destructive",
        title: t("AI Processing Failed"),
        description: t("We couldn't process your voice recording. Please try again or fill the form manually."),
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
            title: t("Upload a Photo First"),
            description: t("Please upload or capture a photo of your product before recording."),
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
            title: t("Microphone Access Denied"),
            description: t("Please enable microphone permissions in your browser settings."),
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
      setEnhancedImages(result.enhancedPhotoDataUris);
      setPageState(PageState.ENHANCED);
       toast({
        title: t("Images Enhanced!"),
        description: t("Our AI has generated 3 new images for you."),
      });
    } catch (error) {
       console.error("Error enhancing image:", error);
       toast({
        variant: "destructive",
        title: t("AI Enhancement Failed"),
        description: t("We couldn't enhance your image. Please try again."),
      });
      setPageState(PageState.FORM);
    }
  };

  const handleFinalSubmit = async (useEnhanced: boolean) => {
    setPageState(PageState.SUBMITTING);
    setUploadProgress(0);
    
    let imagesToSubmit: string[] = [];
    if (useEnhanced && enhancedImages.length > 0) {
        imagesToSubmit = enhancedImages;
    } else if (originalImage) {
        imagesToSubmit = [originalImage];
    }

    if (imagesToSubmit.length === 0 || !artisanId) {
      toast({ variant: 'destructive', title: t(imagesToSubmit.length === 0 ? 'No image to submit' : 'Artisan not found') });
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
      await addProduct(artisanId, productData, imagesToSubmit, setUploadProgress);
      toast({
          title: t("Masterpiece Listed!"),
          description: t("Your new product is now available in the marketplace."),
      });
      // A short delay to let the user see the "complete" state
      setTimeout(() => router.push(`/artisan/home?id=${artisanId}`), 1000);
    } catch (error) {
      console.error("Error submitting to backend:", error);
      toast({
          variant: 'destructive',
          title: t("Submission Failed"),
          description: t("There was an error listing your product. Please try again."),
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
                <h2 className="font-headline text-2xl mb-2"><T>Enhancing your photo...</T></h2>
                <p className="text-muted-foreground"><T>Our AI is working its magic. Please wait a moment.</T></p>
            </div>
        );
      case PageState.ENHANCED:
        if (enhancedImages.length === 0) return null;
        return (
          <div className="p-4 md:p-6">
            <Button variant="ghost" onClick={() => setPageState(PageState.FORM)} className="mb-4">
              <ArrowLeft className="mr-2" /> <T>Back to Edit</T>
            </Button>
            <h1 className="font-headline text-3xl text-center mb-2 text-primary"><T>Made Beautiful!</T></h1>
            <p className="text-muted-foreground text-center mb-8"><T>Review the AI-generated images.</T></p>
            
            <Carousel className="w-full max-w-lg mx-auto">
              <CarouselContent>
                {enhancedImages.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-0">
                           <Image src={img} alt={`Enhanced view ${index + 1}`} width={500} height={500} className="rounded-lg object-cover" />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>

            <div className="mt-8 text-center">
                <Button size="lg" onClick={() => handleFinalSubmit(true)}>
                    <Wand2 className="mr-2" /> <T>Looks Great, Create Listing</T>
                </Button>
            </div>
          </div>
        );
      case PageState.SUBMITTING:
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center h-96">
                {uploadProgress < 100 ? (
                  <>
                    <h2 className="font-headline text-2xl mb-4"><T>Listing your Masterpiece...</T></h2>
                    <Progress value={uploadProgress} className="w-full max-w-sm mb-2" />
                    <p className="text-muted-foreground font-mono">{Math.round(uploadProgress)}%</p>
                  </>
                ) : (
                  <>
                    <h2 className="font-headline text-2xl mb-2"><T>Upload Complete!</T></h2>
                    <p className="text-muted-foreground"><T>Finalizing your listing...</T></p>
                  </>
                )}

            </div>
        );
      case PageState.FORM:
      default:
        return (
          <>
            <CardHeader>
              <CardTitle><T>Product Details</T></CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateListing}>
                <div className="grid gap-6">

                  <div className="space-y-2">
                    <Label><T>1. Product Photo</T></Label>
                    <div className="flex items-center justify-center w-full">
                      <div className="w-full">
                        {originalImage ? (
                            <div className="relative">
                                <Image src={originalImage} alt={t("Uploaded preview")} width={400} height={400} className="object-contain h-full w-full rounded-lg" />
                                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setOriginalImage(null)}><T>Remove</T></Button>
                            </div>
                        ) : showCamera ? (
                          <div className="flex flex-col items-center gap-4">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary" autoPlay muted playsInline />
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle><T>Camera Access Required</T></AlertTitle>
                                    <AlertDescription>
                                    <T>Please allow camera access to use this feature.</T>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button type="button" onClick={handleCaptureFromCamera} disabled={!hasCameraPermission}>
                                <Camera className="mr-2" /> <T>Capture</T>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg bg-card hover:bg-secondary transition-colors text-center p-4">
                            <Button type="button" variant="outline" className="mb-4" onClick={() => document.getElementById('dropzone-file')?.click()}>
                                <Upload className="mr-2" /> <T>Upload a File</T>
                            </Button>
                            <p className="text-muted-foreground mb-2"><T>or</T></p>
                            <Button type="button" variant="outline" onClick={() => setShowCamera(true)}>
                                <Camera className="mr-2" /> <T>Use Camera</T>
                            </Button>
                            <p className="text-xs text-muted-foreground mt-4"><T>SVG, PNG, JPG or GIF</T></p>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                      <Label><T>2. Let AI help you</T></Label>
                      <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="w-full" onClick={toggleRecording} disabled={isGeneratingDetails || !originalImage}>
                              {isRecording && <StopCircle className="mr-2 h-4 w-4 text-red-500" />}
                              {!isRecording && <Mic className="mr-2 h-4 w-4" />}
                              {isRecording ? <T>Stop Recording</T> : <T>Describe with Voice</T>}
                          </Button>
                          <Button type="button" variant="outline" className="w-full" onClick={handleGenerateDetailsFromImage} disabled={isGeneratingDetails || !originalImage}>
                              <Wand2 className="mr-2 h-4 w-4" />
                              <T>Generate from Photo</T>
                          </Button>
                      </div>
                      {isGeneratingDetails && (
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <T>AI is thinking...</T>
                        </div>
                      )}
                      {!originalImage && <p className="text-xs text-muted-foreground text-center"><T>Please upload a photo before using AI tools.</T></p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productName"><T>3. Product Name</T></Label>
                    <Input id="productName" placeholder={t("e.g., 'Royal Elephant Pair'")} value={formData.productName || ''} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description"><T>4. Description</T></Label>
                    <Textarea id="description" placeholder={t("Describe your artwork, its story, and what makes it unique.")} value={formData.description || ''} onChange={handleInputChange} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="materials"><T>Materials</T></Label>
                        <Input id="materials" placeholder={t("e.g., Rosewood, Natural Pigments")} value={formData.materials || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="origin"><T>Origin</T></Label>
                        <Input id="origin" placeholder={t("e.g., Jaipur, Rajasthan")} value={formData.origin || ''} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inspiration"><T>Inspiration</T></Label>
                    <Input id="inspiration" placeholder={t("e.g., Royal heritage of Rajasthan")} value={formData.inspiration || ''} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price"><T>Price (₹)</T></Label>
                    <Input id="price" type="number" placeholder={t("e.g., 2300")} value={formData.price || ''} onChange={handleInputChange} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button type="submit" size="lg" disabled={!originalImage}>
                        <Wand2 className="mr-2 h-5 w-5" />
                        <T>Enhance with AI</T>
                    </Button>
                     <Button type="button" size="lg" variant="secondary" disabled={!originalImage} onClick={() => handleFinalSubmit(false)}>
                        <T>List without Enhancement</T>
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
            <h1 className="font-headline text-3xl md:text-4xl mb-2 text-center"><T>Add Your Masterpiece</T></h1>
            <p className="text-muted-foreground text-center mb-8">
                <T>Fill in the details below or use our AI tools to get started.</T>
            </p>
        </>
       )}
      <Card className="w-full transition-all">
        {renderContent()}
      </Card>
    </div>
  );
}


export default function AddProductPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddProductContent />
        </Suspense>
    )
}
