"use client";

import { useState } from "react";
import { deleteDramaAction } from "@/actions/adminActions";
import { Edit2, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useAlert } from "@/hooks/useAlert";

interface DramaRowProps {
  drama: any;
  onEdit: (drama: any) => void;
}

export default function DramaRow({ drama, onEdit }: DramaRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { showConfirm } = useAlert();

  const handleDelete = () => {
    showConfirm({
      title: `Xoá phim "${drama.name}"?`,
      message:
        "Tất cả tập phim cũng sẽ bị xoá. Hành động này không thể hoàn tác.",
      confirmText: "Xoá phim",
      variant: "danger",
      onConfirm: async () => {
        setIsDeleting(true);
        const result = await deleteDramaAction(drama._id.toString());
        if (result.success) {
          router.refresh();
        } else {
          toast.error("Lỗi", result.error || "Không thể xoá phim");
          setIsDeleting(false);
        }
      },
    });
  };

  return (
    <tr
      className={`hover:bg-gray-800/30 transition-colors ${isDeleting ? "opacity-50 grayscale" : ""}`}
    >
      <td className="p-4">
        <div className="relative group w-12 h-16">
          <img
            src={drama.thumb_url}
            alt={drama.name}
            className="w-full h-full object-cover rounded bg-gray-800 shadow-sm"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
            <ExternalLink size={14} className="text-white" />
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-white font-medium truncate max-w-xs">
          {drama.name}
        </div>
        <div className="text-gray-500 text-sm truncate max-w-xs">
          {drama.slug}
        </div>
      </td>
      <td className="p-4">
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${
            drama.status === "completed"
              ? "bg-green-500/10 text-green-400"
              : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {drama.status.toUpperCase()}
        </span>
      </td>

      <td className="p-4 text-gray-400 tabular-nums">
        {drama.view?.toLocaleString() || 0}
      </td>
      <td className="p-4 text-right space-x-1">
        <button
          onClick={() => onEdit(drama)}
          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
          title="Edit Meta"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          title="Delete Drama"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
