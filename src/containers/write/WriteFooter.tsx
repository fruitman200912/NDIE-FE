import React from "react";
import { UseFormHandleSubmit } from "react-hook-form";
import { PostInput } from "@/lib/validation";
import { useModalStore } from "@/store/modal";
import { CreateQA } from "@/app/api/q&a";
import { CreateAnnouncement } from "@/app/api/announcement";
import { useRouter } from "next/navigation";
import { useLoadingStore } from "@/store/loading";
import { useAuthStore } from "@/store/useAuthStore";

export default function WriteFooter({
  title,
  content,
  selectedOption,
  handleSubmit,
  isSubmitting,
}: {
  title: string;
  content: string;
  selectedOption: string;
  handleSubmit: UseFormHandleSubmit<PostInput>;
  isSubmitting: boolean;
}) {
  const { toggleModal } = useModalStore();
  const router = useRouter();
  const { setIsLoadingTrue, setIsLoadingFalse } = useLoadingStore();
  const { role } = useAuthStore();

  const ensureAdmin = () => {
    if (role !== "ADMIN") {
      alert("관리자 권한이 필요합니다.");
      router.push("/");
      return false;
    }
    return true;
  };

  const ensureLoggedIn = async () => {
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const { onAuthStateChanged } = await import("firebase/auth");

      const auth = await getFirebaseAuth();
      if (!auth) {
        alert("Firebase 인증이 초기화되지 않았습니다.");
        return null;
      }

      if (auth.currentUser) {
        return auth.currentUser;
      }

      return new Promise<{ displayName?: string | null; email?: string | null } | null>(
        (resolve) => {
          let resolved = false;

          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              unsubscribe();
              alert("로그인 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.");
              router.push("/login");
              resolve(null);
            }
          }, 10000);

          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!resolved) {
              if (user) {
                resolved = true;
                clearTimeout(timeout);
                unsubscribe();
                resolve(user);
              }
            }
          });
        }
      );
    } catch (e) {
      console.error("[WriteFooter] 로그인 확인 오류:", e);
      alert("로그인 확인 중 오류가 발생했습니다.");
      return null;
    }
  };

  const onSubmit = async () => {
    if (selectedOption === "") return alert("카테고리를 선택해주세요");

    if (selectedOption === "공지사항" || selectedOption === "활동") {
      if (!ensureAdmin()) return;
    }

    if (selectedOption === "활동") {
      toggleModal();
    } else if (selectedOption === "공지사항") {
      setIsLoadingTrue();
      const result = await CreateAnnouncement({ title, content });
      setIsLoadingFalse();
      if (result.status === 200) {
        router.push("/announcement");
      } else {
        alert(result.message || "공지사항 작성에 실패했습니다.");
      }
    } else if (selectedOption === "Q&A") {
      const user = await ensureLoggedIn();
      if (!user) return;

      setIsLoadingTrue();
      const username = user.displayName || user.email?.split("@")[0] || "익명";
      const result = await CreateQA({ title, content, username });
      setIsLoadingFalse();
      if (result.status === 200) {
        router.push("/qna");
      } else {
        alert(result.message || "Q&A 작성에 실패했습니다.");
      }
    }
  };

  return (
    <footer className="gap-4 h-[5.25rem] w-full fixed bottom-0 left-0 right-0 pl-15 pr-15 flex justify-end text-white items-center">
      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="bg-[#ED9735] text-white font-bold cursor-pointer h-[2.5rem] w-[6.5rem] rounded-[0.625rem] border-2 border-[#ED9735] text-sm flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "등록 중..." : "등록하기"}
      </button>
    </footer>
  );
}
