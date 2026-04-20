import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  ImagePlus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Youtube as YoutubeIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: "Nhập nội dung bài viết..." }),
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: { class: "w-full aspect-video rounded-md my-4" },
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] p-3 focus:outline-none",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) uploadAndInsertImage(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync external content changes (e.g. when async-loaded record arrives after mount)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content && content !== current) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      const ext = file.name.split(".").pop() || "png";
      const path = `content/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, file);
      if (error) return;
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run();
    },
    [editor],
  );

  const addImageFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadAndInsertImage(file);
    };
    input.click();
  };

  const addYoutube = () => {
    const url = window.prompt(
      "Dán link YouTube (vd: https://www.youtube.com/watch?v=...)",
    );
    if (!url || !editor) return;
    editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
  };

  if (!editor) return null;

  const toolbarBtn = "h-8 w-8";

  return (
    <div className="rounded-md border bg-background">
      <div className="flex flex-wrap gap-1 border-b p-1.5">
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <span className="mx-1 my-1 w-px bg-border" />

        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().setTextAlign("left").run()} aria-label="Căn trái">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().setTextAlign("center").run()} aria-label="Căn giữa">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().setTextAlign("right").run()} aria-label="Căn phải">
          <AlignRight className="h-4 w-4" />
        </Button>

        <span className="mx-1 my-1 w-px bg-border" />

        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={addImageFromFile} aria-label="Chèn ảnh">
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={addYoutube} aria-label="Nhúng YouTube">
          <YoutubeIcon className="h-4 w-4" />
        </Button>

        <span className="mx-1 my-1 w-px bg-border" />

        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarBtn} onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
