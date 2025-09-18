'use client';

interface GoogleMapEmbedProps {
  origin: string;
}

export function GoogleMapEmbed({ origin }: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground text-center p-4">
          Google Maps API key is not configured. <br/> 
          Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.
        </p>
      </div>
    );
  }

  // URL-encode the origin to handle spaces and special characters
  const encodedOrigin = encodeURIComponent(origin);
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedOrigin}`;

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      src={mapSrc}
    ></iframe>
  );
}
