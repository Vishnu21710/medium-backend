import { Hono } from "hono";
import { resizeImage, uploadToS3 } from "../utils";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import Image from "image-js";

export const imageUploadRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    BUCKET_NAME: string;
    BUCKET_REGION: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
  };
}>();

imageUploadRouter.post("/", async (c) => {
  const db = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const query = c.req.query();
    const body = await c.req.parseBody();
    console.log(body.file, "Req body");

    const isResize = query.resize === "true";

    const file = body.file as File;
    const BUCKET_NAME = c.env.BUCKET_NAME;
    const BUCKET_REGION = c.env.BUCKET_REGION;
    const aws_access_key = c.env.AWS_ACCESS_KEY_ID;
    const aws_secret = c.env.AWS_SECRET_ACCESS_KEY;

    // const accessKeyId = "";
    // const secretAccessKey = c.env.AWS_SECRET_ACCESS_KEY || "";
    // const bucket_name = c.env.BUCKET_NAME || "";
    // const bucket_region = c.env.BUCKET_REGION || "";

    // console.log(accessKeyId, secretAccessKey, bucket_name, bucket_region);

    const result = await uploadToS3(
      file,
      BUCKET_NAME,
      aws_access_key,
      aws_secret,
      isResize
    );

    if (Array.isArray(result)) {
      const image_formats = await db.image.create({
        data:{
          thumbnail: result[0],
          small: result[1],
          original: result[2]
        },
      }) 

      return c.json({
        image: image_formats
      })
    }

    return c.json({
      msg: "Image Uploaded",
      image: result,
    });
  } catch (error) {
    console.log(error);

    return c.json({
      msg: "Something went wrong",
    });
  }
});
