export default function cloudfrontLoader({ src, width, quality }) {
  if (src.includes('coupon-app-image.s3.us-east-1.amazonaws.com')) {
    return src.replace('coupon-app-image.s3.us-east-1.amazonaws.com', 'd2o27hd92ee531.cloudfront.net');
  }
  return src;
}
