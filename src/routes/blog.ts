import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";
import { authMiddleware } from "../middleware";
import { createBlogInput, updateBlogInput } from "@oblivion_2171/medium-common";
import { getCookie } from "hono/cookie";
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/", async (c, next) => {
  const header = c.req.header("authorization") || "";

  const cookie_token = getCookie(c, "token") || "";

  const token = header.split(" ")[1];

  console.log(token);

  if (!token) {
    c.status(403);
    return c.json({
      status: "403",
      msg: "Unautorized / token missing",
    });
  }

  const response = await verify(token, c.env.JWT_SECRET);

  console.log(response, "jwt verified");

  if (response) {
    c.set("userId", String(response.id));
    return next();
  }

  c.status(403);

  return c.json({
    status: "403",
    msg: "Unauthorized",
  });
});

blogRouter.get("/bulk", async (c) => {
  const { post } = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await post.findMany({
      select: {
        title: true,
        content: true,
        description: true,
        publishedAt: true,
        id: true,
        user: {
          select: {
            name: true,
            id: true,
          },
        },
        save_lists: {
          select: {
            id: true,
            title: true,
          },
        },
        image: true,
      },
    });
    return c.json({
      blogs,
    });
  } catch (error) {
    c.status(400);
    return c.json({
      msg: error,
    });
  }
});

blogRouter.get("/:id", async (c) => {
  const { post } = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await post.findUnique({
      where: {
        id: c.req.param("id"),
      },
      select: {
        title: true,
        description: true,
        image: {
          select: {
            original: true,
            small: true,
            thumbnail: true,
          },
        },
        id: true,
        content: true,
        publishedAt: true,
        user: true
      },
    });
    return c.json(blog);
  } catch (error) {
    c.status(400);
    return c.json({
      msg: error,
    });
  }
});

blogRouter
  .route("/")
  .post(async (c) => {
    const body = await c.req.json();
    const db = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const { success, error } = createBlogInput.safeParse(body);

    if (!success) {
      c.status(400);
      return c.json({
        msg: error.issues[0].message,
      });
    }

    try {
      const newPost = await db.post.create({
        data: {
          title: body.title,
          content: body.content,
          description: body.description,
          published: body.published,
          authorId: c.get("userId"),
          image_id: body?.image_id,
        },
      });

      return c.json({
        id: newPost.id,
        title: newPost.title,
      });
    } catch (error) {
      c.status(400);
      return c.json({
        msg: error,
      });
    }
  })
  .put(async (c) => {
    const { post } = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
      const body = await c.req.json();
      const { success, error } = updateBlogInput.safeParse(body);

      if (!success) {
        c.status(400);
        return c.json({
          msg: error,
        });
      }

      const user_id = c.get("userId");
      console.log(user_id, "USER ID");

      console.log(body.id, "BLOG ID");
      

      const updatedBlog = await post.update({
        where: {
          id: body.id,
          authorId: user_id,
          
        },
        data: {
          title: body.title,
          content: body.content,
          description: body.description,
          image_id: body.image_id
        },
      });

      return c.json(updatedBlog);
    } catch (error) {
      c.status(400);
      console.log(error);
      
      return c.json({
        msg: error,
      });
    }
  })
  .delete(async (c) => {
    const db = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      const body = await c.req.json();
      const deletedPost = await db.post.delete({
        where: {
          id: body.id,
          authorId: c.get("userId")
        },
      });
      return c.json({
        msg: "blog deleted",
        id: deletedPost.id,
        title: deletedPost.title,
      });
    } catch (error) {
      console.log(error);

      return c.json({
        msg: "Failed to delete post",
      });
    }
  });

blogRouter.get("/blogs/:savelistId", async (c) => {
  const { post } = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { savelistId } = c.req.param();

  try {
    const blogs = await post.findMany({
      where: {
        save_lists: {},
      },
    });
  } catch (error) {}
});
