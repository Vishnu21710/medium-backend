import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Image from "image-js";

export const uploadToS3 = async (
  file: File,
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string,
  resize?: boolean
):Promise<string | string[]> => {
  try {
    const s3Client = new S3Client({
      region: "ap-south-1", // replace with your region
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const sizes = [
      {
        suffix: "thumbnail",
        width: 500,
      },
      {
        suffix: "small",
        width: 150,
      },
      {
        suffix: "original",
      },
    ];
    if(resize){

      const imageFormats = sizes.map(async (size) => {
        const newFileName = `${size.suffix}-pic_${Date.now().toString()}-${file.name}`;
  
        let image: File | Uint8Array = file;
  
        if (size?.width) {
          image = await resizeImage(file, size.width);
        }
  
        const params = {
          Bucket: bucketName,
          Key: newFileName,
          Body: image,
          ContentType: file.type,
        };
        const result = await s3Client.send(new PutObjectCommand(params));
  
        return `https://${bucketName}.s3.ap-south-1.amazonaws.com/${newFileName}`;
      });
  
  
      const formats = await Promise.all(imageFormats);
  
      return formats;
    }
      const newFileName = `pic_${Date.now().toString()}-${file.name}`;

      const params = {
        Bucket: bucketName,
        Key: newFileName,
        Body: file,
        ContentType: file.type,
      };
      const result = await s3Client.send(new PutObjectCommand(params));

      return `https://${bucketName}.s3.ap-south-1.amazonaws.com/${newFileName}`;

    
  } catch (error) {
    console.error(error);
    return "Image Failed to upload";
  }
};

export const resizeImage = async (file: File, width: number) => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const image = (await Image.load(uint8Array)).resize({
    width,
  });

  return image.toBuffer();
};
