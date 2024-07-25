import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blog";
import { cors } from "hono/cors";
import { imageUploadRouter } from "./routes/imageUpload";
import { authMiddleware } from "./middleware";
import { saveListRouter } from "./routes/save_list";

const app = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
        CORS: string
      };
}>();




app.use('/api/*', cors())
app.use('/api/v1/save-list/*', authMiddleware)


app.route('/api/v1/user', userRouter)

app.route('/api/v1/blog', blogRouter)

app.route('/api/v1/uploads', imageUploadRouter)

app.route('/api/v1/save-list', saveListRouter)


export default app