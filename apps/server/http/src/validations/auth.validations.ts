import z from 'zod'

export const loginRequestSchema = z.object({
    body : z.object({
        email: z.email("Invalid email address format"),
        password: z.string().min(6, "Password must be atleast 6 characters long")
    })
})

export const registerSchema = z.object({
    body: z.object({
        email: z.email("Invalid Email address Format"),
        password: z.string().min(6, "Password must be atleast 6 characters long"),
        name: z.string().min(3, "Minimum 3 characters required")
    })
})

export const requestVerificationEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    password: z.string().min(8),
  }),
});
