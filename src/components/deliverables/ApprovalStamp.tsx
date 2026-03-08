import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface ApprovalStampProps {
  status: string;
  reviewedAt?: string | null;
  reviewerName?: string | null;
}

export function ApprovalStamp({ status, reviewedAt, reviewerName }: ApprovalStampProps) {
  if (status !== "approved" && status !== "rejected") return null;

  const isApproved = status === "approved";

  return (
    <motion.div
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: isApproved ? -6 : 6 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className={`relative inline-flex flex-col items-center justify-center rounded-xl border-[3px] px-6 py-3 ${
        isApproved
          ? "border-green-500/60 bg-green-500/5"
          : "border-destructive/60 bg-destructive/5"
      }`}
    >
      <div className={`flex items-center gap-2 ${isApproved ? "text-green-500" : "text-destructive"}`}>
        {isApproved ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        <span className="font-display text-lg font-black uppercase tracking-widest">
          {isApproved ? "APPROVED" : "REJECTED"}
        </span>
      </div>
      {(reviewedAt || reviewerName) && (
        <div className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${isApproved ? "text-green-500/70" : "text-destructive/70"}`}>
          {reviewerName && <span>{reviewerName}</span>}
          {reviewerName && reviewedAt && <span> · </span>}
          {reviewedAt && <span>{new Date(reviewedAt).toLocaleDateString()}</span>}
        </div>
      )}
      {/* Decorative stamp border effect */}
      <div className={`absolute inset-0 rounded-xl border-2 border-dashed ${isApproved ? "border-green-500/20" : "border-destructive/20"} m-1`} />
    </motion.div>
  );
}
