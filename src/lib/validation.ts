import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요.")
    .max(100, "제목은 100자 이내로 입력해 주세요."),
  content: z
    .string()
    .trim()
    .min(10, "내용을 10자 이상 입력해주세요."),
});

export type PostInput = z.infer<typeof postSchema>;
