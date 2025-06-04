"use client"

import React, { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Button } from '@/components/ui/button'
import { 
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Image as ImageIcon, Table as TableIcon,
  Heading1, Heading2, Heading3, Undo, Redo, FileText
} from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Commencez à rédiger votre rapport...',
  className
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML())
    },
  })

  // Handle initial content
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="border rounded-md p-4 w-full h-[400px] flex items-center justify-center bg-muted">
        <span className="text-muted-foreground">Chargement de l'éditeur...</span>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="bg-muted p-2 border-b flex flex-wrap gap-1 items-center">
        <Toggle
          size="sm"
          pressed={editor?.isActive('bold')}
          onPressedChange={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Gras"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('italic')}
          onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italique"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('underline')}
          onPressedChange={() => editor?.chain().focus().toggleUnderline().run()}
          aria-label="Souligné"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle
          size="sm"
          pressed={editor?.isActive('heading', { level: 1 })}
          onPressedChange={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Titre 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('heading', { level: 2 })}
          onPressedChange={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Titre 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('heading', { level: 3 })}
          onPressedChange={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Titre 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle
          size="sm"
          pressed={editor?.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor?.chain().focus().setTextAlign('left').run()}
          aria-label="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor?.chain().focus().setTextAlign('center').run()}
          aria-label="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor?.chain().focus().setTextAlign('right').run()}
          aria-label="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle
          size="sm"
          pressed={editor?.isActive('bulletList')}
          onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('orderedList')}
          onPressedChange={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('URL de l\'image')
            if (url) {
              editor?.chain().focus().setImage({ src: url }).run()
            }
          }}
          aria-label="Insérer une image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            editor?.chain().focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }}
          aria-label="Insérer un tableau"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            aria-label="Annuler"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            aria-label="Rétablir"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditorContent 
        editor={editor} 
        className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  )
}
