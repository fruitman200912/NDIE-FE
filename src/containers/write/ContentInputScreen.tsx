"use client";
import Image from "next/image";
import ArrowBottom from "@/assets/write/arrow-bottom.svg";
import BoldGray from "@/assets/write/boldGray.svg";
import Bold from "@/assets/write/bold.svg";
import ItalicGray from "@/assets/write/italicGray.svg";
import Italic from "@/assets/write/italic.svg";
import CancelLineGray from "@/assets/write/cancellineGray.svg";
import CancelLine from "@/assets/write/cancelline.svg";
import UnderlineGray from "@/assets/write/underlineGray.svg";
import UnderLine from "@/assets/write/underline.svg";
import ImgGray from "@/assets/write/imgGraymini.svg";
import Img from "@/assets/write/img.svg";
import React, { RefObject, useState } from "react";
import { FieldErrors } from "react-hook-form";
import { PostInput } from "@/lib/validation";

import { useAuthStore } from "@/store/useAuthStore";

export default function ContentInputScreen(
  { title,
    content,
    selectedOption,
    setContent,
    setSelectedOption,
    setTitle,
    fileRef,
    addText,
    contentRef,
    errors,
  }:
    {
      title: string,
      content: string,
      selectedOption: string,
      setContent: React.Dispatch<React.SetStateAction<string>>,
      setSelectedOption: React.Dispatch<React.SetStateAction<string>>,
      setTitle: React.Dispatch<React.SetStateAction<string>>,
      fileRef: RefObject<HTMLInputElement | null>;
      addText: (text: string, index: number) => void,
      contentRef: RefObject<HTMLTextAreaElement | null>,
      errors?: FieldErrors<PostInput>,
    }
) {

  const handleDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = contentRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // 현재 커서 위치에 Tab(4칸 공백) 삽입
      const value = textarea.value;
      textarea.value = value.substring(0, start) + "    " + value.substring(end);

      // 커서를 Tab이 삽입된 위치 뒤로 이동
      textarea.setSelectionRange(start + 4, start + 4);
    }
  }
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!contentRef.current) return;
    setContent(e.target.value)
    smart(e);
  }
  const smart = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value, selectionStart } = event.target;
    let updatedValue = value;

    const match = /<([\w가-힣]+)>$/.exec(value.slice(0, selectionStart));
    if (match) {
      const tagName = match[1];
      const closeTag = `</${tagName}>`;

      const hasCloseTag = value.slice(selectionStart).includes(closeTag);

      if (!hasCloseTag) {
        updatedValue = `${value.slice(0, selectionStart)}${closeTag}${value.slice(selectionStart)}`;
        setTimeout(() => {
          event.target.selectionStart = event.target.selectionEnd = selectionStart;
        }, 0);
      }

    }
    setContent(updatedValue);
  }


  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(true);
  const [under, setUnder] = useState(true);
  const [cancel, setCancel] = useState(true);
  const [img, setImg] = useState(true);

  const { role } = useAuthStore();
  const isAdmin = role === 'ADMIN';

  return (
    <div className="w-full h-full gap-4 bg-[#ffffff] flex justify-center flex-col pl-15 pr-15 pt-10 pb-10 items-center">
      <section className={"w-full flex items-center justify-start"}>
        <div className={"relative w-32 border border-[#5A5A5A] rounded-[0.325rem]"}>
          <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} className={"text-[#5A5A5A] appearance-none w-full pl-4 py-1  outline-none"}>
            <option disabled hidden value={""}>카테고리</option>
            {isAdmin && <option value={"공지사항"}>공지사항</option>}
            <option value={"Q&A"}>Q&A</option>
            {isAdmin && <option value={"활동"}>활동</option>}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
            <Image src={ArrowBottom} alt={"ArrowBottom"} />
          </div>
        </div>
      </section>
      <div className="w-full">
        <input
          className={"w-full h-12 text-3xl font-semibold outline-none"}
          placeholder={"제목을 입력해주세요"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          spellCheck="false"
        />
        {errors?.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>
      <div className="w-full overflow-scroll flex justify-center border-y-[1.5px] border-[#838383]  select-none">
        <div className="flex">
          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("# ", content.length + 6)}
          >
            h1
          </div>
          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("## ", content.length + 6)}
          >
            h2
          </div>
          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("### ", content.length + 6)}
          >
            h3
          </div>
          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("#### ", content.length + 6)}
          >
            h4
          </div>
        </div>

        <div className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[40px]">|</div>

        <div className="flex">
          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("****", content.length + 3)}
            onMouseEnter={() => setBold(false)}
            onMouseLeave={() => setBold(true)}
          >
            <Image src={bold ? BoldGray : Bold} alt="Bold" className="w-full" />
          </div>

          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("**", content.length + 2)}
            onMouseEnter={() => setItalic(false)}
            onMouseLeave={() => setItalic(true)}
          >
            <Image src={italic ? ItalicGray : Italic} alt="Italic" className="w-full" />
          </div>

          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("~~~~", content.length + 3)}
            onMouseEnter={() => setCancel(false)}
            onMouseLeave={() => setCancel(true)}
          >
            <Image src={cancel ? CancelLineGray : CancelLine} alt="Cancel" className="w-full" />
          </div>

          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("____", content.length + 3)}
            onMouseEnter={() => setUnder(false)}
            onMouseLeave={() => setUnder(true)}
          >
            <Image src={under ? UnderlineGray : UnderLine} alt="Under" className="w-full" />
          </div>
        </div>

        <div className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[40px]">|</div>

        <div className="flex gap-2">
          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.click();
              }
            }}
            onMouseEnter={() => setImg(false)}
            onMouseLeave={() => setImg(true)}
          >
            <Image src={img ? ImgGray : Img} alt="img" className="w-full" />
          </div>

          <div
            className="p-2 text-[18px] text-[#838383] flex justify-center items-center w-[50px] hover:bg-[#f3f3f3] hover:text-black hover:cursor-pointer"
            onClick={() => addText("---", content.length)}
          >
            hr
          </div>
        </div>
      </div>
      <div className="w-full h-full flex flex-col">
        <textarea
          className={"w-full h-full resize-none outline-none"}
          onKeyDown={(e) => handleDown(e)}
          placeholder={"내용을 입력해주세요"}
          value={content}
          ref={contentRef}
          onChange={(e) => handleInput(e)}
          spellCheck="false"
        />
        {errors?.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
        )}
      </div>
    </div>

  )
}