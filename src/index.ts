import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blog";
import { cors } from "hono/cors";
import { imageUploadRouter } from "./routes/imageUpload";
import { serveStatic } from "hono/cloudflare-workers";
//@ts-ignore
import manifest from "__STATIC_CONTENT_MANIFEST"
import { authMiddleware } from "./middleware";
import { saveListRouter } from "./routes/save_list";

const app = new Hono();

app.use('/api/*', cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use('/api/v1/save-list/*', authMiddleware)
//use [prisma Client] it inside each route hanler because sometimes these handler functions are independently brought up in these workers, you may lose access to global context if this happens thus you can't use client to interact with your db so its better to initialize inside each route handler.
app.use('/static/*', serveStatic({root:'./', manifest}))

app.route('/api/v1/user', userRouter)

app.route('/api/v1/blog', blogRouter)

app.route('/api/v1/uploads', imageUploadRouter)

app.route('/api/v1/save-list', saveListRouter)


export default app