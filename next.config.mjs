/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "coupon-app-image.s3.us-east-1.amazonaws.com",
        },
        {
          protocol: "https",
          hostname: "cdn.pixabay.com",
        },
        // Add more hostnames here if your blogs use other image sources
      ],
    },
  };
  
  export default nextConfig; // ✅ Use `export default` instead of `module.exports`
  