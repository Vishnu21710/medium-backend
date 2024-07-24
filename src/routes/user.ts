import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";
import { signinInput, signupInput } from "@oblivion_2171/medium-common";
import { getCookie, setCookie } from "hono/cookie";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  //[prisma Client]
  const { user } = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success, error } = signupInput.safeParse(body);

  if (!success) {
    c.status(400);

    return c.json({
      msg: error.issues[0].message,
    });
  }

  const newUser = await user.create({
    data: body,
    select: {
      id: true,
      email: true,
    },
  });

  const jwt_token = await sign({ id: newUser.id }, c.env.JWT_SECRET);

  const token_cookie = setCookie(c, "token", jwt_token);

  const resData = {
    id: newUser.id,
    email: newUser.email,
    jwt_token,
  };

  return c.json(resData);
});

userRouter.post("/signin", async (c) => {
  const { user } = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const { success, error } = signinInput.safeParse(body);

  if (!success) {
    c.status(400);
    return c.json({
      msg: error.issues[0].message,
    });
  }

  const getUser = await user.findUnique({
    where: {
      email: body.email,
      password: body.password,
    },
  });

  if (!getUser) {
    c.status(403);
    return c.json({
      msg: "Invalid Credentials or user does not exists",
    });
  }

  const jwt_token = await sign({ id: getUser.id }, c.env.JWT_SECRET);

  const token_cookie = setCookie(c, "token", jwt_token);

  return c.json({
    id: getUser.id,
    email: getUser.email,
    jwt_token,
  });
});

userRouter.get("/get-user", async (c) => {
  const { user } = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const token = c.req.query("token");

  console.log(c.req.query("token"));
  

  if(!token){
    c.status(403)
    return c.text("Unauthorized")
  }

  const response = await verify(token, c.env.JWT_SECRET);
  if(!response){
    c.status(403)
    return c.text("Unautorized / Invalid Token")
  }
  
  try {
    const user_details = await user.findUnique({
      where: {
        id: String(response.id),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    return c.json({
      user: user_details
    })
  } catch (error) {
    return c.json({
      msg: error
    })
  }
});
